import { randomBytes, randomInt } from "crypto";
import { getResendApiKey, getResendFrom } from "./env";
import { getSupabaseAdmin } from "./supabaseAdmin";

const OTP_TTL_MS = 3 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function generateResetToken() {
  return randomBytes(24).toString("hex");
}

export async function findUserIdByEmail(email: string) {
  const admin = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();

  const { data: profile } = await admin
    .from("profiles")
    .select("user_id")
    .ilike("email", normalized)
    .maybeSingle();
  if (profile?.user_id) return profile.user_id as string;

  // Fallback: scan auth users (MVP scale)
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (found) return found.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

export async function sendOtpEmail(email: string, otp: string) {
  const apiKey = getResendApiKey();
  const from = getResendFrom();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "[ANA] 비밀번호 찾기 인증번호",
      html: `
        <div style="font-family:sans-serif;line-height:1.6">
          <p>ANA 비밀번호 찾기 인증번호입니다.</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>
          <p>인증번호는 <strong>3분</strong> 후 만료됩니다.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error: ${res.status} ${body.slice(0, 200)}`);
  }
}

export async function createAndSendOtp(email: string) {
  const admin = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();
  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    return { ok: false as const, message: "가입되지 않은 이메일입니다." };
  }

  const { data: latest } = await admin
    .from("otp_codes")
    .select("created_at, expires_at")
    .eq("email", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.expires_at && new Date(latest.expires_at).getTime() > Date.now()) {
    return {
      ok: false as const,
      message: "인증번호가 아직 유효합니다. 3분 후 재발송할 수 있어요.",
    };
  }

  const otp = generateOtp();
  const now = Date.now();
  const { error } = await admin.from("otp_codes").insert({
    email: normalized,
    otp,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + OTP_TTL_MS).toISOString(),
    verified: false,
  });
  if (error) {
    return { ok: false as const, message: "인증번호 저장에 실패했습니다." };
  }

  try {
    await sendOtpEmail(normalized, otp);
  } catch {
    return { ok: false as const, message: "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  return { ok: true as const };
}

export async function verifyOtp(email: string, otp: string) {
  const admin = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();
  const code = otp.trim();

  const { data: row } = await admin
    .from("otp_codes")
    .select("*")
    .eq("email", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return { ok: false as const, message: "인증번호가 만료되었습니다. 다시 시도해주세요." };
  }
  if (row.verified) {
    return { ok: false as const, message: "이미 사용된 인증번호입니다. 다시 요청해주세요." };
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false as const, message: "인증번호가 만료되었습니다. 다시 시도해주세요." };
  }
  if (row.otp !== code) {
    return { ok: false as const, message: "인증번호가 일치하지 않습니다." };
  }

  const resetToken = generateResetToken();
  const { error } = await admin
    .from("otp_codes")
    .update({
      verified: true,
      reset_token: resetToken,
      reset_token_expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    return { ok: false as const, message: "인증 처리에 실패했습니다." };
  }

  return { ok: true as const, resetToken };
}

export async function resetPasswordWithToken(
  email: string,
  resetToken: string,
  password: string
) {
  const admin = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();

  const { data: row } = await admin
    .from("otp_codes")
    .select("*")
    .eq("email", normalized)
    .eq("reset_token", resetToken)
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row || !row.reset_token_expires_at) {
    return { ok: false as const, message: "비밀번호 변경에 실패했습니다. 다시 시도해주세요." };
  }
  if (new Date(row.reset_token_expires_at).getTime() < Date.now()) {
    return { ok: false as const, message: "인증이 만료되었습니다. 다시 시도해주세요." };
  }

  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    return { ok: false as const, message: "가입되지 않은 이메일입니다." };
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) {
    return { ok: false as const, message: "비밀번호 변경에 실패했습니다. 다시 시도해주세요." };
  }

  await admin
    .from("otp_codes")
    .update({ reset_token: null, reset_token_expires_at: null })
    .eq("id", row.id);

  return { ok: true as const };
}

export { OTP_TTL_MS };

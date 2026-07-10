import { NextResponse } from "next/server";
import { createAndSendOtp } from "@/lib/server/otp";
import { rateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() || "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, message: "올바른 이메일 형식으로 입력해주세요." },
        { status: 400 }
      );
    }

    if (!rateLimit(`send-otp:${email}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { ok: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const result = await createAndSendOtp(email);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "서버 환경변수가 설정되지 않았습니다."
        : "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/server/otp";
import { rateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; otp?: string };
    const email = body.email?.trim().toLowerCase() || "";
    const otp = body.otp?.trim() || "";

    if (!email || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { ok: false, message: "인증번호가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    if (!rateLimit(`verify-otp:${email}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { ok: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const result = await verifyOtp(email, otp);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({ ok: true, resetToken: result.resetToken });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "서버 API 키 설정에 문제가 있습니다."
        : "인증 확인에 실패했습니다.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

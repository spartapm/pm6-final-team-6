import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/server/otp";
import { isValidPassword } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      resetToken?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase() || "";
    const resetToken = body.resetToken?.trim() || "";
    const password = body.password || "";

    if (!email || !resetToken) {
      return NextResponse.json(
        { ok: false, message: "비밀번호 변경에 실패했습니다. 다시 시도해주세요." },
        { status: 400 }
      );
    }
    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          ok: false,
          message: "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.",
        },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithToken(email, resetToken, password);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "서버 환경변수가 설정되지 않았습니다."
        : "비밀번호 변경에 실패했습니다. 다시 시도해주세요.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

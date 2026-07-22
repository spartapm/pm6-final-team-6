import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, message: "로그인 정보를 확인할 수 없습니다." },
        { status: 401 }
      );
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return NextResponse.json(
        { ok: false, message: "회원탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "서버 API 키 설정에 문제가 있습니다."
        : "회원탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

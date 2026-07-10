import { NextResponse } from "next/server";
import { searchNaverProducts } from "@/lib/server/naver";
import { rateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";
    if (!query) {
      return NextResponse.json({ ok: false, message: "검색어를 입력해주세요.", items: [] }, { status: 400 });
    }

    if (!rateLimit(`product-search:${query.slice(0, 40)}`, 30, 60 * 1000)) {
      return NextResponse.json(
        { ok: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", items: [] },
        { status: 429 }
      );
    }

    const items = await searchNaverProducts(query, 20);
    return NextResponse.json({
      ok: true,
      items: items.map((item) => ({
        title: item.title,
        image: item.image,
        brand: item.brand,
        id: item.id,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "서버 환경변수가 설정되지 않았습니다."
        : "제품 검색에 실패했어요. 직접 제품 등록하기를 이용해주세요.";
    return NextResponse.json({ ok: false, message, items: [] }, { status: 502 });
  }
}

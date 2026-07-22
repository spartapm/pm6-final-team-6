import { NextResponse } from "next/server";
import { ROUTINE_CATEGORIES } from "@/lib/constants";
import { searchNaverProducts } from "@/lib/server/naver";
import { rateLimit } from "@/lib/server/rateLimit";
import type { RoutineStepCategory } from "@/lib/types";

export const runtime = "nodejs";

function parseCategory(value: string | null): RoutineStepCategory | undefined {
  if (!value) return undefined;
  return ROUTINE_CATEGORIES.includes(value as RoutineStepCategory)
    ? (value as RoutineStepCategory)
    : undefined;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";
    const category = parseCategory(searchParams.get("category"));

    if (!query) {
      return NextResponse.json({ ok: false, message: "검색어를 입력해주세요.", items: [] }, { status: 400 });
    }

    if (!rateLimit(`product-search:${query.slice(0, 40)}:${category ?? "all"}`, 30, 60 * 1000)) {
      return NextResponse.json(
        { ok: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", items: [] },
        { status: 429 }
      );
    }

    const items = await searchNaverProducts(query, 20, category);
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
        ? "서버 API 키 설정에 문제가 있습니다."
        : "제품 검색에 실패했어요. 직접 제품 등록하기를 이용해주세요.";
    return NextResponse.json({ ok: false, message, items: [] }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { generateRoutineRecommendation } from "@/lib/server/claude";
import { rateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      skinType?: string;
      concern?: string;
      sensitivity?: string;
    };
    const skinType = body.skinType?.trim() || "";
    const concern = body.concern?.trim() || "";
    const sensitivity = body.sensitivity?.trim() || "";

    if (!skinType || !concern || !sensitivity) {
      return NextResponse.json(
        { ok: false, message: "피부 프로필 정보가 부족합니다." },
        { status: 400 }
      );
    }

    const key = `recommend:${skinType}:${concern}:${sensitivity}`;
    if (!rateLimit(key, 6, 60 * 1000)) {
      return NextResponse.json(
        { ok: false, message: "잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const result = await generateRoutineRecommendation({
      skinType,
      concern,
      sensitivity,
    });

    return NextResponse.json({
      ok: true,
      title: result.title,
      steps: result.steps.map((step) => ({
        category: step.category,
        productName: step.productName,
        brand: step.brand,
        imageUrl: step.imageUrl,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "서버 API 키 설정에 문제가 있습니다."
        : "추천 루틴을 불러오지 못했어요. 다시 시도해주세요";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}

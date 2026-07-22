import { getAnthropicApiKey } from "./env";
import { findProductImage } from "./naver";

export type RecommendInput = {
  skinType: string;
  concern: string;
  sensitivity: string;
};

export type RecommendStep = {
  category: string;
  productName: string;
  brand?: string;
  imageUrl?: string;
};

export type RecommendResult = {
  title: string;
  steps: RecommendStep[];
};

const MODEL = "claude-haiku-4-5-20251001";

const CATEGORIES = ["클렌징", "토너", "세럼", "앰플", "크림", "선크림", "마스크", "기타"];

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Invalid Claude response");
  return JSON.parse(raw.slice(start, end + 1)) as {
    title?: string;
    steps?: Array<{ category?: string; productName?: string; brand?: string }>;
  };
}

export async function generateRoutineRecommendation(
  input: RecommendInput
): Promise<RecommendResult> {
  const apiKey = getAnthropicApiKey();
  const prompt = `당신은 한국 스킨케어 루틴 추천 어시스턴트입니다.
사용자 피부 정보:
- 피부타입: ${input.skinType}
- 피부고민: ${input.concern}
- 피부 민감도: ${input.sensitivity}

실제 시중에서 구하기 쉬운 한국 화장품 제품명으로 4~5단계 루틴을 추천하세요.
카테고리는 다음 중 하나만 사용: ${CATEGORIES.join(", ")}
JSON만 응답하세요. 형식:
{"title":"루틴 제목","steps":[{"category":"클렌징","productName":"제품명","brand":"브랜드"}]}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Claude API error: ${res.status} ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text || "";
    const parsed = extractJson(text);
    const steps = (parsed.steps || [])
      .filter((s) => s.productName && s.category)
      .slice(0, 6)
      .map((s) => ({
        category: CATEGORIES.includes(s.category || "") ? (s.category as string) : "기타",
        productName: String(s.productName).trim(),
        brand: s.brand ? String(s.brand).trim() : undefined,
      }));

    if (steps.length === 0) {
      throw new Error("Empty recommendation");
    }

    const withImages = await Promise.all(
      steps.map(async (step) => {
        const query = [step.brand, step.productName].filter(Boolean).join(" ");
        const imageUrl = await findProductImage(query);
        return { ...step, imageUrl };
      })
    );

    return {
      title: parsed.title?.trim() || `${input.concern} 맞춤 루틴`,
      steps: withImages,
    };
  } finally {
    clearTimeout(timer);
  }
}

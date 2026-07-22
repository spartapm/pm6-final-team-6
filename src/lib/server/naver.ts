import { getNaverCredentials } from "./env";
import type { RoutineStepCategory } from "@/lib/types";

export type NaverProduct = {
  id: string;
  title: string;
  image: string;
  brand?: string;
};

/** 루틴 단계 → 네이버 쇼핑 category2/3/4·상품명 매칭 키워드 */
const STEP_CATEGORY_KEYWORDS: Record<Exclude<RoutineStepCategory, "기타">, string[]> = {
  클렌징: [
    "클렌징",
    "클렌저",
    "세안",
    "메이크업리무버",
    "클렌징오일",
    "클렌징워터",
    "클렌징밤",
    "폼클렌징",
    "클렌징폼",
    "페이셜워시",
  ],
  토너: ["토너", "스킨/토너", "스킨", "토닉", "미스트", "패드"],
  세럼: ["세럼", "에센스", "트리트먼트"],
  앰플: ["앰플"],
  크림: ["크림", "로션", "젤크림", "수분크림", "영양크림", "아이크림", "올인원"],
  선크림: ["선크림", "선케어", "선블록", "선스틱", "자외선", "선쿠션", "톤업선"],
  마스크: ["마스크", "팩", "시트마스크", "워시오프", "필오프", "모델링팩", "마스크/팩"],
};

const SUNCARE_KEYWORDS = STEP_CATEGORY_KEYWORDS["선크림"];

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

/** 네이버 쇼핑 대분류: 화장품/미용만 통과 */
function isBeautyCategory(category1?: string) {
  if (!category1) return false;
  return category1.includes("화장품") || category1.includes("미용");
}

function includesAny(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

/** 선택된 루틴 단계와 네이버 category2/3/4·상품명 매칭 */
export function matchesRoutineCategory(
  category: RoutineStepCategory | undefined,
  fields: {
    title?: string;
    category2?: string;
    category3?: string;
    category4?: string;
  }
) {
  if (!category || category === "기타") return true;

  const haystack = [fields.category2, fields.category3, fields.category4, fields.title]
    .filter(Boolean)
    .join(" ");

  if (!haystack) return false;

  // 크림 단계에서는 선케어 제품을 제외
  if (category === "크림" && includesAny(haystack, SUNCARE_KEYWORDS)) {
    return false;
  }

  // 세럼 단계에서는 앰플을 제외 (앰플 단계와 구분)
  if (category === "세럼" && includesAny(haystack, STEP_CATEGORY_KEYWORDS["앰플"])) {
    return false;
  }

  return includesAny(haystack, STEP_CATEGORY_KEYWORDS[category]);
}

export function buildCategorySearchQuery(query: string, category?: RoutineStepCategory) {
  const trimmed = query.trim();
  if (!trimmed) return "";
  if (!category || category === "기타") return trimmed;
  if (trimmed.includes(category)) return trimmed;
  return `${trimmed} ${category}`;
}

export async function searchNaverProducts(
  query: string,
  display = 20,
  category?: RoutineStepCategory
): Promise<NaverProduct[]> {
  const { clientId, clientSecret } = getNaverCredentials();
  const searchQuery = buildCategorySearchQuery(query, category);
  const url = new URL("https://openapi.naver.com/v1/search/shop.json");
  url.searchParams.set("query", searchQuery);
  // 카테고리 필터 후 부족할 수 있어 여유분 요청
  const fetchCount = category && category !== "기타" ? Math.min(Math.max(display * 4, 40), 100) : Math.min(Math.max(display * 2, 20), 100);
  url.searchParams.set("display", String(fetchCount));
  url.searchParams.set("sort", "sim");
  url.searchParams.set("exclude", "used:rental:overseas");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Naver API error: ${res.status}`);
    }

    const data = (await res.json()) as {
      items?: Array<{
        productId?: string;
        title?: string;
        image?: string;
        brand?: string;
        maker?: string;
        lprice?: string;
        category1?: string;
        category2?: string;
        category3?: string;
        category4?: string;
      }>;
    };

    return (data.items ?? [])
      .filter((item) => isBeautyCategory(item.category1))
      .filter((item) =>
        matchesRoutineCategory(category, {
          title: stripHtml(item.title || ""),
          category2: item.category2,
          category3: item.category3,
          category4: item.category4,
        })
      )
      .map((item, index) => ({
        id: item.productId || `naver_${index}_${Date.now()}`,
        title: stripHtml(item.title || ""),
        image: item.image || "",
        brand: item.brand || item.maker || undefined,
      }))
      .filter((item) => item.title)
      .slice(0, display);
  } finally {
    clearTimeout(timer);
  }
}

export async function findProductImage(productName: string) {
  try {
    const items = await searchNaverProducts(productName, 1);
    return items[0]?.image || "";
  } catch {
    return "";
  }
}

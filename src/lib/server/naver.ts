import { getNaverCredentials } from "./env";

export type NaverProduct = {
  id: string;
  title: string;
  image: string;
  brand?: string;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

/** 네이버 쇼핑 대분류: 화장품/미용만 통과 */
function isBeautyCategory(category1?: string) {
  if (!category1) return false;
  return category1.includes("화장품") || category1.includes("미용");
}

export async function searchNaverProducts(query: string, display = 20): Promise<NaverProduct[]> {
  const { clientId, clientSecret } = getNaverCredentials();
  const url = new URL("https://openapi.naver.com/v1/search/shop.json");
  url.searchParams.set("query", query);
  // 필터 후 부족할 수 있어 여유분 요청
  url.searchParams.set("display", String(Math.min(Math.max(display * 2, 20), 100)));
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
      }>;
    };

    return (data.items ?? [])
      .filter((item) => isBeautyCategory(item.category1))
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

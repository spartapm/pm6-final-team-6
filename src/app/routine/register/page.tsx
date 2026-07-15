"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { TextInput } from "@/components/ui/Field";
import { trackEvent } from "@/lib/analytics";
import { ROUTINE_CATEGORIES, uid } from "@/lib/constants";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { createRoutine, showToast } from "@/lib/store";
import type { Product, RoutineStepCategory } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

type DraftStep = {
  id: string;
  category: RoutineStepCategory;
  product: Product;
};

type RecommendPayload = {
  id?: string;
  title: string;
  steps: Array<{
    category: RoutineStepCategory;
    product: Product;
  }>;
};

function ImpactCircle({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-faint text-sm font-extrabold text-accent">
      {children}
    </span>
  );
}

function ProductThumb({
  src,
  label,
  size = "md",
}: {
  src?: string | null;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${box} rounded-[12px] object-cover`} />;
  }
  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center rounded-[12px] bg-surface-empty text-[10px] font-bold text-ink-muted`}
    >
      {label ?? "이미지"}
    </div>
  );
}

export default function RoutineRegisterPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, profile } = useAppDerivations();
  const [tab, setTab] = useState<"manual" | "recommend">("manual");
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"search" | "custom">("search");
  const [selectedCategory, setSelectedCategory] =
    useState<RoutineStepCategory>("클렌징");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customName, setCustomName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recommend, setRecommend] = useState<RecommendPayload | null>(null);
  const [recApplied, setRecApplied] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const sheetHistoryRef = useRef(false);
  const closingSheetRef = useRef(false);

  const closeSheet = (action: "complete" | "cancel") => {
    trackEvent("popup_close", { action });
    closingSheetRef.current = true;
    setSheetOpen(false);
    if (sheetHistoryRef.current) {
      sheetHistoryRef.current = false;
      window.history.back();
    }
  };

  const openSheet = () => {
    setSheetOpen(true);
    window.history.pushState({ anaSheet: true }, "");
    sheetHistoryRef.current = true;
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/routine/register");
    else if (!profile) router.replace("/skin-profile");
  }, [hydrated, state.isLoggedIn, profile, router]);

  useEffect(() => {
    const onPopState = () => {
      if (closingSheetRef.current) {
        closingSheetRef.current = false;
        return;
      }
      if (sheetOpen) {
        sheetHistoryRef.current = false;
        setSheetOpen(false);
        trackEvent("popup_close", { action: "cancel" });
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen || sheetTab !== "search") return;
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");
      try {
        const res = await fetch(`/api/products/search?query=${encodeURIComponent(q)}`);
        const data = (await res.json()) as {
          ok?: boolean;
          message?: string;
          items?: Array<{ id: string; title: string; image: string; brand?: string }>;
        };
        if (!res.ok || !data.ok) {
          setSearchResults([]);
          setSearchError(
            data.message || "제품 검색에 실패했어요. 직접 제품 등록하기를 이용해주세요."
          );
          return;
        }
        setSearchResults(
          (data.items || []).map((item) => ({
            id: item.id,
            name: item.title,
            brand: item.brand,
            imageUrl: item.image,
            category: selectedCategory,
          }))
        );
      } catch {
        setSearchResults([]);
        setSearchError("제품 검색에 실패했어요. 직접 제품 등록하기를 이용해주세요.");
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query, sheetOpen, sheetTab, selectedCategory]);

  const dirty = steps.length > 0 || recApplied;

  if (!hydrated || !profile) {
    return (
      <AppShell showNav={false}>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  const loadRecommend = async () => {
    const previousId = recommend?.id;
    setRecLoading(true);
    setRecError("");
    setRecApplied(false);
    try {
      const res = await fetch("/api/routines/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinType: profile.skinType,
          concern: profile.concerns[0],
          sensitivity: profile.sensitivity,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        title?: string;
        steps?: Array<{
          category: string;
          productName: string;
          brand?: string;
          imageUrl?: string;
        }>;
      };
      if (!res.ok || !data.ok || !data.steps?.length) {
        setRecommend(null);
        setRecError(data.message || "추천할 수 있는 루틴이 없어요");
        return;
      }
      const nextId = uid("r");
      setRecommend({
        id: nextId,
        title: data.title || `${profile.skinType} · ${profile.concerns[0]} 맞춤 루틴`,
        steps: data.steps.map((step) => ({
          category: (ROUTINE_CATEGORIES.includes(step.category as RoutineStepCategory)
            ? step.category
            : "기타") as RoutineStepCategory,
          product: {
            id: uid("rec"),
            name: step.productName,
            brand: step.brand,
            imageUrl: step.imageUrl,
            category: (ROUTINE_CATEGORIES.includes(step.category as RoutineStepCategory)
              ? step.category
              : "기타") as RoutineStepCategory,
          },
        })),
      });
      if (previousId) {
        trackEvent("recommend_reshuffle", { previous_recommend_id: previousId });
      }
    } catch {
      setRecommend(null);
      setRecError("추천할 수 있는 루틴이 없어요");
    } finally {
      setRecLoading(false);
    }
  };

  const concernJoined = profile.concerns.join("·");

  return (
    <AppShell showNav={false}>
      <PageHeader
        title="루틴 등록"
        subtitle="회원님의 피부 고민에 맞는 루틴을 찾았어요"
        center
        onBack={() => {
          if (sheetOpen) {
            closeSheet("cancel");
            return;
          }
          if (dirty) setConfirmOpen(true);
          else router.replace("/care-log");
        }}
      />

      <div className="page-pad mt-4 space-y-4 pb-10 animate-fade-up">
        {/* Mode tabs */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setTab("manual");
              setRecApplied(false);
            }}
            className={`rounded-[16px] border p-3.5 text-left transition ${
              tab === "manual"
                ? "border-line bg-surface-card shadow-card"
                : "border-line/40 bg-surface-card/70"
            }`}
          >
            <p className="text-[13px] font-extrabold text-ink">직접 루틴 만들기</p>
            <p className="mt-1 text-[11px] leading-snug text-ink-muted">
              내가 직접 제품을 추가해요
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("recommend");
              setSteps([]);
              void loadRecommend();
            }}
            className={`rounded-[16px] border p-3.5 text-left transition ${
              tab === "recommend"
                ? "border-line bg-surface-card shadow-card"
                : "border-line/40 bg-surface-card/70"
            }`}
          >
            <p className="text-[13px] font-extrabold text-ink">피부 고민 맞춤 추천</p>
            <p className="mt-1 text-[11px] leading-snug text-ink-muted">
              고민에 맞춘 루틴을 추천받아요
            </p>
          </button>
        </div>

        {tab === "manual" ? (
          <>
            <Card className="!p-4 space-y-3">
              <div>
                <h2 className="text-[15px] font-extrabold text-ink">루틴 순서 설정</h2>
                <p className="mt-1 text-xs text-ink-muted">
                  루틴에서 사용할 제품 순서를 설정해 주세요.
                </p>
              </div>

              {steps.length === 0 && (
                <p className="py-3 text-center text-sm text-ink-muted">
                  단계 추가하기를 눌러 루틴을 구성해보세요
                </p>
              )}

              {steps.map((step) => (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => setDragId(step.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragId || dragId === step.id) return;
                    setSteps((prev) => {
                      const from = prev.findIndex((s) => s.id === dragId);
                      const to = prev.findIndex((s) => s.id === step.id);
                      if (from < 0 || to < 0) return prev;
                      const next = [...prev];
                      const [item] = next.splice(from, 1);
                      next.splice(to, 0, item);
                      return next;
                    });
                    setDragId(null);
                  }}
                  className="flex items-center gap-2.5 rounded-[14px] bg-white shadow-card px-3 py-3"
                >
                  <button
                    type="button"
                    className="disabled:opacity-40"
                    disabled={steps.length <= 1}
                    onClick={() => {
                      if (steps.length <= 1) {
                        showToast("루틴은 최소 1개 단계가 필요해요.");
                        return;
                      }
                      setSteps((prev) => prev.filter((s) => s.id !== step.id));
                    }}
                    aria-label="단계 삭제"
                  >
                    <ImpactCircle>−</ImpactCircle>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold text-ink">
                      <span>{step.category}</span>
                      <span className="font-semibold text-ink-muted">
                        {" "}
                        {step.product.brand ? `${step.product.brand} ` : ""}
                        {step.product.name}
                      </span>
                    </p>
                  </div>
                  <span className="cursor-grab text-ink-muted" aria-hidden>
                    ☰
                  </span>
                </div>
              ))}

              <button
                type="button"
                onClick={() => openSheet()}
                className="flex w-full items-center gap-2.5 rounded-[14px] border border-dashed border-line px-3 py-3 text-left text-sm font-bold text-ink"
              >
                <ImpactCircle>+</ImpactCircle>
                단계 추가하기
              </button>
            </Card>

            <div className="pt-1">
              <Button
                fullWidth
                disabled={steps.length === 0}
                onClick={async () => {
                  await createRoutine({
                    title: `${profile.concerns[0]} 루틴`,
                    concernLabel: profile.concerns[0],
                    source: "manual",
                    steps: steps.map((s) => ({ category: s.category, product: s.product })),
                  });
                  trackEvent("routine_start", {
                    routine_type: "direct",
                    step_count: steps.length,
                  });
                  router.push("/care-log");
                }}
              >
                루틴 설정 완료
              </Button>
            </div>
          </>
        ) : (
          <>
            <section>
              <h2 className="mb-2.5 text-[15px] font-extrabold text-ink">이렇게 추천했어요</h2>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-chip bg-white shadow-card px-3 py-1.5 text-[11px]">
                  <span className="text-ink-muted">피부 타입 / </span>
                  <span className="font-extrabold text-ink">{profile.skinType}</span>
                </span>
                <span className="inline-flex max-w-full items-center rounded-chip bg-white shadow-card px-3 py-1.5 text-[11px]">
                  <span className="shrink-0 text-ink-muted">피부 고민 / </span>
                  <span className="truncate font-extrabold text-ink">{concernJoined}</span>
                </span>
                <span className="inline-flex items-center rounded-chip bg-white shadow-card px-3 py-1.5 text-[11px]">
                  <span className="text-ink-muted">민감도 / </span>
                  <span className="font-extrabold text-ink">{profile.sensitivity}</span>
                </span>
              </div>
            </section>

            <Card className="!p-4">
              {recLoading ? (
                <p className="py-10 text-center text-sm text-ink-muted">
                  맞춤 루틴을 만들고 있어요...
                </p>
              ) : recError || !recommend ? (
                <div className="space-y-4 py-2 text-center">
                  <Illustration
                    src={ILLUSTRATIONS.recommendEmpty}
                    alt=""
                    width={140}
                    height={120}
                    className="mx-auto"
                  />
                  <div>
                    <p className="text-[15px] font-extrabold text-ink">
                      추천할 수 있는 루틴이 없어요
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                      현재 조건으로 추천할 루틴 데이터가 없어요.
                      <br />
                      조건을 변경하거나 다시 시도해 주세요.
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <Button fullWidth size="md" onClick={() => void loadRecommend()}>
                      <span aria-hidden>↻</span>
                      다시 시도하기
                    </Button>
                    <Button
                      fullWidth
                      size="md"
                      variant="outline"
                      disabled={cooldown}
                      onClick={() => {
                        setCooldown(true);
                        void loadRecommend();
                        window.setTimeout(() => setCooldown(false), 5000);
                      }}
                    >
                      다른 루틴 추천받기
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold text-ink-muted">
                      피부 고민 맞춤 추천 미리보기
                    </p>
                    <h3 className="mt-1 text-[16px] font-extrabold leading-snug text-ink">
                      {recommend.title}
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {profile.skinType} · {concernJoined} 기준으로 구성했어요
                    </p>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {recommend.steps.map((step, index) => (
                      <div
                        key={`${step.product.id}-${index}`}
                        className="w-[88px] shrink-0 text-center"
                      >
                        <div className="mx-auto mb-2 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[14px] bg-surface-empty">
                          {step.product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={step.product.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="px-1 text-[10px] font-bold leading-tight text-ink-muted">
                              제품
                              <br />
                              이미지
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[12px] font-extrabold text-ink">
                          {step.category}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-ink-muted">
                          {step.product.brand || step.product.name}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Button
                      fullWidth
                      size="md"
                      variant={recApplied ? "secondary" : "primary"}
                      onClick={() => {
                        setRecApplied(true);
                        if (recommend?.id) {
                          trackEvent("recommend_apply", { recommend_id: recommend.id });
                        }
                      }}
                    >
                      {recApplied ? "적용됨 ✓" : "추천 루틴 적용"}
                    </Button>
                    <Button
                      fullWidth
                      size="md"
                      variant="outline"
                      disabled={recLoading || cooldown}
                      onClick={() => {
                        setCooldown(true);
                        void loadRecommend();
                        window.setTimeout(() => setCooldown(false), 5000);
                      }}
                    >
                      다른 루틴 추천받기
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            <div className="pt-1">
              <Button
                fullWidth
                disabled={!recApplied || !recommend}
                onClick={async () => {
                  if (!recommend) return;
                  await createRoutine({
                    title: recommend.title,
                    concernLabel: profile.concerns[0],
                    source: "recommend",
                    steps: recommend.steps,
                  });
                  trackEvent("routine_start", {
                    routine_type: "recommend",
                    recommend_id: recommend.id,
                    step_count: recommend.steps.length,
                  });
                  router.push("/care-log");
                }}
              >
                루틴 설정 완료
              </Button>
              <p className="mt-2.5 text-center text-xs text-ink-muted">
                * 추천 루틴 적용 후 활성화됩니다
              </p>
            </div>
          </>
        )}
      </div>

      {/* Product picker sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35">
          <div className="flex max-h-[88svh] w-full max-w-phone flex-col overflow-hidden rounded-t-[24px] bg-white shadow-card animate-fade-up">
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <h3 className="text-lg font-extrabold text-ink">단계 추가</h3>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted"
                onClick={() => closeSheet("cancel")}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="flex min-h-0 flex-1 gap-0 overflow-hidden px-3 pb-3">
              {/* Category column */}
              <div className="flex w-[88px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-dashed border-line/60 pr-2.5 pt-1">
                {ROUTINE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedProduct(null);
                    }}
                    className={`rounded-chip px-2 py-2.5 text-center text-[12px] font-bold transition ${
                      selectedCategory === cat
                        ? "bg-sky text-white"
                        : "border border-sky bg-surface-card text-ink"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search / custom column */}
              <div className="min-w-0 flex-1 overflow-y-auto pl-2.5 pt-1">
                {sheetTab === "search" ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                        ⌕
                      </span>
                      <TextInput
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="제품명 검색"
                        className="!pl-9"
                      />
                    </div>

                    {searchLoading && (
                      <p className="text-center text-xs text-ink-muted">검색 중...</p>
                    )}

                    {searchError && (
                      <div className="space-y-2 rounded-[14px] bg-white shadow-card p-3 text-center">
                        <p className="text-sm text-accent">{searchError}</p>
                        <button
                          type="button"
                          className="text-sm font-bold text-sky"
                          onClick={() => {
                            setSheetTab("custom");
                            setSearchError("");
                          }}
                        >
                          직접 제품 등록하기
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {!searchLoading &&
                        !searchError &&
                        query.trim() &&
                        searchResults.length === 0 && (
                          <p className="py-4 text-center text-sm text-ink-muted">
                            검색 결과가 없어요.
                          </p>
                        )}
                      {searchResults.map((product) => {
                        const selected = selectedProduct?.id === product.id;
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => setSelectedProduct(selected ? null : product)}
                            className={`flex w-full items-center gap-2.5 rounded-[14px] border px-2.5 py-2.5 text-left ${
                              selected
                                ? "border-line bg-surface-card"
                                : "border-transparent bg-white/60"
                            }`}
                          >
                            <ProductThumb src={product.imageUrl} size="sm" />
                            <div className="min-w-0 flex-1">
                              {product.brand && (
                                <p className="truncate text-[11px] font-bold text-ink">
                                  {product.brand}
                                </p>
                              )}
                              <p className="truncate text-[12px] text-ink-soft">{product.name}</p>
                            </div>
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                                selected
                                  ? "border-sky bg-sky text-white"
                                  : "border-line bg-surface-card text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {query.trim() && searchResults.length > 0 && !searchLoading && (
                      <p className="text-center text-[11px] text-ink-muted">
                        찾는 제품이 더 없어요
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSheetTab("custom");
                        setSearchError("");
                      }}
                      className="flex w-full items-center gap-2 rounded-[14px] border border-dashed border-line px-3 py-3 text-sm font-bold text-ink"
                    >
                      <ImpactCircle>+</ImpactCircle>
                      직접 제품 등록하기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      className="text-xs font-bold text-sky"
                      onClick={() => setSheetTab("search")}
                    >
                      ← 제품 검색으로
                    </button>
                    <div className="flex h-28 items-center justify-center rounded-[14px] border border-dashed border-line bg-surface-empty text-sm text-ink-muted">
                      이미지 추가 (선택)
                    </div>
                    <TextInput
                      value={customName}
                      onChange={(e) => {
                        setCustomName(e.target.value);
                        if (e.target.value.trim()) {
                          setSelectedProduct({
                            id: uid("custom"),
                            name: e.target.value.trim(),
                            isCustom: true,
                            category: selectedCategory,
                          });
                        } else {
                          setSelectedProduct(null);
                        }
                      }}
                      placeholder="제품 이름 입력"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-line/40 px-4 py-3">
              <Button
                fullWidth
                disabled={!selectedProduct}
                onClick={() => {
                  if (!selectedProduct) return;
                  const isCustom = Boolean(selectedProduct.isCustom);
                  if (isCustom) {
                    trackEvent("product_custom_register", {
                      has_image: Boolean(selectedProduct.imageUrl),
                    });
                  }
                  trackEvent("routine_step_add", { step_type: selectedCategory });
                  setSteps((prev) => [
                    ...prev,
                    {
                      id: uid("draft"),
                      category: selectedCategory,
                      product: { ...selectedProduct, category: selectedCategory },
                    },
                  ]);
                  setSelectedProduct(null);
                  setCustomName("");
                  setQuery("");
                  setSearchResults([]);
                  setSearchError("");
                  setSheetTab("search");
                  closeSheet("complete");
                }}
              >
                완료
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={confirmOpen}
        title="작성을 중단할까요?"
        description="입력 중인 정보가 저장되지 않을 수 있어요."
        confirmLabel="나가기"
        cancelLabel="계속 작성"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => router.replace("/care-log")}
      />
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import { FieldLabel, TextInput } from "@/components/ui/Field";
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

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/routine/register");
    else if (!profile) router.replace("/skin-profile");
  }, [hydrated, state.isLoggedIn, profile, router]);

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
        setRecError(data.message || "추천 루틴을 불러오지 못했어요. 다시 시도해주세요");
        return;
      }
      const nextId = uid("r");
      setRecommend({
        id: nextId,
        title: data.title || `${profile.concerns[0]} 맞춤 루틴`,
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
      setRecError("추천 루틴을 불러오지 못했어요. 다시 시도해주세요");
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <AppShell showNav={false}>
      <PageHeader
        title="루틴 등록"
        center
        onBack={() => {
          if (sheetOpen) {
            trackEvent("popup_close", { action: "cancel" });
            setSheetOpen(false);
            return;
          }
          if (dirty) setConfirmOpen(true);
          else router.replace("/care-log");
        }}
      />

      <div className="page-pad mt-4 space-y-4 pb-8 animate-fade-up">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTab("manual");
              setRecApplied(false);
            }}
            className={`rounded-panel border p-3 text-left ${
              tab === "manual" ? "border-accent bg-accent-faint/40" : "border-line bg-surface-white"
            }`}
          >
            <p className="text-sm font-extrabold text-ink">직접 루틴 만들기</p>
            <p className="mt-1 text-[11px] text-ink-muted">내가 직접 제품을 추가해요</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("recommend");
              setSteps([]);
              void loadRecommend();
            }}
            className={`rounded-panel border p-3 text-left ${
              tab === "recommend"
                ? "border-accent bg-accent-faint/40"
                : "border-line bg-surface-white"
            }`}
          >
            <p className="text-sm font-extrabold text-ink">피부 고민 맞춤 추천</p>
            <p className="mt-1 text-[11px] text-ink-muted">고민에 맞춘 루틴을 추천받아요</p>
          </button>
        </div>

        {tab === "manual" ? (
          <>
            <div>
              <h2 className="text-sm font-extrabold text-ink">루틴 순서 설정</h2>
              <p className="mt-1 text-xs text-ink-muted">
                루틴에서 사용할 제품 순서를 설정해 주세요.
              </p>
            </div>
            <Card className="space-y-3 bg-surface">
              {steps.length === 0 && (
                <p className="py-4 text-center text-sm text-ink-muted">
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
                  className="flex items-center gap-3 rounded-panel border border-line bg-surface-white p-3"
                >
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-accent disabled:opacity-40"
                    disabled={steps.length <= 1}
                    onClick={() => {
                      if (steps.length <= 1) {
                        showToast("루틴은 최소 1개 단계가 필요해요.");
                        return;
                      }
                      setSteps((prev) => prev.filter((s) => s.id !== step.id));
                    }}
                  >
                    −
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-ink">{step.category}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {step.product.brand ? `${step.product.brand} ` : ""}
                      {step.product.name}
                    </p>
                  </div>
                  <span className="cursor-grab text-ink-muted">☰</span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-panel border border-dashed border-line py-3 text-sm font-bold text-accent"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent">
                  +
                </span>
                단계 추가하기
              </button>
            </Card>
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
          </>
        ) : (
          <>
            <Card>
              <p className="text-sm font-bold text-ink">이렇게 추천했어요</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{profile.skinType}</Badge>
                {profile.concerns.map((c) => (
                  <Badge key={c}>{c}</Badge>
                ))}
                <Badge tone="outline">{profile.sensitivity}</Badge>
              </div>
            </Card>

            <Card>
              {recLoading ? (
                <p className="py-8 text-center text-sm text-ink-muted">
                  맞춤 루틴을 만들고 있어요...
                </p>
              ) : recError ? (
                <div className="space-y-3 py-4 text-center">
                  <Illustration
                    src={ILLUSTRATIONS.recommendEmpty}
                    alt=""
                    width={120}
                    height={100}
                    className="mx-auto"
                  />
                  <p className="text-sm text-accent">{recError}</p>
                  <Button size="md" onClick={() => void loadRecommend()}>
                    다시 시도
                  </Button>
                </div>
              ) : recommend ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <h3 className="min-w-0 flex-1 truncate font-extrabold text-ink">
                      {recommend.title}
                    </h3>
                    <Badge tone="soft" className="shrink-0 whitespace-nowrap">
                      AI 추천
                    </Badge>
                  </div>
                  {recommend.steps.map((step, index) => (
                    <div
                      key={`${step.product.id}-${index}`}
                      className="flex items-center gap-3 rounded-panel border border-line/70 bg-surface p-3"
                    >
                      {step.product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={step.product.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-panel object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-panel border border-dashed border-line bg-accent-faint text-xs font-bold text-accent">
                          {step.category.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink">{step.category}</p>
                        <p className="truncate text-xs text-ink-muted">
                          {step.product.brand ? `${step.product.brand} · ` : ""}
                          {step.product.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={recApplied ? "secondary" : "outline"}
                disabled={recLoading || Boolean(recError) || !recommend}
                onClick={() => {
                  setRecApplied(true);
                  if (recommend?.id) {
                    trackEvent("recommend_apply", { recommend_id: recommend.id });
                  }
                }}
                className="whitespace-nowrap text-sm"
              >
                {recApplied ? "적용됨 ✓" : "추천 루틴 적용"}
              </Button>
              <Button
                variant="ghost"
                disabled={recLoading || cooldown}
                className="whitespace-nowrap px-2 text-sm"
                onClick={() => {
                  setCooldown(true);
                  void loadRecommend();
                  window.setTimeout(() => setCooldown(false), 5000);
                }}
              >
                다른 루틴 추천받기
              </Button>
            </div>

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
          </>
        )}
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35">
          <div className="max-h-[85svh] w-full max-w-phone overflow-auto rounded-t-[24px] bg-surface-white p-4 animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-ink">단계 추가</h3>
              <button
                type="button"
                className="text-ink-muted"
                onClick={() => {
                  trackEvent("popup_close", { action: "cancel" });
                  setSheetOpen(false);
                }}
              >
                닫기
              </button>
            </div>

            <FieldLabel>루틴 종류</FieldLabel>
            <div className="mb-4 flex flex-wrap gap-2">
              {ROUTINE_CATEGORIES.map((cat) => (
                <SelectChip
                  key={cat}
                  selected={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs"
                >
                  {cat}
                </SelectChip>
              ))}
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <SelectChip selected={sheetTab === "search"} onClick={() => setSheetTab("search")}>
                제품 검색
              </SelectChip>
              <SelectChip
                selected={sheetTab === "custom"}
                onClick={() => {
                  setSheetTab("custom");
                  setSearchError("");
                }}
              >
                직접 제품 등록
              </SelectChip>
            </div>

            {sheetTab === "search" ? (
              <div className="space-y-3">
                <TextInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="제품명 검색"
                />
                {searchLoading && (
                  <p className="text-center text-xs text-ink-muted">검색 중...</p>
                )}
                {searchError && (
                  <div className="space-y-2 rounded-panel border border-line bg-surface p-3 text-center">
                    <p className="text-sm text-accent">{searchError}</p>
                    <button
                      type="button"
                      className="text-sm font-bold text-accent underline"
                      onClick={() => {
                        setSheetTab("custom");
                        setSearchError("");
                      }}
                    >
                      직접 제품 등록하기
                    </button>
                  </div>
                )}
                <div className="max-h-56 space-y-2 overflow-auto">
                  {!searchLoading &&
                    !searchError &&
                    query.trim() &&
                    searchResults.length === 0 && (
                      <div className="space-y-2 py-4 text-center">
                        <p className="text-sm text-ink-muted">검색 결과가 없어요.</p>
                        <button
                          type="button"
                          className="text-sm font-bold text-accent underline"
                          onClick={() => setSheetTab("custom")}
                        >
                          직접 제품 등록하기
                        </button>
                      </div>
                    )}
                  {searchResults.map((product) => {
                    const selected = selectedProduct?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedProduct(selected ? null : product)}
                        className={`flex w-full items-center gap-3 rounded-panel border px-3 py-3 text-left ${
                          selected ? "border-accent bg-accent-faint" : "border-line"
                        }`}
                      >
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-10 w-10 rounded-panel object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-panel bg-surface" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">{product.name}</p>
                          {product.brand && (
                            <p className="text-xs text-ink-muted">{product.brand}</p>
                          )}
                        </div>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            selected ? "border-accent bg-accent text-white" : "border-line"
                          }`}
                        >
                          {selected ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex h-28 items-center justify-center rounded-panel border border-dashed border-line bg-surface text-sm text-ink-muted">
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

            <Button
              fullWidth
              className="mt-4"
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
                trackEvent("popup_close", { action: "complete" });
                setSelectedProduct(null);
                setCustomName("");
                setQuery("");
                setSearchResults([]);
                setSearchError("");
                setSheetOpen(false);
              }}
            >
              완료
            </Button>
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

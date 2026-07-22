"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Illustration from "@/components/ui/Illustration";
import PageHeader from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import StarRating from "@/components/ui/StarRating";
import { trackEvent } from "@/lib/analytics";
import { BRAND, daysSince, daysSinceAt, formatDateDot } from "@/lib/constants";
import { ILLUSTRATIONS, peachFeelingIllustration } from "@/lib/illustrations";
import { finishRoutine, showToast } from "@/lib/store";
import type { ChangeFeeling } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

async function inlineSameOriginImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:")) return;
      if (!src.startsWith(window.location.origin) && !src.startsWith("/")) {
        const label = (img.alt || "제품").slice(0, 2);
        const canvas = document.createElement("canvas");
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#F5F5F5";
          ctx.fillRect(0, 0, 80, 80);
          ctx.fillStyle = "#707786";
          ctx.font = "bold 18px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, 40, 42);
          img.src = canvas.toDataURL("image/png");
        }
        return;
      }
      try {
        const res = await fetch(src, { cache: "force-cache" });
        const blob = await res.blob();
        img.src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        // keep original
      }
    })
  );
}

async function downloadNoteCard(element: HTMLElement, filename: string) {
  // 가로 스크롤 영역을 캡처에 전부 포함
  const scrollers = Array.from(
    element.querySelectorAll<HTMLElement>("[data-capture-expand]")
  );
  const prevStyles = scrollers.map((el) => ({
    el,
    overflow: el.style.overflow,
    width: el.style.width,
    maxWidth: el.style.maxWidth,
  }));
  scrollers.forEach((el) => {
    el.style.overflow = "visible";
    el.style.width = `${el.scrollWidth}px`;
    el.style.maxWidth = "none";
  });

  try {
    await inlineSameOriginImages(element);
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#FFFFFF",
      skipFonts: true,
    });

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });

    // 모바일: 공유 시트로 갤러리 저장 / 데스크톱: 다운로드 창
    if (isMobileDevice()) {
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
        share?: (data?: ShareData) => Promise<void>;
      };
      if (typeof nav.canShare === "function" && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: "ANA 스킨노트" });
        return;
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } finally {
    prevStyles.forEach(({ el, overflow, width, maxWidth }) => {
      el.style.overflow = overflow;
      el.style.width = width;
      el.style.maxWidth = maxWidth;
    });
  }
}

function ProductThumb({
  src,
  label,
  className = "",
}: {
  src?: string | null;
  label?: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={label ?? ""} className={`object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex items-center justify-center bg-surface-empty text-[9px] font-bold text-ink-muted ${className}`}
    >
      {label ?? "이미지"}
    </div>
  );
}

function PeachThumb({
  feeling,
  className = "",
}: {
  feeling?: ChangeFeeling | null;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center bg-accent-faint ${className}`}>
      <Illustration
        src={peachFeelingIllustration(feeling)}
        alt="피치"
        width={48}
        height={48}
        className="h-[78%] w-[78%] object-contain"
      />
    </div>
  );
}

export default function SkinNoteCompletePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, user, profile, activeRoutine } = useAppDerivations();
  const pending = state.pendingEnd;
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated || finishing) return;
    if (!state.isLoggedIn) router.replace("/login?next=/skin-note/complete");
    else if (!activeRoutine || !pending?.reason || !pending.difficulty || !pending.tags.length) {
      router.replace("/routine/end");
    }
  }, [hydrated, state.isLoggedIn, activeRoutine, pending, router, finishing]);

  const weekly = useMemo(
    () =>
      activeRoutine
        ? state.weeklyChanges
            .filter((w) => w.routineId === activeRoutine.id)
            .sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
        : [],
    [state.weeklyChanges, activeRoutine]
  );

  /** 좌측(과거) → 우측(최신), 표기는 루틴 일차 */
  const progressSlots = useMemo(() => {
    if (!activeRoutine) return [];
    return weekly.map((w, index) => ({
      id: w.id,
      label: `${daysSinceAt(activeRoutine.startedAt, w.createdAt)}일차`,
      photoUrl: w.photoUrl,
      feeling: w.feeling,
      highlight: index === weekly.length - 1,
    }));
  }, [weekly, activeRoutine]);

  if (!hydrated || !user || !profile || !activeRoutine || !pending) {
    return (
      <AppShell showNav={false}>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  const duration = daysSince(activeRoutine.startedAt);
  const createdLabel = formatDateDot(new Date().toISOString());
  const endDate = formatDateDot(new Date().toISOString());
  const startDate = formatDateDot(activeRoutine.startedAt);
  const weeks = Math.max(1, Math.floor(duration / 7));
  const isAbandoned = pending.reason === "지속하기 어려워서 그만할래요";

  const saveCardImage = async () => {
    if (!cardRef.current) return;
    try {
      await downloadNoteCard(cardRef.current, `ana-skin-note-${Date.now()}.png`);
      showToast("스킨노트 이미지를 저장했어요.");
    } catch {
      showToast("이미지 저장에 실패했어요. 다시 시도해주세요.");
    }
  };

  const complete = async (visibility: "private" | "public") => {
    setSaving(true);
    setFinishing(true);
    const note = await finishRoutine({
      reason: pending.reason!,
      difficulty: pending.difficulty!,
      tags: pending.tags,
      feltChange: pending.feltChange,
      visibility: isAbandoned ? "private" : visibility,
    });
    if (!note) {
      showToast("루틴 종료에 실패했어요. 다시 시도해주세요.");
      setSaving(false);
      setFinishing(false);
      return;
    }
    trackEvent("routine_end", {
      end_reason: pending.reason!,
      difficulty: pending.difficulty!,
      star_rating: pending.feltChange,
      duration_days: duration,
    });
    trackEvent("skinnote_created", {
      routine_duration: duration,
      skin_type: profile.skinType,
      concerns: profile.concerns.join(","),
      has_photos: weekly.some((w) => Boolean(w.photoUrl)),
      tag_count: pending.tags.length,
      star_rating: pending.feltChange,
    });
    if (visibility === "private" || isAbandoned) {
      trackEvent("skinnote_private", { card_id: note.id });
      router.replace("/mypage");
    } else {
      trackEvent("skinnote_shared", { card_id: note.id });
      router.replace("/drawer");
    }
  };

  return (
    <AppShell showNav={false}>
      <PageHeader
        title=""
        helpTourId="skin-note-complete"
        onBack={() => router.replace("/routine/end")}
      />

      <div className="page-pad -mt-2 space-y-4 pb-10 animate-fade-up">
        <div className="text-center">
          <Illustration
            src={ILLUSTRATIONS.tagsHero2}
            alt=""
            width={110}
            height={90}
            className="mx-auto"
            priority
          />
          <h1 className="mt-3 text-[20px] font-extrabold text-ink">
            스킨노트가 완성되었어요!
          </h1>
          <p className="mt-1 text-sm text-ink-muted">나의 피부 여정을 기록해 보세요 ✦</p>
        </div>

        {/* 저장 버튼 — 캡처 범위 제외 */}
        <div className="flex justify-start" data-help-id="note-save">
          <button
            type="button"
            className="rounded-chip border border-sky bg-surface-card px-3 py-1.5 text-xs font-bold text-sky"
            onClick={() => {
              void saveCardImage();
            }}
          >
            스킨노트 저장하기
          </button>
        </div>

        {/* 캡처 대상: 스킨노트 카드만 */}
        <div
          ref={cardRef}
          className="rounded-card border border-sky/30 bg-white p-4 shadow-card"
        >
          <div className="mb-3 flex justify-end">
            <span className="text-[11px] text-ink-muted">{createdLabel} 생성</span>
          </div>

          {/* Skin profile */}
          <div
            data-help-id="note-skin"
            className="space-y-2.5 border-b border-dashed border-line/70 pb-3 text-sm"
          >
            <div className="flex gap-3">
              <span className="w-[4.5rem] shrink-0 text-ink-muted">피부 타입</span>
              <span className="font-extrabold text-ink">{profile.skinType}</span>
            </div>
            <div className="flex gap-3">
              <span className="w-[4.5rem] shrink-0 text-ink-muted">피부 고민</span>
              <span className="font-extrabold text-ink">{profile.concerns.join(" · ")}</span>
            </div>
          </div>

          {/* Products / period / order */}
          <div
            data-help-id="note-routine"
            className="space-y-2.5 border-b border-dashed border-line/70 py-3 text-sm"
          >
            <div className="flex gap-3">
              <span className="w-[4.5rem] shrink-0 pt-1 text-ink-muted">사용 제품</span>
              <div
                data-capture-expand
                className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar"
              >
                {activeRoutine.steps.map((step) => (
                  <ProductThumb
                    key={step.id}
                    src={step.product.imageUrl}
                    label={step.category.slice(0, 2)}
                    className="h-11 w-11 shrink-0 rounded-[10px]"
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-[4.5rem] shrink-0 text-ink-muted">사용 기간</span>
              <span className="font-extrabold text-ink">
                {weeks}주 ({startDate} ~ {endDate})
              </span>
            </div>
            <div className="flex gap-3">
              <span className="w-[4.5rem] shrink-0 text-ink-muted">루틴 순서</span>
              <span className="font-extrabold leading-snug text-ink">
                {activeRoutine.steps.map((s) => s.category).join(" > ")}
              </span>
            </div>
          </div>

          <div data-help-id="note-progress">
            {/* Difficulty */}
            <div className="border-b border-dashed border-line/70 py-3 text-sm">
              <div className="flex gap-3">
                <span className="w-[4.5rem] shrink-0 text-ink-muted">루틴 난이도</span>
                <span className="font-extrabold text-ink">{pending.difficulty}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="border-b border-dashed border-line/70 py-3">
              <p className="mb-2.5 text-sm font-extrabold text-ink">변화 과정</p>
              {progressSlots.length === 0 ? (
                <p className="text-xs text-ink-muted">기록된 변화 과정이 없어요.</p>
              ) : (
                <div
                  data-capture-expand
                  className="overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar"
                >
                  <div className="flex w-max gap-2">
                    {progressSlots.map((slot) => (
                      <div key={slot.id} className="w-[72px] shrink-0 text-center">
                        <div
                          className={`mx-auto overflow-hidden rounded-[10px] ${
                            slot.highlight ? "ring-2 ring-sky" : ""
                          }`}
                        >
                          {slot.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={slot.photoUrl}
                              alt={slot.label}
                              className="mx-auto h-14 w-full object-cover"
                            />
                          ) : (
                            <PeachThumb feeling={slot.feeling} className="mx-auto h-14 w-full" />
                          )}
                        </div>
                        <p
                          className={`mt-1 text-[10px] font-bold ${
                            slot.highlight ? "text-sky" : "text-ink-muted"
                          }`}
                        >
                          {slot.label}
                        </p>
                        <div className="mx-auto mt-1.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent-faint">
                          <Illustration
                            src={peachFeelingIllustration(slot.feeling)}
                            alt=""
                            width={28}
                            height={28}
                            className="h-7 w-7 object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags / rating / reason */}
          <div data-help-id="note-result" className="space-y-3 pt-3 text-sm">
            <div className="flex gap-3">
              <span className="w-[4.5rem] shrink-0 pt-1 text-ink-muted">변화 태그</span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {pending.tags.map((tag) => (
                  <SelectChip
                    key={tag}
                    selected={false}
                    className="pointer-events-none !border-sky !px-2 !py-1 text-[10px] !text-sky"
                  >
                    {tag}
                  </SelectChip>
                ))}
              </div>
            </div>
            {pending.feltChange > 0 && (
              <div className="flex items-center gap-3">
                <span className="w-[4.5rem] shrink-0 text-ink-muted">체감 변화</span>
                <StarRating value={pending.feltChange} readOnly size="sm" />
              </div>
            )}
            <div className="flex gap-3">
              <span className="w-[4.5rem] shrink-0 text-ink-muted">종료 사유</span>
              <span className="font-extrabold text-ink">{pending.reason}</span>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-ink-muted">
            ✦ {BRAND} · A Note Archive ✦
          </p>
        </div>

        <div className="space-y-2.5 pt-1" data-help-id="note-actions">
          <Button
            fullWidth
            variant="outline"
            disabled={saving}
            onClick={() => complete("private")}
          >
            나만 보기
          </Button>
          {!isAbandoned && (
            <Button fullWidth disabled={saving} onClick={() => complete("public")}>
              공유하고 스킨 서랍장 구경하기
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

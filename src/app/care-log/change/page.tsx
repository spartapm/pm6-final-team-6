"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import { mapChangeStatus, trackEvent } from "@/lib/analytics";
import {
  CHANGE_FEELING_OPTIONS,
  NONE_CHANGE_TAG,
  REGULAR_CHANGE_TAGS,
  daysSince,
  daysSinceAt,
  weekKey,
} from "@/lib/constants";
import { compressImageFile, validateImageFile } from "@/lib/image";
import { weekFeelingIllustration } from "@/lib/illustrations";
import { saveWeeklyChange, showToast } from "@/lib/store";
import type { ChangeFeeling } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function ChangeRecordPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, activeRoutine } = useAppDerivations();
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [feeling, setFeeling] = useState<ChangeFeeling | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydratedForm, setHydratedForm] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/care-log/change");
    else if (!activeRoutine) router.replace("/care-log");
  }, [hydrated, state.isLoggedIn, activeRoutine, router]);

  useEffect(() => {
    if (!hydrated || !activeRoutine || hydratedForm) return;
    const existing = state.weeklyChanges.find(
      (w) => w.routineId === activeRoutine.id && w.weekKey === weekKey()
    );
    if (existing) {
      setPhotoUrl(existing.photoUrl);
      setFeeling(existing.feeling);
      setTags(existing.tags);
      setReadOnly(true);
    }
    setHydratedForm(true);
  }, [hydrated, activeRoutine, state.weeklyChanges, hydratedForm]);

  const currentWeek = useMemo(() => {
    if (!activeRoutine) return 1;
    return Math.max(1, Math.ceil(daysSince(activeRoutine.startedAt) / 7));
  }, [activeRoutine]);

  /** 과거 주차 사진 (현재 주 제외) */
  const pastPhotosByWeek = useMemo(() => {
    const map = new Map<number, string>();
    if (!activeRoutine) return map;
    const currentKey = weekKey();
    for (const change of state.weeklyChanges) {
      if (change.routineId !== activeRoutine.id) continue;
      if (change.weekKey === currentKey) continue;
      if (!change.photoUrl) continue;
      const weekNum = Math.max(
        1,
        Math.ceil(daysSinceAt(activeRoutine.startedAt, change.createdAt) / 7)
      );
      map.set(weekNum, change.photoUrl);
    }
    return map;
  }, [activeRoutine, state.weeklyChanges]);

  const slotCount = Math.max(4, currentWeek);

  const dirty = !readOnly && Boolean(photoUrl || feeling || tags.length);
  const canSave = Boolean(feeling && tags.length > 0);

  const onPickPhoto = async (file?: File | null) => {
    if (readOnly || !file) return;
    const invalid = validateImageFile(file);
    if (invalid) {
      showToast(invalid);
      return;
    }
    try {
      const dataUrl = await compressImageFile(file, { maxEdge: 1280, quality: 0.82 });
      setPhotoUrl(dataUrl);
    } catch {
      showToast("사진 업로드에 실패했어요. 다시 시도해주세요.");
    }
  };

  const toggleTag = (tag: string) => {
    if (readOnly) return;

    if (tag === NONE_CHANGE_TAG) {
      if (tags.includes(NONE_CHANGE_TAG)) {
        setTags([]);
        trackEvent("week_tag_select", { tag_name: tag, action: "remove" });
      } else {
        setTags([NONE_CHANGE_TAG]);
        trackEvent("week_tag_select", { tag_name: tag, action: "add" });
      }
      return;
    }

    if (tags.includes(tag)) {
      setTags((prev) => prev.filter((t) => t !== tag));
      trackEvent("week_tag_select", { tag_name: tag, action: "remove" });
      return;
    }

    const withoutNone = tags.filter((t) => t !== NONE_CHANGE_TAG);
    if (withoutNone.length >= 5) {
      showToast("태그는 최대 5개까지 선택할 수 있어요.");
      return;
    }
    setTags([...withoutNone, tag]);
    trackEvent("week_tag_select", { tag_name: tag, action: "add" });
  };

  if (!hydrated || !activeRoutine) {
    return (
      <AppShell showNav={false}>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false}>
      <PageHeader
        title="변화 과정 기록"
        subtitle={
          <>
            <span className="block">피부 변화 과정을 기록해보세요.</span>
            <span className="block">기록할수록 루틴이 더 정확해져요!</span>
          </>
        }
        center
        helpTourId="care-log-change"
        onBack={() => {
          if (dirty) setConfirmOpen(true);
          else router.push("/care-log");
        }}
      />

      <div className="page-pad mt-4 space-y-4 pb-10 animate-fade-up">
        {/* Photos */}
        <Card className="!p-4">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-ink">이번 주 변화 사진</h2>
            <Badge tone="soft">선택</Badge>
            {readOnly && <Badge tone="muted">조회 전용</Badge>}
          </div>
          <p className="mb-3 text-xs text-ink-muted">변화 사진을 비교적으로 볼 수 있어요.</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void onPickPhoto(file);
            }}
          />

          <div
            data-help-id="change-photos"
            className="flex gap-2 overflow-x-auto pb-1 overscroll-x-contain touch-pan-x"
          >
            {Array.from({ length: slotCount }, (_, index) => {
              const weekNum = index + 1;
              const isCurrent = weekNum === currentWeek;
              const isFuture = weekNum > currentWeek;
              const pastPhoto = pastPhotosByWeek.get(weekNum);
              const currentPhoto = isCurrent ? photoUrl : undefined;
              const photo = currentPhoto || pastPhoto;

              if (isCurrent && !photo && !readOnly) {
                return (
                  <button
                    key={weekNum}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square w-[72px] shrink-0 flex-col items-center justify-center rounded-[12px] border border-dashed border-sky bg-surface-card text-center"
                  >
                    <span className="text-lg font-bold text-sky">＋</span>
                    <span className="mt-0.5 text-[10px] font-bold text-sky">사진 추가</span>
                  </button>
                );
              }

              if (photo) {
                return (
                  <div
                    key={weekNum}
                    className="relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-[12px] bg-surface-empty"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`${weekNum}주차 변화 사진`}
                      className="h-full w-full object-cover"
                    />
                    {isCurrent && !readOnly && (
                      <button
                        type="button"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/55 text-[10px] text-white"
                        onClick={() => setPhotoUrl(undefined)}
                        aria-label="사진 삭제"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={weekNum}
                  className="flex aspect-square w-[72px] shrink-0 items-center justify-center rounded-[12px] bg-surface-empty text-[11px] font-bold text-ink-muted"
                >
                  {isFuture || !isCurrent ? `${weekNum}주차` : "사진 없음"}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Info note — 사진 아이콘 없이 문장 단위 줄바꿈 + 핵심 문구 bold */}
        <Card className="!p-3.5">
          <p className="text-[13px] font-extrabold text-ink">부담 없이 기록해보세요</p>
          <div className="mt-0.5 break-keep text-xs leading-relaxed text-ink-muted">
            <p>
              얼굴 전체가 아닌 볼·이마·턱 등{" "}
              <strong className="font-extrabold text-ink">원하는 부위</strong>만 촬영할 수
              있어요.
            </p>
            <p>
              사진 없이 기록하거나, 스킨노트를{" "}
              <strong className="font-extrabold text-ink">나만 보기</strong>로 저장할 수도
              있어요.
            </p>
          </div>
        </Card>

        {/* Feeling */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-ink">이번 주 피부 변화는 어떠셨나요?</h2>
            <Badge>필수</Badge>
          </div>
          <div data-help-id="change-feeling" className="grid grid-cols-3 gap-2">
            {CHANGE_FEELING_OPTIONS.map((item) => {
              const selected = feeling === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    if (readOnly) return;
                    setFeeling(item.value);
                    trackEvent("week_change_select", {
                      change_status: mapChangeStatus(item.value),
                    });
                  }}
                  className="flex flex-col items-center gap-2 text-center disabled:cursor-default"
                >
                  <div
                    className={`flex h-[84px] w-[84px] items-center justify-center rounded-full transition ${
                      selected ? "bg-accent-faint ring-2 ring-accent" : "bg-transparent"
                    }`}
                  >
                    <Illustration
                      src={weekFeelingIllustration(item.icon)}
                      alt={item.label}
                      width={68}
                      height={68}
                      className="h-[68px] w-[68px] object-contain"
                    />
                  </div>
                  <span
                    className={`text-[12px] font-bold leading-tight ${
                      selected ? "text-ink" : "text-ink-muted"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tags */}
        <section data-help-id="change-tags">
          <h2 className="mb-2.5 text-sm font-extrabold text-ink">
            어떤 변화가 있었나요?{" "}
            <span
              data-help-id="change-multi-hint"
              className="inline-block font-semibold text-ink-muted"
            >
              (복수 선택 가능)
            </span>
          </h2>
          <div>
            <div className="flex flex-wrap gap-2">
              {REGULAR_CHANGE_TAGS.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <SelectChip
                    key={tag}
                    selected={selected}
                    disabled={readOnly}
                    className="justify-center px-2.5 text-[11px]"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </SelectChip>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center">
              <SelectChip
                selected={tags.includes(NONE_CHANGE_TAG)}
                disabled={readOnly}
                className="justify-center px-4 text-[12px] !font-extrabold"
                onClick={() => toggleTag(NONE_CHANGE_TAG)}
              >
                {NONE_CHANGE_TAG}
              </SelectChip>
            </div>
          </div>
        </section>

        <div data-help-id="change-save">
          {!readOnly ? (
            <Button
              fullWidth
              disabled={!canSave || saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await saveWeeklyChange({
                    routineId: activeRoutine.id,
                    photoUrl,
                    feeling: feeling!,
                    tags,
                  });
                  trackEvent("week_record_saved", {
                    has_photo: Boolean(photoUrl),
                    tag_count: tags.length,
                    week_number: currentWeek,
                  });
                  router.push("/care-log");
                } catch {
                  showToast("기록 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "저장 중..." : "기록 저장하기"}
            </Button>
          ) : (
            <div className="rounded-chip bg-btn-disabled py-3.5 text-center text-[15px] font-bold text-ink-muted">
              기록 저장하기
            </div>
          )}
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title="작성 중인 기록을 저장하지 않고 나갈까요?"
        confirmLabel="나가기"
        cancelLabel="계속 작성"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => router.push("/care-log")}
      />
    </AppShell>
  );
}

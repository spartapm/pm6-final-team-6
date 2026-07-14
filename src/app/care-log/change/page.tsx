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
import { mapChangeStatus, trackEvent } from "@/lib/analytics";
import {
  CHANGE_FEELING_OPTIONS,
  WEEKLY_CHANGE_TAGS,
  daysSince,
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
    }
    setHydratedForm(true);
  }, [hydrated, activeRoutine, state.weeklyChanges, hydratedForm]);

  const dirty = Boolean(photoUrl || feeling || tags.length);
  const canSave = Boolean(feeling && tags.length > 0);

  const onPickPhoto = async (file?: File | null) => {
    if (!file) return;
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
        subtitle="피부 변화 과정을 기록해보세요. 기록할수록 루틴이 더 정확해져요!"
        center
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
          </div>
          <p className="mb-3 text-xs text-ink-muted">변화 사진을 비교적으로 볼 수 있어요.</p>

          <div className="grid grid-cols-4 gap-2">
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-sky bg-surface-card text-center">
              <span className="text-lg font-bold text-sky">＋</span>
              <span className="mt-0.5 text-[10px] font-bold text-sky">사진 추가</span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
              />
            </label>

            {[0, 1, 2].map((slot) => {
              const showPhoto = slot === 0 && photoUrl;
              return (
                <div
                  key={slot}
                  className="relative aspect-square overflow-hidden rounded-[12px] bg-surface-empty"
                >
                  {showPhoto ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoUrl} alt="변화 사진" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/55 text-[10px] text-white"
                        onClick={() => setPhotoUrl(undefined)}
                        aria-label="사진 삭제"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-ink-muted">
                      사진 {slot + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Info note */}
        <Card className="!flex !items-start gap-3 !p-3.5">
          <span className="mt-0.5 text-sky" aria-hidden>
            🖼
          </span>
          <div>
            <p className="text-[13px] font-extrabold text-ink">
              사진을 등록하지 않아도 기록할 수 있어요
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              아래에서 변화 여부와 태그를 선택해주세요.
            </p>
          </div>
        </Card>

        {/* Feeling */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-ink">이번 주 피부 변화는 어떠셨나요?</h2>
            <Badge>필수</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {CHANGE_FEELING_OPTIONS.map((item) => {
              const selected = feeling === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setFeeling(item.value);
                    trackEvent("week_change_select", {
                      change_status: mapChangeStatus(item.value),
                    });
                  }}
                  className="flex flex-col items-center gap-2 text-center"
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
        <section>
          <h2 className="mb-2.5 text-sm font-extrabold text-ink">
            어떤 변화가 있었나요?{" "}
            <span className="font-semibold text-ink-muted">(복수 선택 가능)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {WEEKLY_CHANGE_TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <SelectChip
                  key={tag}
                  selected={selected}
                  className="justify-center px-2.5 text-[11px]"
                  onClick={() => {
                    if (selected) {
                      setTags((prev) => prev.filter((t) => t !== tag));
                      trackEvent("week_tag_select", { tag_name: tag, action: "remove" });
                    } else if (tags.length >= 5) {
                      showToast("태그는 최대 5개까지 선택할 수 있어요.");
                    } else {
                      setTags((prev) => [...prev, tag]);
                      trackEvent("week_tag_select", { tag_name: tag, action: "add" });
                    }
                  }}
                >
                  {tag}
                </SelectChip>
              );
            })}
          </div>
        </section>

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
                week_number: Math.max(1, Math.ceil(daysSince(activeRoutine.startedAt) / 7)),
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

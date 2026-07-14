"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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

  const helper = useMemo(
    () => "변화 사진을 비교적으로 볼 수 있어요. 사진을 등록하지 않아도 기록할 수 있어요.",
    []
  );

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
        subtitle="피부 변화 과정을 기록해보세요. 기록할수록 루틴이 더 정확해져요."
        center
        onBack={() => {
          if (dirty) setConfirmOpen(true);
          else router.push("/care-log");
        }}
      />

      <div className="page-pad mt-5 space-y-5 pb-8 animate-fade-up">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-ink">이번 주 변화 사진</h2>
            <Badge tone="muted">선택</Badge>
          </div>
          <p className="mb-2 text-xs text-ink-muted">{helper}</p>
          {photoUrl ? (
            <div className="relative overflow-hidden rounded-card border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="변화 사진" className="h-48 w-full object-cover" />
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full bg-ink/70 px-2 py-1 text-xs text-white"
                onClick={() => setPhotoUrl(undefined)}
              >
                삭제
              </button>
            </div>
          ) : (
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface text-sm font-bold text-accent">
              <span className="mb-1 text-2xl">＋</span>
              사진 추가
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
              />
            </label>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-ink">이번 주 피부 변화는 어떠셨나요?</h2>
            <Badge>필수</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
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
                    className={`flex h-[88px] w-[88px] items-center justify-center rounded-full transition ${
                      selected
                        ? "bg-accent-faint ring-2 ring-accent"
                        : "bg-transparent"
                    }`}
                  >
                    <Illustration
                      src={weekFeelingIllustration(item.icon)}
                      alt={item.label}
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] object-contain"
                    />
                  </div>
                  <span
                    className={`text-[12px] font-bold leading-tight ${
                      selected ? "text-accent" : "text-ink-soft"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-ink">어떤 변화가 있었나요?</h2>
            <Badge tone="muted">복수 선택 가능</Badge>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-panel border border-line/60 p-3">
            <div className="grid grid-cols-3 gap-2">
              {WEEKLY_CHANGE_TAGS.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <SelectChip
                    key={tag}
                    selected={selected}
                    className="justify-center text-[11px]"
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
          </div>
        </div>

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

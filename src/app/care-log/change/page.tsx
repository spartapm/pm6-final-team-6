"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import { CHANGE_FEELINGS, WEEKLY_CHANGE_TAGS } from "@/lib/constants";
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

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/care-log/change");
    else if (!activeRoutine) router.replace("/care-log");
  }, [hydrated, state.isLoggedIn, activeRoutine, router]);

  const dirty = Boolean(photoUrl || feeling || tags.length);
  const canSave = Boolean(feeling && tags.length > 0);

  const onPickPhoto = (file?: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      showToast("jpg, png 파일만 등록할 수 있어요.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("사진은 10MB 이하로 등록해주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(String(reader.result));
    reader.onerror = () => showToast("사진 업로드에 실패했어요. 다시 시도해주세요.");
    reader.readAsDataURL(file);
  };

  const helper = useMemo(
    () => "사진을 등록하지 않아도 기록할 수 있어요. 아래에서 변화 여부와 태그를 선택해주세요.",
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
        subtitle="피부 변화 과정을 기록해보세요."
        onBack={() => {
          if (dirty) setConfirmOpen(true);
          else router.push("/care-log");
        }}
      />
      <p className="page-pad mt-1 text-xs text-ink-muted">기록할 수록 루틴이 더 정확해져요.</p>

      <div className="page-pad mt-5 space-y-5 pb-8 animate-fade-up">
        <div>
          <h2 className="mb-2 text-sm font-extrabold text-ink">이번 주 변화 사진</h2>
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

        <Card>
          <p className="text-xs leading-relaxed text-ink-muted">{helper}</p>
        </Card>

        <div>
          <h2 className="mb-2 text-sm font-extrabold text-ink">이번 주 피부 변화는 어땠나요?</h2>
          <div className="grid grid-cols-3 gap-2">
            {CHANGE_FEELINGS.map((item) => (
              <SelectChip
                key={item.value}
                selected={feeling === item.value}
                onClick={() => setFeeling(item.value)}
                className="flex-col gap-1 py-3 text-[12px]"
              >
                <span className="text-lg">{item.emoji}</span>
                {item.value}
              </SelectChip>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-extrabold text-ink">어떤 변화가 있었나요?</h2>
          <div className="flex flex-wrap gap-2">
            {WEEKLY_CHANGE_TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <SelectChip
                  key={tag}
                  selected={selected}
                  className="text-xs"
                  onClick={() => {
                    if (selected) setTags((prev) => prev.filter((t) => t !== tag));
                    else if (tags.length >= 5) showToast("태그는 최대 5개까지 선택할 수 있어요.");
                    else setTags((prev) => [...prev, tag]);
                  }}
                >
                  {tag}
                </SelectChip>
              );
            })}
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

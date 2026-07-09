"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Character from "@/components/ui/Character";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import { FieldLabel } from "@/components/ui/Field";
import { SENSITIVITIES, SKIN_CONCERNS, SKIN_TYPES } from "@/lib/constants";
import { saveSkinProfile } from "@/lib/store";
import type { Sensitivity, SkinConcern, SkinType } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function SkinProfilePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, user, profile } = useAppDerivations();
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [concerns, setConcerns] = useState<SkinConcern[]>([]);
  const [sensitivity, setSensitivity] = useState<Sensitivity | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dirty = Boolean(skinType || concerns.length || sensitivity);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/skin-profile");
  }, [hydrated, state.isLoggedIn, router]);

  useEffect(() => {
    if (profile) {
      setSkinType(profile.skinType);
      setConcerns(profile.concerns);
      setSensitivity(profile.sensitivity);
    }
  }, [profile]);

  const canSave = useMemo(
    () => Boolean(skinType && concerns.length > 0 && sensitivity),
    [skinType, concerns, sensitivity]
  );

  if (!hydrated || !user) {
    return (
      <AppShell showNav={false}>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false}>
      <PageHeader
        title="피부 프로필 등록"
        subtitle="내 피부 상태를 알려주시면 더 맞춤 루틴을 추천해드릴게요"
        onBack={() => {
          if (dirty) setConfirmOpen(true);
          else router.back();
        }}
      />

      <div className="page-pad mt-5 space-y-5 pb-8 animate-fade-up">
        <div>
          <FieldLabel>프로필</FieldLabel>
          <Card className="flex items-center gap-3">
            <Character mood="smile" size={44} />
            <span className="font-extrabold text-ink">{user.nickname}</span>
          </Card>
        </div>

        <div>
          <FieldLabel required>피부 타입</FieldLabel>
          <Card>
            <div className="grid grid-cols-4 gap-2">
              {SKIN_TYPES.map((type) => (
                <SelectChip
                  key={type}
                  selected={skinType === type}
                  onClick={() => setSkinType(type)}
                  className="px-1 text-[13px]"
                >
                  {type}
                </SelectChip>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <FieldLabel required hint="복수 선택">
            피부 고민
          </FieldLabel>
          <Card>
            <div className="grid grid-cols-2 gap-2">
              {SKIN_CONCERNS.map((concern) => {
                const selected = concerns.includes(concern);
                return (
                  <SelectChip
                    key={concern}
                    selected={selected}
                    onClick={() =>
                      setConcerns((prev) =>
                        selected ? prev.filter((c) => c !== concern) : [...prev, concern]
                      )
                    }
                    className="text-[13px]"
                  >
                    {concern}
                  </SelectChip>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-ink-muted">* 최소 1개 이상 선택해주세요</p>
          </Card>
        </div>

        <div>
          <FieldLabel required>민감도</FieldLabel>
          <Card>
            <div className="grid grid-cols-3 gap-2">
              {SENSITIVITIES.map((item) => (
                <SelectChip
                  key={item}
                  selected={sensitivity === item}
                  onClick={() => setSensitivity(item)}
                >
                  {item}
                </SelectChip>
              ))}
            </div>
          </Card>
        </div>

        <div className="pt-2">
          <Button
            fullWidth
            disabled={!canSave}
            onClick={async () => {
              if (!skinType || !sensitivity) return;
              await saveSkinProfile({ skinType, concerns, sensitivity });
              router.push("/routine/register");
            }}
          >
            저장하기
          </Button>
          <p className="mt-2 text-center text-xs text-ink-muted">
            * 피부 타입 · 고민 · 민감도 모두 선택 시 활성화
          </p>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title="작성을 중단할까요?"
        description="입력 중인 정보가 저장되지 않을 수 있어요."
        confirmLabel="나가기"
        cancelLabel="계속 작성"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => router.back()}
      />
    </AppShell>
  );
}

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
import { trackEvent } from "@/lib/analytics";
import { CHANGE_TAGS } from "@/lib/constants";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { setPendingEnd, showToast } from "@/lib/store";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

const NONE_TAGS = new Set(["#큰 변화 없음", "#아직 잘 모르겠음", "#좀 더 지켜봐야 함"]);

export default function ChangeTagsPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state } = useAppDerivations();
  const [tags, setTags] = useState<string[]>(state.pendingEnd?.tags ?? []);
  const [initial] = useState(state.pendingEnd?.tags ?? []);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/routine/end/tags");
  }, [hydrated, state.isLoggedIn, router]);

  const dirty = JSON.stringify(tags) !== JSON.stringify(initial);

  const toggleTag = (tag: string) => {
    if (NONE_TAGS.has(tag)) {
      setTags([tag]);
      return;
    }
    if (tags.includes(tag)) {
      setTags((prev) => prev.filter((t) => t !== tag));
      return;
    }
    if (tags.some((t) => NONE_TAGS.has(t))) {
      setTags([tag]);
      return;
    }
    if (tags.length >= 5) {
      showToast("태그는 최대 5개까지 선택할 수 있어요.");
      return;
    }
    setTags((prev) => [...prev, tag]);
  };

  return (
    <AppShell showNav={false}>
      <PageHeader
        title="변화 태그 선택"
        subtitle="루틴 사용 후 변화를 선택해주세요"
        center
        onBack={() => {
          if (dirty) setConfirmOpen(true);
          else router.push("/routine/end");
        }}
      />

      <div className="page-pad mt-2 space-y-4 pb-10 animate-fade-up">
        <Illustration
          src={ILLUSTRATIONS.tagsHero1}
          alt=""
          width={110}
          height={90}
          className="mx-auto"
          priority
        />

        <Card className="!p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-ink">
              해당되는 태그를 선택해주세요{" "}
              <span className="font-extrabold text-sky">
                ({tags.length} /5)
              </span>
            </p>
            <Badge tone="soft">최대 5개</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {CHANGE_TAGS.map((tag) => (
              <SelectChip
                key={tag}
                selected={tags.includes(tag)}
                className="justify-center px-2.5 text-[11px]"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </SelectChip>
            ))}
          </div>
        </Card>

        <Card className="flex items-center gap-3 !p-3.5">
          <Illustration
            src={ILLUSTRATIONS.tagsHint}
            alt=""
            width={48}
            height={48}
            className="shrink-0"
          />
          <p className="text-xs leading-relaxed text-ink-muted">
            태그는 스킨노트 생성과 루틴 분석에 활용돼요.
          </p>
        </Card>

        <Button
          fullWidth
          disabled={tags.length === 0}
          onClick={() => {
            setPendingEnd({
              reason: state.pendingEnd?.reason,
              difficulty: state.pendingEnd?.difficulty,
              tags,
              feltChange: state.pendingEnd?.feltChange ?? 0,
            });
            trackEvent("tag_complete", {
              selected_tags: tags.join(","),
              tag_count: tags.length,
            });
            router.push("/routine/end");
          }}
        >
          선택 완료
        </Button>
      </div>

      <Modal
        open={confirmOpen}
        title="선택한 태그가 저장되지 않았어요. 나가시겠어요?"
        confirmLabel="나가기"
        cancelLabel="계속 선택"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => router.push("/routine/end")}
      />
    </AppShell>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import RadioRow from "@/components/ui/RadioRow";
import {
  DRAWER_CONCERN_FILTERS,
  SKIN_TYPES,
  concernFilterMatch,
  relativeTime,
} from "@/lib/constants";
import { ILLUSTRATIONS, defaultAvatar } from "@/lib/illustrations";
import { dismissBanner } from "@/lib/store";
import type { SkinNote, SkinType } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

type Tab = "전체" | "저장" | "인기";
type DurationFilter = "전체" | "7일 미만" | "7일 이상" | "14일 이상";

export default function DrawerPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, publicNotes } = useAppDerivations();
  const [tab, setTab] = useState<Tab>("전체");
  const [photoOnly, setPhotoOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [skinType, setSkinType] = useState<"전체" | SkinType>("전체");
  const [concern, setConcern] = useState<(typeof DRAWER_CONCERN_FILTERS)[number]>("전체");
  const [duration, setDuration] = useState<DurationFilter>("전체");
  const [draft, setDraft] = useState({ skinType, concern, duration });

  const notes = useMemo(() => {
    let list: SkinNote[] = [...publicNotes];
    if (tab === "저장") list = list.filter((n) => state.savedNoteIds.includes(n.id));
    else if (tab === "인기") list = [...list].sort((a, b) => b.helpCount - a.helpCount);
    else
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    if (photoOnly) list = list.filter((n) => n.changeTimeline.some((t) => t.photoUrl));
    if (skinType !== "전체") list = list.filter((n) => n.skinType === skinType);
    if (concern !== "전체") list = list.filter((n) => concernFilterMatch(concern, n.concerns));
    if (duration === "7일 미만") list = list.filter((n) => n.durationDays < 7);
    if (duration === "7일 이상") list = list.filter((n) => n.durationDays >= 7);
    if (duration === "14일 이상") list = list.filter((n) => n.durationDays >= 14);
    return list;
  }, [publicNotes, tab, state.savedNoteIds, photoOnly, skinType, concern, duration]);

  const activeChips = [
    skinType !== "전체" ? skinType : null,
    concern !== "전체" ? concern : null,
    duration !== "전체" ? duration : null,
  ].filter(Boolean) as string[];

  if (!hydrated) {
    return (
      <AppShell>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-pad space-y-4 pt-5 pb-6 animate-fade-up">
        <h1 className="text-xl font-extrabold text-ink">스킨서랍장</h1>

        {!state.bannerDismissed.drawer && (
          <div className="flex items-start justify-between gap-3 rounded-panel border border-line bg-accent-faint/60 px-3 py-3">
            <p className="text-xs leading-relaxed text-ink-soft">
              스킨노트만 공유할 수 있어요. 게시글에는 추가 글을 작성할 수 없어요.
            </p>
            <button type="button" className="text-ink-muted" onClick={() => { void dismissBanner("drawer"); }}>
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {(["전체", "저장", "인기"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`h-10 rounded-chip text-sm font-bold ${
                tab === item
                  ? "bg-accent text-white"
                  : "border border-line bg-surface-white text-ink-soft"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setDraft({ skinType, concern, duration });
              setFilterOpen(true);
            }}
            className="shrink-0 rounded-chip border border-line bg-surface-white px-3 py-2 text-xs font-bold text-ink"
          >
            조건 선택
          </button>
          <button
            type="button"
            onClick={() => setPhotoOnly((v) => !v)}
            className={`shrink-0 rounded-chip border px-3 py-2 text-xs font-bold ${
              photoOnly
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface-white text-ink"
            }`}
          >
            사진 {photoOnly ? "ON" : "OFF"}
          </button>
          {activeChips.map((chip) => (
            <span
              key={chip}
              className="shrink-0 rounded-chip bg-accent-faint px-3 py-2 text-xs font-bold text-accent"
            >
              {chip}
            </span>
          ))}
        </div>

        {notes.length === 0 ? (
          <Card className="py-10 text-center">
            <Illustration
              src={ILLUSTRATIONS.recommendEmpty}
              alt=""
              width={96}
              height={80}
              className="mx-auto"
            />
            <p className="mt-3 text-sm font-bold text-ink-soft">조건에 맞는 스킨노트가 없어요</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => {
                  if (!state.isLoggedIn) {
                    router.push(`/login?next=/notes/${note.id}`);
                    return;
                  }
                  router.push(`/notes/${note.id}`);
                }}
                className="w-full rounded-card border border-line bg-surface-white p-4 text-left shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-line bg-accent-faint">
                    <Illustration
                      src={note.authorAvatar || defaultAvatar(note.authorId)}
                      alt=""
                      width={44}
                      height={44}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-extrabold text-ink">{note.authorNickname}</p>
                      <span className="text-[11px] text-ink-muted">
                        {relativeTime(note.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-ink-soft">
                      {note.skinType} · {note.concerns[0]} · {note.ageGroup}
                    </p>
                  </div>
                  {note.authorId === state.currentUserId && (
                    <span className="text-ink-muted">⋮</span>
                  )}
                </div>

                <div className="mt-3">
                  <Badge tone="outline">경험 카드</Badge>
                  <h3 className="mt-2 text-base font-extrabold text-ink">{note.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {note.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} tone="accent">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs font-medium text-ink-soft">
                    <span>사용 {note.durationDays}일</span>
                    <span className="text-accent">
                      체감 {"★".repeat(note.feltChange)}
                      <span className="text-ink-muted">
                        {"☆".repeat(Math.max(0, 5 - note.feltChange))}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs font-bold text-ink">
                    <span>저장 {note.saveCount}</span>
                    <span>도움돼요 {note.helpCount}</span>
                    <span>댓글 {note.commentCount}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35">
          <div className="max-h-[88svh] w-full max-w-phone overflow-auto rounded-t-[24px] bg-page p-4 animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <div className="w-8" />
              <h3 className="text-lg font-extrabold text-ink">조건 선택</h3>
              <button type="button" className="w-8 text-right" onClick={() => setFilterOpen(false)}>
                ✕
              </button>
            </div>

            <div className="space-y-4 rounded-card border border-line bg-surface-white p-4">
              <section>
                <p className="mb-2 text-sm font-extrabold text-ink">피부 타입</p>
                <div className="space-y-2">
                  {(["전체", ...SKIN_TYPES] as const).map((item) => (
                    <RadioRow
                      key={item}
                      selected={draft.skinType === item}
                      onClick={() => setDraft((d) => ({ ...d, skinType: item }))}
                    >
                      {item}
                    </RadioRow>
                  ))}
                </div>
              </section>

              <div className="border-t border-dashed border-line" />

              <section>
                <p className="mb-2 text-sm font-extrabold text-ink">피부 고민</p>
                <div className="space-y-2">
                  {DRAWER_CONCERN_FILTERS.map((item) => (
                    <RadioRow
                      key={item}
                      selected={draft.concern === item}
                      onClick={() => setDraft((d) => ({ ...d, concern: item }))}
                    >
                      {item}
                    </RadioRow>
                  ))}
                </div>
              </section>

              <div className="border-t border-dashed border-line" />

              <section>
                <p className="mb-2 text-sm font-extrabold text-ink">사용 기간</p>
                <div className="space-y-2">
                  {(["전체", "7일 미만", "7일 이상", "14일 이상"] as DurationFilter[]).map(
                    (item) => (
                      <RadioRow
                        key={item}
                        selected={draft.duration === item}
                        onClick={() => setDraft((d) => ({ ...d, duration: item }))}
                      >
                        {item}
                      </RadioRow>
                    )
                  )}
                </div>
              </section>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setDraft({ skinType: "전체", concern: "전체", duration: "전체" })
                }
              >
                초기화
              </Button>
              <Button
                onClick={() => {
                  setSkinType(draft.skinType);
                  setConcern(draft.concern);
                  setDuration(draft.duration);
                  setFilterOpen(false);
                }}
              >
                적용하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import SelectChip from "@/components/ui/SelectChip";
import {
  DRAWER_CONCERN_FILTERS,
  SKIN_TYPES,
  concernFilterMatch,
  relativeTime,
} from "@/lib/constants";
import { ILLUSTRATIONS, defaultAvatar } from "@/lib/illustrations";
import { deleteNote, dismissBanner, showToast } from "@/lib/store";
import type { SkinNote, SkinType } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

type Tab = "전체" | "저장" | "인기";
type DurationFilter = "전체" | "7일 이하" | "14일 이하" | "30일 이하";
type ConcernFilter = (typeof DRAWER_CONCERN_FILTERS)[number];

export default function DrawerPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, publicNotes } = useAppDerivations();
  const [tab, setTab] = useState<Tab>("전체");
  const [photoOnly, setPhotoOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [skinTypes, setSkinTypes] = useState<SkinType[]>([]);
  const [concerns, setConcerns] = useState<ConcernFilter[]>([]);
  const [duration, setDuration] = useState<DurationFilter>("전체");
  const [draftTypes, setDraftTypes] = useState<SkinType[]>([]);
  const [draftConcerns, setDraftConcerns] = useState<ConcernFilter[]>([]);
  const [draftDuration, setDraftDuration] = useState<DurationFilter>("전체");
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null);

  const notes = useMemo(() => {
    let list: SkinNote[] = [...publicNotes];
    if (tab === "저장") list = list.filter((n) => state.savedNoteIds.includes(n.id));
    else if (tab === "인기") list = [...list].sort((a, b) => b.helpCount - a.helpCount);
    else
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    if (photoOnly) list = list.filter((n) => n.changeTimeline.some((t) => t.photoUrl));
    if (skinTypes.length)
      list = list.filter((n) => skinTypes.includes(n.skinType));
    if (concerns.length && !concerns.includes("전체"))
      list = list.filter((n) =>
        concerns.some((c) => concernFilterMatch(c, n.concerns))
      );
    if (duration === "7일 이하") list = list.filter((n) => n.durationDays <= 7);
    if (duration === "14일 이하") list = list.filter((n) => n.durationDays <= 14);
    if (duration === "30일 이하") list = list.filter((n) => n.durationDays <= 30);
    return list;
  }, [publicNotes, tab, state.savedNoteIds, photoOnly, skinTypes, concerns, duration]);

  const activeChips = [
    ...skinTypes,
    ...concerns.filter((c) => c !== "전체"),
    duration !== "전체" ? duration : null,
  ].filter(Boolean) as string[];

  const toggleDraftType = (item: SkinType | "전체") => {
    if (item === "전체") {
      setDraftTypes([]);
      return;
    }
    setDraftTypes((prev) =>
      prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item]
    );
  };

  const toggleDraftConcern = (item: ConcernFilter) => {
    if (item === "전체") {
      setDraftConcerns([]);
      return;
    }
    setDraftConcerns((prev) => {
      const next = prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item];
      return next.filter((c) => c !== "전체");
    });
  };

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
            <button
              type="button"
              className="text-ink-muted"
              onClick={() => {
                void dismissBanner("drawer");
              }}
            >
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
            onClick={() => setPhotoOnly((v) => !v)}
            className={`shrink-0 rounded-chip border px-3 py-2 text-xs font-bold ${
              photoOnly
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface-white text-ink"
            }`}
          >
            사진 {photoOnly ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftTypes(skinTypes);
              setDraftConcerns(concerns);
              setDraftDuration(duration);
              setFilterOpen(true);
            }}
            className="shrink-0 rounded-chip border border-line bg-surface-white px-3 py-2 text-xs font-bold text-ink"
          >
            조건 선택
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
            {notes.map((note) => {
              const isMine = note.authorId === state.currentUserId;
              return (
                <div
                  key={note.id}
                  className="w-full rounded-card border border-line bg-surface-white p-4 text-left shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      onClick={() => {
                        router.push(`/notes/${note.id}`);
                      }}
                    >
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
                    </button>
                    {isMine && (
                      <button
                        type="button"
                        className="shrink-0 px-1 text-ink-muted"
                        aria-label="더보기"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuNoteId(note.id);
                        }}
                      >
                        ⋮
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="mt-3 w-full text-left"
                    onClick={() => {
                      router.push(`/notes/${note.id}`);
                    }}
                  >
                    <Badge tone="outline">스킨노트</Badge>
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
                        </span>{" "}
                        {note.feltChange}
                      </span>
                    </div>
                  </button>

                  <div className="mt-3 flex gap-4 text-xs font-bold text-ink">
                    <span>저장 {note.saveCount}</span>
                    <span>도움돼요 {note.helpCount}</span>
                    <span>댓글 {note.commentCount}</span>
                  </div>
                </div>
              );
            })}
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
                <p className="mb-2 text-sm font-extrabold text-ink">피부 타입 (복수 선택)</p>
                <div className="flex flex-wrap gap-2">
                  <SelectChip
                    selected={draftTypes.length === 0}
                    onClick={() => toggleDraftType("전체")}
                    className="text-xs"
                  >
                    전체
                  </SelectChip>
                  {SKIN_TYPES.map((item) => (
                    <SelectChip
                      key={item}
                      selected={draftTypes.includes(item)}
                      onClick={() => toggleDraftType(item)}
                      className="text-xs"
                    >
                      {item}
                    </SelectChip>
                  ))}
                </div>
              </section>

              <div className="border-t border-dashed border-line" />

              <section>
                <p className="mb-2 text-sm font-extrabold text-ink">피부 고민 (복수 선택)</p>
                <div className="flex flex-wrap gap-2">
                  {DRAWER_CONCERN_FILTERS.map((item) => (
                    <SelectChip
                      key={item}
                      selected={
                        item === "전체"
                          ? draftConcerns.length === 0
                          : draftConcerns.includes(item)
                      }
                      onClick={() => toggleDraftConcern(item)}
                      className="text-xs"
                    >
                      {item}
                    </SelectChip>
                  ))}
                </div>
              </section>

              <div className="border-t border-dashed border-line" />

              <section>
                <p className="mb-2 text-sm font-extrabold text-ink">사용 기간</p>
                <div className="flex flex-wrap gap-2">
                  {(["전체", "7일 이하", "14일 이하", "30일 이하"] as DurationFilter[]).map(
                    (item) => (
                      <SelectChip
                        key={item}
                        selected={draftDuration === item}
                        onClick={() => setDraftDuration(item)}
                        className="text-xs"
                      >
                        {item}
                      </SelectChip>
                    )
                  )}
                </div>
              </section>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDraftTypes([]);
                  setDraftConcerns([]);
                  setDraftDuration("전체");
                }}
              >
                초기화
              </Button>
              <Button
                onClick={() => {
                  setSkinTypes(draftTypes);
                  setConcerns(draftConcerns);
                  setDuration(draftDuration);
                  setFilterOpen(false);
                }}
              >
                적용하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {menuNoteId && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35">
          <div className="w-full max-w-phone rounded-t-[24px] bg-surface-white p-4">
            <button
              type="button"
              className="w-full rounded-panel px-3 py-3 text-left font-bold text-accent"
              onClick={() => {
                void deleteNote(menuNoteId).then(() => {
                  showToast("스킨노트를 삭제했어요.");
                  setMenuNoteId(null);
                });
              }}
            >
              삭제하기
            </button>
            <button
              type="button"
              className="mt-2 w-full rounded-panel px-3 py-3 text-left font-bold text-ink-muted"
              onClick={() => setMenuNoteId(null)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

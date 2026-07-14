"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import SelectChip from "@/components/ui/SelectChip";
import StarRating from "@/components/ui/StarRating";
import { trackEvent } from "@/lib/analytics";
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
type DurationFilter = "전체" | "14일 이하" | "30일 이하";
type ConcernFilter = (typeof DRAWER_CONCERN_FILTERS)[number];

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        selected ? "border-sky" : "border-sky/60"
      }`}
    >
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-sky" />}
    </span>
  );
}

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
    if (skinTypes.length) list = list.filter((n) => skinTypes.includes(n.skinType));
    if (concerns.length && !concerns.includes("전체"))
      list = list.filter((n) =>
        concerns.some((c) => concernFilterMatch(c, n.concerns))
      );
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
    setDraftTypes((prev) => {
      const removing = prev.includes(item);
      trackEvent("filter_apply", {
        filter_type: "skin_type",
        filter_value: item,
        action: removing ? "remove" : "add",
      });
      return removing ? prev.filter((t) => t !== item) : [...prev, item];
    });
  };

  const toggleDraftConcern = (item: ConcernFilter) => {
    if (item === "전체") {
      setDraftConcerns([]);
      return;
    }
    setDraftConcerns((prev) => {
      const removing = prev.includes(item);
      trackEvent("filter_apply", {
        filter_type: "concern",
        filter_value: item,
        action: removing ? "remove" : "add",
      });
      const next = removing ? prev.filter((c) => c !== item) : [...prev, item];
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
        <header className="text-center">
          <h1 className="text-[22px] font-extrabold text-ink">스킨 서랍장</h1>
          <p className="mt-1 text-sm text-ink-muted">나의 루틴을 나누고 함께 성장해요!</p>
        </header>

        {!state.bannerDismissed.drawer && (
          <div className="flex items-start gap-2.5 rounded-[14px] border border-line bg-surface-card px-3 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sky text-[11px] font-bold text-sky">
              i
            </span>
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink-soft">
              스킨노트만 공유할 수 있어요.
              <br />
              게시글에는 추가 글을 작성할 수 없어요.
            </p>
            <button
              type="button"
              className="shrink-0 text-ink-muted"
              onClick={() => {
                void dismissBanner("drawer");
              }}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-line/50">
          {(["전체", "저장", "인기"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`flex-1 pb-2.5 text-sm font-extrabold ${
                tab === item
                  ? "border-b-2 border-sky text-ink"
                  : "text-ink-muted"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setDraftTypes(skinTypes);
              setDraftConcerns(concerns);
              setDraftDuration(duration);
              setFilterOpen(true);
            }}
            className="shrink-0 rounded-chip border border-sky bg-surface-card px-3 py-2 text-xs font-bold text-ink"
          >
            조건 선택 ▾
          </button>
          {activeChips.map((chip) => (
            <span
              key={chip}
              className="shrink-0 rounded-chip border border-sky bg-surface-card px-3 py-2 text-xs font-bold text-ink"
            >
              {chip}
            </span>
          ))}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
            <span className="text-xs font-bold text-ink-muted">사진</span>
            <button
              type="button"
              role="switch"
              aria-checked={photoOnly}
              onClick={() => setPhotoOnly((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition ${
                photoOnly ? "bg-sky" : "bg-[#D5DEEB]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  photoOnly ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
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
            {notes.map((note, position) => {
              const isMine = note.authorId === state.currentUserId;
              const openNote = () => {
                trackEvent("card_click", { card_id: note.id, position });
                router.push(`/notes/${note.id}`);
              };
              return (
                <div
                  key={note.id}
                  className="relative w-full rounded-card border border-line bg-surface-card p-4 text-left shadow-card"
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                      onClick={openNote}
                    >
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-dashed border-line bg-surface-empty">
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
                          <p className="truncate font-extrabold text-ink">
                            {note.authorNickname}
                          </p>
                          <span className="shrink-0 text-[11px] text-ink-muted">
                            {relativeTime(note.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-muted">
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
                          setMenuNoteId((id) => (id === note.id ? null : note.id));
                        }}
                      >
                        ⋮
                      </button>
                    )}
                  </div>

                  {menuNoteId === note.id && (
                    <div className="absolute right-3 top-12 z-10 overflow-hidden rounded-[12px] border border-line bg-surface-card shadow-card">
                      <button
                        type="button"
                        className="block w-full px-4 py-2.5 text-left text-sm font-bold text-accent"
                        onClick={() => {
                          void deleteNote(note.id).then(() => {
                            showToast("스킨노트를 삭제했어요.");
                            setMenuNoteId(null);
                          });
                        }}
                      >
                        삭제하기
                      </button>
                    </div>
                  )}

                  <button type="button" className="mt-3 w-full text-left" onClick={openNote}>
                    <p className="text-[12px] font-bold text-sky">✦ 스킨노트</p>
                    <h3 className="mt-1 text-[15px] font-extrabold text-ink">{note.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {note.tags.slice(0, 5).map((tag) => (
                        <SelectChip
                          key={tag}
                          selected={false}
                          className="pointer-events-none !px-2 !py-1 text-[10px]"
                        >
                          {tag}
                        </SelectChip>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-[12px] border border-dashed border-line/80 px-3 py-2.5 text-center text-[11px]">
                      <div className="border-r border-dashed border-line/60">
                        <p className="text-ink-muted">사용 기간</p>
                        <p className="mt-0.5 font-extrabold text-ink">{note.durationDays}일</p>
                      </div>
                      <div>
                        <p className="text-ink-muted">체감 변화</p>
                        <div className="mt-0.5 flex items-center justify-center gap-1">
                          {note.feltChange > 0 ? (
                            <>
                              <StarRating value={note.feltChange} readOnly size="sm" />
                              <span className="font-extrabold text-ink">{note.feltChange}</span>
                            </>
                          ) : (
                            <span className="font-extrabold text-ink-muted">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="mt-3 flex gap-4 text-xs font-bold text-ink-muted">
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

      {/* Filter sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35">
          <div className="max-h-[88svh] w-full max-w-phone overflow-auto rounded-t-[24px] border border-line bg-surface-card p-4 animate-fade-up">
            <div className="mb-3 flex items-center justify-between">
              <div className="w-8" />
              <h3 className="text-lg font-extrabold text-ink">조건 선택</h3>
              <button
                type="button"
                className="w-8 text-right text-ink-muted"
                onClick={() => setFilterOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <section className="border-b border-dashed border-line/70 pb-3">
                <p className="mb-1 px-1 text-sm font-extrabold text-ink">피부 타입</p>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-1 py-2.5"
                  onClick={() => toggleDraftType("전체")}
                >
                  <span
                    className={`text-sm font-bold ${
                      draftTypes.length === 0 ? "text-ink" : "text-ink-muted"
                    }`}
                  >
                    전체
                  </span>
                  <RadioDot selected={draftTypes.length === 0} />
                </button>
                {SKIN_TYPES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="flex w-full items-center justify-between px-1 py-2.5"
                    onClick={() => toggleDraftType(item)}
                  >
                    <span
                      className={`text-sm font-bold ${
                        draftTypes.includes(item) ? "text-ink" : "text-ink-muted"
                      }`}
                    >
                      {item}
                    </span>
                    <RadioDot selected={draftTypes.includes(item)} />
                  </button>
                ))}
              </section>

              <section className="border-b border-dashed border-line/70 py-3">
                <p className="mb-1 px-1 text-sm font-extrabold text-ink">피부 고민</p>
                {DRAWER_CONCERN_FILTERS.map((item) => {
                  const selected =
                    item === "전체"
                      ? draftConcerns.length === 0
                      : draftConcerns.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className="flex w-full items-center justify-between px-1 py-2.5"
                      onClick={() => toggleDraftConcern(item)}
                    >
                      <span
                        className={`text-sm font-bold ${
                          selected ? "text-ink" : "text-ink-muted"
                        }`}
                      >
                        {item}
                      </span>
                      <RadioDot selected={selected} />
                    </button>
                  );
                })}
              </section>

              <section className="pt-3">
                <p className="mb-1 px-1 text-sm font-extrabold text-ink">사용 기간</p>
                {(["전체", "14일 이하", "30일 이하"] as DurationFilter[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="flex w-full items-center justify-between px-1 py-2.5"
                    onClick={() => {
                      if (draftDuration !== item) {
                        trackEvent("filter_apply", {
                          filter_type: "duration",
                          filter_value: item,
                          action: "add",
                        });
                      }
                      setDraftDuration(item);
                    }}
                  >
                    <span
                      className={`text-sm font-bold ${
                        draftDuration === item ? "text-ink" : "text-ink-muted"
                      }`}
                    >
                      {item}
                    </span>
                    <RadioDot selected={draftDuration === item} />
                  </button>
                ))}
              </section>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
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
    </AppShell>
  );
}

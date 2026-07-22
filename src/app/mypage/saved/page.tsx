"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import PageHeader from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import StarRating from "@/components/ui/StarRating";
import { ILLUSTRATIONS, defaultAvatar, peachFeelingIllustration } from "@/lib/illustrations";
import { showToast, toggleSaveNote } from "@/lib/store";
import type { SkinNote } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function SavedSkinNotesPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, publicNotes, myNotes } = useAppDerivations();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/mypage/saved");
  }, [hydrated, state.isLoggedIn, router]);

  /** 최근 저장한 순 (savedNoteIds 뒤에 추가되므로 역순) */
  const savedNotes = useMemo(() => {
    const byId = new Map(
      [...publicNotes, ...myNotes, ...state.skinNotes].map((note) => [note.id, note])
    );
    return [...state.savedNoteIds]
      .reverse()
      .map((id) => byId.get(id))
      .filter((note): note is SkinNote => Boolean(note));
  }, [state.savedNoteIds, state.skinNotes, publicNotes, myNotes]);

  if (!hydrated || !state.isLoggedIn) {
    return (
      <AppShell>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="저장한 스킨노트"
        subtitle="저장한 스킨노트를 한곳에서 확인해보세요."
        center
        backHref="/mypage"
      />

      <div className="page-pad mt-1 space-y-3 pb-6 animate-fade-up">
        <Illustration
          src={ILLUSTRATIONS.tagsHero1}
          alt=""
          width={96}
          height={80}
          className="mx-auto"
          priority
        />

        {savedNotes.length === 0 ? (
          <Card className="py-10 text-center">
            <Illustration
              src={ILLUSTRATIONS.recommendEmpty}
              alt=""
              width={96}
              height={80}
              className="mx-auto"
            />
            <p className="mt-3 text-sm font-bold text-ink-soft">아직 저장한 스킨노트가 없어요</p>
          </Card>
        ) : (
          <div className="relative space-y-3">
            {expandedId && (
              <button
                type="button"
                aria-label="접기"
                className="fixed inset-0 z-[40] bg-ink/35"
                style={{ bottom: "calc(var(--nav-height) + var(--safe-bottom))" }}
                onClick={() => {
                  setExpandedId(null);
                  setMenuNoteId(null);
                }}
              />
            )}

            {savedNotes.map((note) => {
              const expanded = expandedId === note.id;
              const title = `${note.durationDays}일 사용 후기`;

              return (
                <div
                  key={note.id}
                  className={`relative rounded-card bg-white p-4 text-left shadow-card transition ${
                    expanded ? "z-[45]" : expandedId ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                      onClick={() => {
                        setMenuNoteId(null);
                        setExpandedId((id) => (id === note.id ? null : note.id));
                      }}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-line bg-surface-empty">
                        <Illustration
                          src={note.authorAvatar || defaultAvatar(note.authorId)}
                          alt=""
                          width={44}
                          height={44}
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold text-ink">{note.authorNickname}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {note.skinType} · {note.concerns[0]} · {note.ageGroup}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="relative z-[46] shrink-0 px-1 text-ink-muted"
                      aria-label="더보기"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuNoteId((id) => (id === note.id ? null : note.id));
                      }}
                    >
                      ⋮
                    </button>
                  </div>

                  {menuNoteId === note.id && (
                    <div className="absolute right-3 top-12 z-[47] overflow-hidden rounded-[12px] bg-white shadow-card">
                      <button
                        type="button"
                        className="block w-full px-4 py-2.5 text-left text-sm font-bold text-ink"
                        onClick={() => {
                          void toggleSaveNote(note.id).then(() => {
                            showToast("저장을 취소했어요.");
                            setMenuNoteId(null);
                            if (expandedId === note.id) setExpandedId(null);
                          });
                        }}
                      >
                        저장 취소하기
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="mt-3 w-full text-left"
                    onClick={() => {
                      setMenuNoteId(null);
                      setExpandedId((id) => (id === note.id ? null : note.id));
                    }}
                  >
                    <p className="text-[12px] font-bold text-sky">✦ 스킨노트</p>
                    <h3 className="mt-1 text-[15px] font-extrabold text-ink">{title}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {note.tags.slice(0, 3).map((tag) => (
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

                    {expanded && (
                      <div className="mt-4 space-y-4 border-t border-dashed border-line/60 pt-4">
                        {note.products.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-extrabold text-ink">사용 제품</p>
                            <div className="overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x">
                              <div className="flex w-max gap-2">
                                {note.products.map((product) => (
                                  <div key={product.id} className="w-[72px] shrink-0 text-center">
                                    <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-line bg-surface-empty text-[10px] font-bold text-ink-muted">
                                      {product.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={product.imageUrl}
                                          alt=""
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        (product.category ?? product.name).slice(0, 2)
                                      )}
                                    </div>
                                    <p className="line-clamp-2 text-[10px] font-bold text-ink">
                                      {product.name}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {note.changeTimeline.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-extrabold text-ink">변화 과정</p>
                            <div className="overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x">
                              <div className="flex w-max gap-2">
                                {note.changeTimeline.map((item, index) => (
                                  <div
                                    key={`${item.label}-${index}`}
                                    className="w-[72px] shrink-0 text-center"
                                  >
                                    {item.photoUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={item.photoUrl}
                                        alt=""
                                        className="mx-auto mb-1 h-14 w-full rounded-[10px] object-cover"
                                      />
                                    ) : (
                                      <div className="mx-auto mb-1 flex h-14 w-full items-center justify-center rounded-[10px] bg-accent-faint">
                                        <Illustration
                                          src={peachFeelingIllustration(item.feeling)}
                                          alt="피치"
                                          width={40}
                                          height={40}
                                          className="h-10 w-10 object-contain"
                                        />
                                      </div>
                                    )}
                                    <p className="text-[10px] font-bold text-ink-muted">
                                      {item.label}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import StarRating from "@/components/ui/StarRating";
import { TextInput } from "@/components/ui/Field";
import { trackEvent, trackScreenView } from "@/lib/analytics";
import { relativeTime } from "@/lib/constants";
import { defaultAvatar, peachFeelingIllustration } from "@/lib/illustrations";
import {
  addComment,
  canViewNoteDetail,
  consumeViewQuota,
  deleteComment,
  deleteNote,
  markNoteViewed,
  reportComment,
  reportNote,
  showToast,
  toggleCommentLike,
  toggleHelpNote,
  toggleSaveNote,
} from "@/lib/store";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const { state } = useAppDerivations();
  const note = state.skinNotes.find((n) => n.id === params.id);
  const [comment, setComment] = useState("");
  const [sort, setSort] = useState<"latest" | "likes">("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const [sheet, setSheet] = useState<"note" | "comment" | null>(null);
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);
  const [loginModal, setLoginModal] = useState(false);
  const [quotaModal, setQuotaModal] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!hydrated || !note) return;
    const quota = canViewNoteDetail(state);
    if (state.isLoggedIn && !quota.allowed && note.authorId !== state.currentUserId) {
      setQuotaModal(true);
      return;
    }
    if (
      state.isLoggedIn &&
      note.authorId !== state.currentUserId &&
      !quota.unlimited
    ) {
      void consumeViewQuota();
    }
    markNoteViewed(note.id);
    setAllowed(true);
    trackScreenView("community_detail", { card_id: note.id }, note.id);
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const comments = useMemo(() => {
    const list = state.comments.filter((c) => c.noteId === params.id);
    if (sort === "likes") return [...list].sort((a, b) => b.likeCount - a.likeCount);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [state.comments, params.id, sort]);

  if (!hydrated || !note) {
    return (
      <AppShell>
        <div className="page-pad py-10 text-center text-ink-muted">
          {hydrated ? "스킨노트를 찾을 수 없어요" : "불러오는 중..."}
        </div>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell>
        <PageHeader
          title="스킨노트 상세"
          subtitle="나의 루틴을 나누고 함께 성장해요!"
          center
          backHref="/drawer"
        />
        <Modal
          open={quotaModal}
          title="오늘 열람 가능 횟수를 모두 사용했어요"
          description="스킨노트를 공유하면 더 많은 경험을 열람할 수 있어요."
          confirmLabel="확인"
          hideCancel
          onConfirm={() => router.push("/drawer")}
        />
      </AppShell>
    );
  }

  const isMine = note.authorId === state.currentUserId;
  const saved = state.savedNoteIds.includes(note.id);
  const helped = state.helpedNoteIds.includes(note.id);

  const requireLogin = (action: () => void) => {
    if (!state.isLoggedIn) {
      setLoginModal(true);
      return;
    }
    action();
  };

  return (
    <AppShell>
      <PageHeader
        title="스킨노트 상세"
        subtitle="나의 루틴을 나누고 함께 성장해요!"
        center
        helpTourId="note-detail"
        backHref="/drawer"
      />

      <div className="page-pad mt-3 space-y-4 pb-28 animate-fade-up">
        <Card className="!p-4">
          <div className="flex items-start gap-2.5">
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
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-extrabold text-ink">{note.authorNickname}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {note.skinType} · {note.concerns[0]} · {note.ageGroup}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-ink-muted">
                    {relativeTime(note.createdAt)}
                  </span>
                  {isMine ? (
                    <button
                      type="button"
                      className="rounded-chip bg-white shadow-card px-2.5 py-1 text-[11px] font-bold text-ink-soft"
                      onClick={() => setSheet("note")}
                    >
                      삭제하기
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-ink-muted"
                      onClick={() => setSheet("note")}
                      aria-label="더보기"
                    >
                      ⋮
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[12px] font-bold text-sky">✦ 스킨노트</p>
            <h2 className="mt-1 text-[18px] font-extrabold text-ink">{note.title}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <SelectChip
                  key={tag}
                  selected={false}
                  className="pointer-events-none !px-2 !py-1 text-[10px]"
                >
                  {tag}
                </SelectChip>
              ))}
            </div>
          </div>

          <div className="mt-4 -mx-4" data-help-id="detail-products">
            <div className="overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x">
              <div className="flex w-max gap-2 px-4">
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
                        "이미지"
                      )}
                    </div>
                    <p className="line-clamp-2 text-[10px] font-bold text-ink">{product.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div data-help-id="detail-progress">
            {note.changeTimeline.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-extrabold text-ink">변화 과정</p>
                <div className="-mx-4">
                  <div className="overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x">
                    <div className="flex w-max gap-2 px-4">
                      {note.changeTimeline.map((item, index) => (
                        <button
                          key={`${item.label}-${index}`}
                          type="button"
                          className="w-[76px] shrink-0 text-center"
                          onClick={() => item.photoUrl && setPreview(item.photoUrl)}
                        >
                          {item.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.photoUrl}
                              alt=""
                              className="mb-1 h-[72px] w-full rounded-[10px] object-cover"
                            />
                          ) : (
                            <div className="mb-1 flex h-[72px] items-center justify-center rounded-[10px] bg-accent-faint">
                              <Illustration
                                src={peachFeelingIllustration(item.feeling)}
                                alt="피치"
                                width={48}
                                height={48}
                                className="h-12 w-12 object-contain"
                              />
                            </div>
                          )}
                          <p className="text-[11px] font-bold text-ink">{item.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-[12px] bg-[#F9FBFE] px-3 py-2.5 text-center text-[11px]">
              <div className="border-r border-dashed border-line/60">
                <p className="text-ink-muted">사용 기간</p>
                <p className="mt-0.5 font-extrabold text-ink">{note.durationDays}일</p>
              </div>
              <div>
                <p className="text-ink-muted">체감 변화</p>
                {note.feltChange > 0 ? (
                  <div className="mt-0.5 flex items-center justify-center gap-1">
                    <StarRating value={note.feltChange} readOnly size="sm" />
                    <span className="font-extrabold text-ink">{note.feltChange}</span>
                  </div>
                ) : (
                  <p className="mt-0.5 font-extrabold text-ink-muted">-</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-sm font-bold text-ink-muted">
            <button
              type="button"
              data-help-id="detail-save"
              className={saved ? "text-sky" : ""}
              onClick={() =>
                requireLogin(() => {
                  const nextAction = saved ? "remove" : "add";
                  void toggleSaveNote(note.id).then(() => {
                    trackEvent("card_save", { card_id: note.id, action: nextAction });
                  });
                })
              }
            >
              저장 {note.saveCount}
            </button>
            <div data-help-id="detail-engage" className="flex gap-4">
              <button
                type="button"
                className={helped ? "text-sky" : ""}
                onClick={() =>
                  requireLogin(() => {
                    const nextAction = helped ? "remove" : "add";
                    void toggleHelpNote(note.id).then(() => {
                      trackEvent("card_helpful", { card_id: note.id, action: nextAction });
                    });
                  })
                }
              >
                도움돼요 {note.helpCount}
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("comment-input")?.focus()}
              >
                댓글 {note.commentCount}
              </button>
            </div>
          </div>
        </Card>

        {/* Comments */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-ink">댓글 {comments.length}</h3>
            <div className="relative">
              <button
                type="button"
                className="text-xs font-bold text-ink-muted"
                onClick={() => setSortOpen((v) => !v)}
              >
                {sort === "latest" ? "최신순" : "좋아요순"} ▾
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-7 z-20 min-w-[100px] overflow-hidden rounded-[12px] bg-white shadow-card">
                  <button
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-xs font-bold ${
                      sort === "latest" ? "bg-sky-faint text-sky" : "text-ink"
                    }`}
                    onClick={() => {
                      setSort("latest");
                      setSortOpen(false);
                    }}
                  >
                    최신순
                  </button>
                  <button
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-xs font-bold ${
                      sort === "likes" ? "bg-sky-faint text-sky" : "text-ink"
                    }`}
                    onClick={() => {
                      setSort("likes");
                      setSortOpen(false);
                    }}
                  >
                    좋아요순
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {comments.map((item) => {
              const liked = state.likedCommentIds.includes(item.id);
              const isMyComment = item.authorId === state.currentUserId;
              const isAuthor = item.authorId === note.authorId;
              return (
                <div key={item.id} className="flex items-start gap-2.5">
                  <Illustration
                    src={item.authorAvatar || defaultAvatar(item.authorId || item.authorNickname)}
                    alt=""
                    width={32}
                    height={32}
                    className="mt-0.5 shrink-0 rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-extrabold text-ink">{item.authorNickname}</p>
                      {isAuthor && (
                        <span className="rounded-chip bg-sky-faint px-1.5 py-0.5 text-[10px] font-bold text-sky">
                          작성자
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.content}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                      <span>{relativeTime(item.createdAt)}</span>
                      <button
                        type="button"
                        className={`ml-auto ${liked ? "font-bold text-accent" : ""}`}
                        onClick={() =>
                          requireLogin(() => {
                            void toggleCommentLike(item.id);
                          })
                        }
                      >
                        ♡ {item.likeCount}
                      </button>
                      <button
                        type="button"
                        className="text-ink-muted"
                        aria-label="더보기"
                        onClick={() => {
                          setTargetCommentId(item.id);
                          setSheet("comment");
                        }}
                      >
                        ⋮
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sticky comment input */}
      <div
        data-help-id="detail-comment-input"
        className="absolute inset-x-0 bottom-[calc(var(--nav-height)+var(--safe-bottom))] z-30 border-t border-line/40 bg-surface-card px-3 py-2.5"
      >
        <div className="mx-auto flex max-w-phone items-center gap-2">
          <TextInput
            id="comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="따뜻한 댓글을 남겨주세요."
            className="!h-11"
            onFocus={() => {
              if (!state.isLoggedIn) setLoginModal(true);
            }}
          />
          <Button
            size="md"
            className="!h-11 shrink-0 !px-3"
            disabled={!comment.trim()}
            onClick={() =>
              requireLogin(() => {
                void addComment(note.id, comment.trim())
                  .then(() => {
                    trackEvent("comment_write", {
                      card_id: note.id,
                      has_image: false,
                      is_reply: false,
                    });
                    setComment("");
                  })
                  .catch(() => {
                    // 서버 실패 시 이벤트 미발생
                  });
              })
            }
            aria-label="댓글 등록"
          >
            ✈
          </Button>
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35">
          <div className="w-full max-w-phone rounded-t-[24px] bg-white shadow-card p-4">
            {sheet === "note" && (
              <div className="space-y-2">
                {isMine ? (
                  <button
                    type="button"
                    className="w-full rounded-[14px] px-3 py-3 text-left font-bold text-accent"
                    onClick={() => {
                      void deleteNote(note.id).then(() => {
                        showToast("스킨노트를 삭제했어요.");
                        router.push("/drawer");
                      });
                    }}
                  >
                    삭제하기
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-[14px] px-3 py-3 text-left font-bold text-ink"
                    onClick={() => {
                      requireLogin(() => {
                        void reportNote(note.id).then((result) => {
                          setSheet(null);
                          if (!result.ok) {
                            showToast(result.message);
                            return;
                          }
                          router.push("/settings/inquiry?from=report");
                        });
                      });
                    }}
                  >
                    신고하기
                  </button>
                )}
                <button
                  type="button"
                  className="w-full rounded-[14px] px-3 py-3 text-left font-bold text-ink-muted"
                  onClick={() => setSheet(null)}
                >
                  취소
                </button>
              </div>
            )}
            {sheet === "comment" && (
              <div className="space-y-2">
                {state.comments.find((c) => c.id === targetCommentId)?.authorId ===
                state.currentUserId ? (
                  <button
                    type="button"
                    className="w-full rounded-[14px] px-3 py-3 text-left font-bold text-accent"
                    onClick={() => {
                      if (targetCommentId) void deleteComment(targetCommentId);
                      setSheet(null);
                    }}
                  >
                    삭제하기
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-[14px] px-3 py-3 text-left font-bold text-ink"
                    onClick={() => {
                      requireLogin(() => {
                        if (!targetCommentId) {
                          setSheet(null);
                          return;
                        }
                        void reportComment(targetCommentId, note.id).then((result) => {
                          setSheet(null);
                          if (!result.ok) {
                            showToast(result.message);
                            return;
                          }
                          router.push("/settings/inquiry?from=report");
                        });
                      });
                    }}
                  >
                    신고하기
                  </button>
                )}
                <button
                  type="button"
                  className="w-full rounded-[14px] px-3 py-3 text-left font-bold text-ink-muted"
                  onClick={() => setSheet(null)}
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={loginModal}
        title="로그인이 필요해요"
        description="저장, 도움돼요, 댓글은 로그인 후 이용할 수 있어요."
        confirmLabel="로그인"
        cancelLabel="닫기"
        onCancel={() => setLoginModal(false)}
        onConfirm={() => router.push(`/login?next=/notes/${note.id}`)}
      />

      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 p-6"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="max-h-[80svh] rounded-card object-contain" />
        </div>
      )}
    </AppShell>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StarRating from "@/components/ui/StarRating";
import { TextInput } from "@/components/ui/Field";
import { CHANGE_FEELINGS, relativeTime } from "@/lib/constants";
import { defaultAvatar } from "@/lib/illustrations";
import {
  addComment,
  canViewNoteDetail,
  consumeViewQuota,
  deleteComment,
  deleteNote,
  dismissBanner,
  hideNote,
  markNoteViewed,
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
  const [sheet, setSheet] = useState<"note" | "comment" | null>(null);
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);
  const [loginModal, setLoginModal] = useState(false);
  const [quotaModal, setQuotaModal] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!hydrated || !note) return;
    if (!state.isLoggedIn) {
      router.replace(`/login?next=/notes/${note.id}`);
      return;
    }
    const quota = canViewNoteDetail(state);
    if (!quota.allowed && note.authorId !== state.currentUserId) {
      setQuotaModal(true);
      return;
    }
    if (note.authorId !== state.currentUserId && !quota.unlimited) {
      void consumeViewQuota();
    }
    markNoteViewed(note.id);
    setAllowed(true);
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
      <AppShell showNav={false}>
        <div className="page-pad py-10 text-center text-ink-muted">
          {hydrated ? "스킨노트를 찾을 수 없어요" : "불러오는 중..."}
        </div>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell showNav={false}>
        <PageHeader title="스킨노트 상세" backHref="/drawer" />
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
    <AppShell showNav={false}>
      <PageHeader title="스킨노트 상세" backHref="/drawer" />

      <div className="page-pad mt-3 space-y-4 pb-28 animate-fade-up">
        {!state.bannerDismissed.detail && (
          <div className="flex items-start justify-between gap-3 rounded-panel border border-line bg-accent-faint/60 px-3 py-3">
            <p className="text-xs leading-relaxed text-ink-soft">
              경험카드만 공유할 수 있어요. 게시글에는 추가 글을 작성할 수 없어요.
            </p>
            <button type="button" onClick={() => { void dismissBanner("detail"); }}>
              ✕
            </button>
          </div>
        )}

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-line bg-accent-faint">
              <Illustration
                src={note.authorAvatar || defaultAvatar(note.authorId)}
                alt=""
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-ink">{note.authorNickname}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {note.skinType} · {note.ageGroup} · 민감도 {note.sensitivity} ·{" "}
                {relativeTime(note.createdAt)}
              </p>
            </div>
            <button type="button" className="text-ink-muted" onClick={() => setSheet("note")}>
              ⋮
            </button>
          </div>

          <div className="mt-4">
            <Badge tone="outline">경험 카드</Badge>
            <h2 className="mt-2 text-xl font-extrabold text-ink">{note.title}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <Badge key={tag} tone="accent">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-ink">사용 제품</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {note.products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="w-24 shrink-0 rounded-panel border border-line p-2 text-center"
                >
                  <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-panel border border-dashed border-line bg-accent-faint text-[10px] font-bold text-accent">
                    {(product.category ?? product.name).slice(0, 2)}
                  </div>
                  <p className="line-clamp-2 text-[11px] text-ink">{product.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-ink">변화 과정</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {note.changeTimeline.map((item, index) => {
                const feeling = CHANGE_FEELINGS.find((f) => f.value === item.feeling);
                return (
                  <button
                    key={`${item.label}-${index}`}
                    type="button"
                    className="w-28 shrink-0 rounded-panel border border-line p-2 text-center"
                    onClick={() => item.photoUrl && setPreview(item.photoUrl)}
                  >
                    {item.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photoUrl}
                        alt=""
                        className="mb-1 h-20 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="mb-1 flex h-20 items-center justify-center rounded-lg bg-accent-faint text-2xl">
                        {feeling?.emoji ?? "🙂"}
                      </div>
                    )}
                    <p className="text-[11px] font-bold text-ink">{item.label}</p>
                    <p className="text-[10px] text-ink-muted">{feeling?.value}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-ink">변화 태그</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {note.tags.map((tag) => (
                <Badge key={tag} tone="accent">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-panel bg-surface p-3 text-center text-xs">
            <div>
              <p className="text-ink-muted">사용 기간</p>
              <p className="mt-1 font-extrabold text-ink">{note.durationDays}일</p>
            </div>
            <div>
              <p className="text-ink-muted">난이도</p>
              <p className="mt-1 font-extrabold text-ink">{note.difficulty}</p>
            </div>
            <div>
              <p className="text-ink-muted">체감 변화</p>
              <div className="mt-1 flex justify-center">
                <StarRating value={note.feltChange} readOnly size="sm" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-sm font-bold">
            <button
              type="button"
              className={saved ? "text-accent" : "text-ink-soft"}
              onClick={() => requireLogin(() => { void toggleSaveNote(note.id); })}
            >
              저장 {note.saveCount}
            </button>
            <button
              type="button"
              className={helped ? "text-accent" : "text-ink-soft"}
              onClick={() => requireLogin(() => { void toggleHelpNote(note.id); })}
            >
              도움돼요 {note.helpCount}
            </button>
            <button
              type="button"
              className="text-ink-soft"
              onClick={() => document.getElementById("comment-input")?.focus()}
            >
              댓글 {note.commentCount}
            </button>
          </div>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-ink">댓글 {comments.length}</h3>
            <button
              type="button"
              className="text-xs font-bold text-accent"
              onClick={() => setSort((s) => (s === "latest" ? "likes" : "latest"))}
            >
              {sort === "latest" ? "최신순" : "좋아요순"} ▾
            </button>
          </div>
          <div className="space-y-3">
            {comments.map((item) => {
              const liked = state.likedCommentIds.includes(item.id);
              return (
                <Card key={item.id} className="!p-3">
                  <div className="flex items-start gap-2">
                    <Illustration
                      src={defaultAvatar(item.authorId || item.authorNickname)}
                      alt=""
                      width={32}
                      height={32}
                      className="shrink-0 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-ink">{item.authorNickname}</p>
                        <button
                          type="button"
                          className="text-ink-muted"
                          onClick={() => {
                            setTargetCommentId(item.id);
                            setSheet("comment");
                          }}
                        >
                          ⋮
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{item.content}</p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-muted">
                        <span>{relativeTime(item.createdAt)}</span>
                        <button
                          type="button"
                          className={liked ? "font-bold text-accent" : ""}
                          onClick={() => requireLogin(() => { void toggleCommentLike(item.id); })}
                        >
                          좋아요 {item.likeCount}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-phone gap-2 border-t border-line/50 bg-surface-white p-3">
        <TextInput
          id="comment-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="따뜻한 댓글을 남겨주세요."
          onFocus={() => {
            if (!state.isLoggedIn) setLoginModal(true);
          }}
        />
        <Button
          size="md"
          disabled={!comment.trim()}
          onClick={() =>
            requireLogin(() => {
              void addComment(note.id, comment.trim()).then(() => setComment(""));
            })
          }
        >
          등록
        </Button>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35">
          <div className="w-full max-w-phone rounded-t-[24px] bg-surface-white p-4">
            {sheet === "note" && (
              <div className="space-y-2">
                {isMine ? (
                  <button
                    type="button"
                    className="w-full rounded-panel px-3 py-3 text-left font-bold text-accent"
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
                  <>
                    <button
                      type="button"
                      className="w-full rounded-panel px-3 py-3 text-left font-bold text-ink"
                      onClick={() => {
                        void reportNote(note.id);
                        setSheet(null);
                      }}
                    >
                      신고하기
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-panel px-3 py-3 text-left font-bold text-ink"
                      onClick={() => {
                        void hideNote(note.id).then(() => {
                          showToast("게시글을 숨겼어요.");
                          router.push("/drawer");
                        });
                      }}
                    >
                      숨기기
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="w-full rounded-panel px-3 py-3 text-left font-bold text-ink-muted"
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
                    className="w-full rounded-panel px-3 py-3 text-left font-bold text-accent"
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
                    className="w-full rounded-panel px-3 py-3 text-left font-bold text-ink"
                    onClick={() => {
                      showToast("신고가 접수되었어요.");
                      setSheet(null);
                    }}
                  >
                    신고하기
                  </button>
                )}
                <button
                  type="button"
                  className="w-full rounded-panel px-3 py-3 text-left font-bold text-ink-muted"
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

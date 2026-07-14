"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import { SectionHeader } from "@/components/ui/PageHeader";
import StarRating from "@/components/ui/StarRating";
import { trackEvent } from "@/lib/analytics";
import { BRAND, CHANGE_FEELINGS, daysSince, formatDateDot } from "@/lib/constants";
import { compressImageFile, validateImageFile } from "@/lib/image";
import { defaultAvatar } from "@/lib/illustrations";
import { clearAvatar, logout, showToast, updateAvatar } from "@/lib/store";
import type { SkinNote } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function MyPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, user, profile, activeRoutine, myNotes } = useAppDerivations();
  const albumRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [avatarSheet, setAvatarSheet] = useState(false);
  const [previewNote, setPreviewNote] = useState<SkinNote | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/mypage");
  }, [hydrated, state.isLoggedIn, router]);

  if (!hydrated || !user) {
    return (
      <AppShell>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  const completedNotes = myNotes;
  const hasCustomAvatar = Boolean(user.avatarUrl);

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) {
      showToast(invalid);
      return;
    }
    try {
      const dataUrl = await compressImageFile(file, { maxEdge: 512, quality: 0.85 });
      await updateAvatar(dataUrl);
      showToast("프로필 사진이 변경되었어요.");
      setAvatarSheet(false);
    } catch {
      showToast("사진 업로드에 실패했어요. 다시 시도해주세요.");
    }
  };

  return (
    <AppShell>
      <div className="page-pad space-y-5 pt-5 pb-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-ink">마이페이지</h1>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-accent-faint"
            onClick={() => showToast("현재 준비중인 기능입니다.")}
            aria-label="설정"
          >
            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" aria-hidden>
              <path
                d="M8.1 1.2l.4-1h2.9l.4 1c.2.6.7 1 1.3 1.1l1 .2.9-1.1 2.1 1.2-.4 1.2c-.2.5 0 1.1.4 1.5l.7.7-1.2.9c-.5.4-.7 1-.6 1.6l.1 1 .2.1H14l-1.1.9c-.4.4-1 .6-1.5.4l-1.2-.3-.7.8-2.1-1.1.2-1.2c.1-.6-.2-1.2-.7-1.5l-.8-.5.1-.1v-1.8l1-.2c.6-.1 1.1-.5 1.3-1.1z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        <Card className="flex items-center gap-4">
          <button
            type="button"
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-panel border border-dashed border-line bg-accent-faint"
            onClick={() => setAvatarSheet(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl || defaultAvatar(user.id)}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
          <input
            ref={albumRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              await handleAvatarFile(file);
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              await handleAvatarFile(file);
            }}
          />
          <div>
            <p className="text-lg font-extrabold text-ink">{user.nickname}</p>
            <p className="mt-1 text-xs text-ink-muted">• 사진 형식은 jpg, png만 가능</p>
            <p className="text-xs text-ink-muted">• 용량은 10MB 이하로 제한</p>
          </div>
        </Card>

        <section>
          <SectionHeader title="진행중인 루틴" />
          {activeRoutine ? (
            <button
              type="button"
              className="w-full rounded-card border border-line bg-surface-white p-4 text-left shadow-card"
              onClick={() => {
                trackEvent("mypage_routine_click", { routine_id: activeRoutine.id });
                router.push("/care-log");
              }}
            >
              <Badge>진행중</Badge>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-extrabold text-ink">{activeRoutine.concernLabel} 루틴</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {daysSince(activeRoutine.startedAt)}일차 ·{" "}
                    {activeRoutine.steps.map((s) => s.category).join(" · ")}
                  </p>
                </div>
                <span className="text-accent">›</span>
              </div>
            </button>
          ) : (
            <Card className="text-center">
              <p className="text-sm font-bold text-ink-soft">진행 중인 루틴이 없어요</p>
              <Button
                className="mt-3"
                size="md"
                onClick={() => router.push("/skin-profile")}
              >
                루틴 등록하기
              </Button>
            </Card>
          )}
        </section>

        <section>
          <SectionHeader title="스킨노트 모아보기" />
          {completedNotes.length === 0 ? (
            <Card className="text-center">
              <Illustration
                src={defaultAvatar(user.id)}
                alt=""
                width={64}
                height={64}
                className="mx-auto"
              />
              <p className="mt-2 text-sm font-bold text-ink-soft">아직 완성된 스킨노트가 없어요</p>
            </Card>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {completedNotes.slice(0, 3).map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => {
                    trackEvent("mypage_skinnote_click", { card_id: note.id });
                    setPreviewNote(note);
                  }}
                  className="w-32 shrink-0 rounded-panel border border-line bg-surface-white p-3 text-center"
                >
                  {note.isAbandoned ? (
                    <Badge tone="outline" className="mb-2">
                      중도 종료
                    </Badge>
                  ) : (
                    <Badge className="mb-2">완료</Badge>
                  )}
                  <Illustration
                    src={note.authorAvatar || defaultAvatar(note.authorId)}
                    alt=""
                    width={56}
                    height={56}
                    className="mx-auto"
                  />
                  <p className="mt-2 text-xs font-bold text-ink">{note.concerns[0]} 루틴</p>
                  <p className="mt-1 text-[10px] text-ink-muted">{note.durationDays}일</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <Button
          variant="outline"
          fullWidth
          onClick={async () => {
            await logout();
            trackEvent("logout", { entry_point: "mypage" });
            router.push("/login");
          }}
        >
          로그아웃
        </Button>
      </div>

      {avatarSheet && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35"
          onClick={() => setAvatarSheet(false)}
        >
          <div
            className="w-full max-w-phone rounded-t-[24px] bg-surface-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-center text-lg font-extrabold text-ink">프로필 사진 수정</h3>
            <div className="space-y-1">
              <button
                type="button"
                className="w-full rounded-panel px-3 py-3.5 text-left text-sm font-bold text-ink"
                onClick={() => albumRef.current?.click()}
              >
                사진 앨범에서 선택
              </button>
              <button
                type="button"
                className="w-full rounded-panel px-3 py-3.5 text-left text-sm font-bold text-ink"
                onClick={() => cameraRef.current?.click()}
              >
                직접 촬영
              </button>
              {hasCustomAvatar && (
                <button
                  type="button"
                  className="w-full rounded-panel px-3 py-3.5 text-left text-sm font-bold text-accent"
                  onClick={async () => {
                    await clearAvatar();
                    showToast("프로필 사진을 삭제했어요.");
                    setAvatarSheet(false);
                  }}
                >
                  프로필 사진 삭제
                </button>
              )}
              <button
                type="button"
                className="w-full rounded-panel px-3 py-3.5 text-left text-sm font-bold text-ink-muted"
                onClick={() => setAvatarSheet(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {previewNote && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/45 p-4"
          onClick={() => setPreviewNote(null)}
        >
          <div
            className="max-h-[85svh] w-full max-w-phone overflow-y-auto rounded-card border-2 border-accent bg-surface p-4 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <Badge>{previewNote.isAbandoned ? "중도 종료" : "완료"}</Badge>
              <span className="text-[11px] text-ink-muted">
                {formatDateDot(previewNote.createdAt)} 생성
              </span>
            </div>
            <div className="space-y-3 border-b border-dashed border-line pb-3 text-sm">
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-ink-muted">피부 타입</span>
                <span className="font-bold text-ink">{previewNote.skinType}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-ink-muted">피부 고민</span>
                <span className="font-bold text-ink">{previewNote.concerns.join(" · ")}</span>
              </div>
            </div>
            <div className="space-y-3 border-b border-dashed border-line py-3 text-sm">
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-ink-muted">사용 제품</span>
                <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar">
                  {previewNote.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-line bg-accent-faint text-[9px] font-bold text-accent"
                    >
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
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-ink-muted">사용 기간</span>
                <span className="font-bold text-ink">{previewNote.durationDays}일</span>
              </div>
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-ink-muted">루틴 순서</span>
                <span className="font-bold text-ink">
                  {previewNote.products.map((p) => p.category ?? p.name).join(" > ")}
                </span>
              </div>
            </div>
            <div className="border-b border-dashed border-line py-3 text-sm">
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-ink-muted">루틴 난이도</span>
                <span className="font-bold text-ink">{previewNote.difficulty}</span>
              </div>
            </div>
            <div className="border-b border-dashed border-line py-3">
              <p className="mb-2 text-sm font-bold text-ink">변화 과정</p>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {previewNote.changeTimeline.map((item, index, arr) => {
                  const feeling = CHANGE_FEELINGS.find((f) => f.value === item.feeling);
                  return (
                    <div key={`${item.label}-${index}`} className="flex items-center gap-1">
                      <div className="w-16 text-center">
                        {item.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.photoUrl}
                            alt=""
                            className="mx-auto h-14 w-14 rounded-[10px] object-cover"
                          />
                        ) : (
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[10px] border border-dashed border-line bg-accent-faint text-xl">
                            {feeling?.emoji ?? "🙂"}
                          </div>
                        )}
                        <p className="mt-1 text-[10px] text-ink-muted">{item.label}</p>
                      </div>
                      {index < arr.length - 1 && <span className="text-accent">→</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3 pt-3 text-sm">
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-ink-muted">변화 태그</span>
                <div className="flex flex-wrap gap-1.5">
                  {previewNote.tags.map((tag) => (
                    <Badge key={tag} tone="accent" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              {previewNote.feltChange > 0 && (
                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-ink-muted">체감 변화</span>
                  <StarRating value={previewNote.feltChange} readOnly size="sm" />
                </div>
              )}
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-ink-muted">종료 사유</span>
                <span className="font-bold text-ink">{previewNote.endReason}</span>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-ink-muted">
              ✦ {BRAND} · A Note Archive ✦
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}

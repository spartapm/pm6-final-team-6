"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import { SectionHeader } from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import StarRating from "@/components/ui/StarRating";
import { trackEvent } from "@/lib/analytics";
import { BRAND, daysSince, formatDateDot } from "@/lib/constants";
import { compressImageFile, validateImageFile } from "@/lib/image";
import { defaultAvatar, peachFeelingIllustration } from "@/lib/illustrations";
import { clearAvatar, showToast, updateAvatar } from "@/lib/store";
import type { SkinNote } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function MyPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, user, activeRoutine, myNotes } = useAppDerivations();
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
          <h1 className="text-[22px] font-extrabold text-ink">마이페이지</h1>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-sky-faint"
            onClick={() => router.push("/settings")}
            aria-label="설정"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M19.4 13.1c.04-.36.06-.73.06-1.1s-.02-.74-.06-1.1l2.1-1.64a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.48 1a7.7 7.7 0 0 0-1.9-1.1l-.38-2.64A.5.5 0 0 0 13.76 1h-3.52a.5.5 0 0 0-.5.42l-.38 2.64c-.67.27-1.3.63-1.9 1.1l-2.48-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L4.6 10.9c-.04.36-.06.73-.06 1.1s.02.74.06 1.1L2.5 14.74a.5.5 0 0 0-.12.64l2 3.46c.14.24.42.34.68.22l2.48-1c.58.45 1.22.82 1.9 1.1l.38 2.64c.05.24.25.42.5.42h3.52c.24 0 .45-.18.5-.42l.38-2.64c.68-.28 1.32-.65 1.9-1.1l2.48 1c.26.12.54.02.68-.22l2-3.46a.5.5 0 0 0-.12-.64L19.4 13.1Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <Card className="!p-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[16px] bg-surface-empty"
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
            <p className="text-lg font-extrabold text-ink">{user.nickname}</p>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
            *업로드 가능한 파일 형식은 jpg, png이며 최대 용량은 10MB 입니다.
          </p>
        </Card>

        <section>
          <SectionHeader title="진행중인 루틴" />
          {activeRoutine ? (
            <button
              type="button"
              className="w-full rounded-card bg-white p-4 text-left shadow-card"
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
                <span className="text-sky">›</span>
              </div>
            </button>
          ) : (
            <Card className="text-center !py-6">
              <p className="text-sm font-extrabold text-ink">진행 중인 루틴이 없어요.</p>
              <Button
                className="mt-4"
                size="md"
                onClick={() => router.push(user ? "/skin-profile" : "/login")}
              >
                루틴 등록하기
              </Button>
            </Card>
          )}
        </section>

        <section>
          <SectionHeader title="스킨노트 모아보기" />
          {completedNotes.length === 0 ? (
            <Card className="text-center !py-6">
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
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
              {completedNotes.slice(0, 6).map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => {
                    trackEvent("mypage_skinnote_click", { card_id: note.id });
                    setPreviewNote(note);
                  }}
                  className="w-[108px] shrink-0 rounded-[16px] bg-white p-2.5 text-center shadow-card"
                >
                  {note.isAbandoned ? (
                    <Badge tone="outline" className="mb-2">
                      중도 종료
                    </Badge>
                  ) : (
                    <Badge className="mb-2">완료</Badge>
                  )}
                  <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[12px] bg-sky-faint">
                    <Illustration
                      src={note.authorAvatar || defaultAvatar(note.authorId)}
                      alt=""
                      width={56}
                      height={56}
                    />
                  </div>
                  <p className="mt-2 truncate text-[12px] font-bold text-ink">
                    {note.authorNickname || "닉네임"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2.5 text-[15px] font-extrabold text-ink">나의 관심</h2>
          <button
            type="button"
            onClick={() => router.push("/mypage/saved")}
            className="flex w-full items-center justify-between rounded-card bg-white px-4 py-3.5 text-left shadow-card"
          >
            <span className="text-[14px] font-bold text-ink">저장한 스킨노트</span>
            <span className="text-sky" aria-hidden>
              ›
            </span>
          </button>
        </section>
      </div>

      {avatarSheet && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35"
          onClick={() => setAvatarSheet(false)}
        >
          <div
            className="w-full max-w-phone rounded-t-[24px] bg-white shadow-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-center text-lg font-extrabold text-ink">프로필 사진 수정</h3>
            <div className="space-y-1">
              <button
                type="button"
                className="w-full rounded-[14px] px-3 py-3.5 text-left text-sm font-bold text-ink"
                onClick={() => albumRef.current?.click()}
              >
                사진 앨범에서 선택
              </button>
              <button
                type="button"
                className="w-full rounded-[14px] px-3 py-3.5 text-left text-sm font-bold text-ink"
                onClick={() => cameraRef.current?.click()}
              >
                직접 촬영
              </button>
              {hasCustomAvatar && (
                <button
                  type="button"
                  className="w-full rounded-[14px] px-3 py-3.5 text-left text-sm font-bold text-accent"
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
                className="w-full rounded-[14px] px-3 py-3.5 text-left text-sm font-bold text-ink-muted"
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
            className="max-h-[85svh] w-full max-w-phone overflow-y-auto rounded-card bg-white p-4 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                className="rounded-chip border border-sky bg-surface-card px-3 py-1.5 text-xs font-bold text-sky"
                onClick={() => showToast("이미지 저장은 스킨노트 완성 화면에서 가능해요.")}
              >
                스킨노트 저장하기
              </button>
              <span className="text-[11px] text-ink-muted">
                {formatDateDot(previewNote.createdAt)} 생성
              </span>
            </div>
            <div className="space-y-2.5 border-b border-dashed border-line/70 pb-3 text-sm">
              <div className="flex gap-3">
                <span className="w-[4.5rem] shrink-0 text-ink-muted">피부 타입</span>
                <span className="font-extrabold text-ink">{previewNote.skinType}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-[4.5rem] shrink-0 text-ink-muted">피부 고민</span>
                <span className="font-extrabold text-ink">
                  {previewNote.concerns.join(" · ")}
                </span>
              </div>
            </div>
            <div className="space-y-2.5 border-b border-dashed border-line/70 py-3 text-sm">
              <div className="flex gap-3">
                <span className="w-[4.5rem] shrink-0 pt-1 text-ink-muted">사용 제품</span>
                <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar">
                  {previewNote.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-empty text-[9px] font-bold text-ink-muted"
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
                <span className="w-[4.5rem] shrink-0 text-ink-muted">사용 기간</span>
                <span className="font-extrabold text-ink">{previewNote.durationDays}일</span>
              </div>
              <div className="flex gap-3">
                <span className="w-[4.5rem] shrink-0 text-ink-muted">루틴 순서</span>
                <span className="font-extrabold text-ink">
                  {previewNote.products.map((p) => p.category ?? p.name).join(" > ")}
                </span>
              </div>
            </div>
            <div className="border-b border-dashed border-line/70 py-3 text-sm">
              <div className="flex gap-3">
                <span className="w-[4.5rem] shrink-0 text-ink-muted">루틴 난이도</span>
                <span className="font-extrabold text-ink">{previewNote.difficulty}</span>
              </div>
            </div>
            <div className="border-b border-dashed border-line/70 py-3">
              <p className="mb-2 text-sm font-extrabold text-ink">변화 과정</p>
              <div className="overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x">
                <div className="flex w-max gap-2">
                  {previewNote.changeTimeline.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="w-[72px] shrink-0 text-center">
                      {item.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.photoUrl}
                          alt=""
                          className="mx-auto h-14 w-full rounded-[10px] object-cover"
                        />
                      ) : (
                        <div className="mx-auto flex h-14 w-full items-center justify-center rounded-[10px] bg-accent-faint">
                          <Illustration
                            src={peachFeelingIllustration(item.feeling)}
                            alt="피치"
                            width={40}
                            height={40}
                            className="h-10 w-10 object-contain"
                          />
                        </div>
                      )}
                      <p className="mt-1 text-[10px] text-ink-muted">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-3 text-sm">
              <div className="flex gap-3">
                <span className="w-[4.5rem] shrink-0 pt-1 text-ink-muted">변화 태그</span>
                <div className="flex flex-wrap gap-1.5">
                  {previewNote.tags.map((tag) => (
                    <SelectChip
                      key={tag}
                      selected={false}
                      className="pointer-events-none !px-2 !py-1 text-[10px] !text-sky"
                    >
                      {tag}
                    </SelectChip>
                  ))}
                </div>
              </div>
              {previewNote.feltChange > 0 && (
                <div className="flex items-center gap-3">
                  <span className="w-[4.5rem] shrink-0 text-ink-muted">체감 변화</span>
                  <StarRating value={previewNote.feltChange} readOnly size="sm" />
                </div>
              )}
              <div className="flex gap-3">
                <span className="w-[4.5rem] shrink-0 text-ink-muted">종료 사유</span>
                <span className="font-extrabold text-ink">{previewNote.endReason}</span>
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

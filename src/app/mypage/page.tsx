"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import { SectionHeader } from "@/components/ui/PageHeader";
import { daysSince } from "@/lib/constants";
import { defaultAvatar } from "@/lib/illustrations";
import { logout, showToast, updateAvatar } from "@/lib/store";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function MyPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, user, profile, activeRoutine, myNotes } = useAppDerivations();
  const fileRef = useRef<HTMLInputElement>(null);

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

  const completedNotes = myNotes.filter((n) => !n.isAbandoned);

  return (
    <AppShell>
      <div className="page-pad space-y-5 pt-5 pb-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-ink">마이페이지</h1>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-accent-faint"
            onClick={() => showToast("준비 중입니다")}
            aria-label="설정"
          >
            ⚙
          </button>
        </div>

        <Card className="flex items-center gap-4">
          <button
            type="button"
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-panel border border-dashed border-line bg-accent-faint"
            onClick={() => fileRef.current?.click()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl || defaultAvatar(user.id)}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!["image/jpeg", "image/png"].includes(file.type)) {
                showToast("jpg, png 파일만 등록할 수 있어요.");
                return;
              }
              if (file.size > 10 * 1024 * 1024) {
                showToast("사진은 10MB 이하로 등록해주세요.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => { void updateAvatar(String(reader.result)); };
              reader.readAsDataURL(file);
            }}
          />
          <div>
            <p className="text-lg font-extrabold text-ink">{user.nickname}</p>
            <p className="mt-1 text-xs text-ink-muted">• 사진 형식은 jpg, png만 가능</p>
            <p className="text-xs text-ink-muted">• 용량은 10MB 이하로 제한</p>
            {profile ? (
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge>{profile.skinType}</Badge>
                <Badge tone="outline">{profile.sensitivity}</Badge>
              </div>
            ) : (
              <button
                type="button"
                className="mt-2 text-xs font-bold text-accent"
                onClick={() => router.push("/skin-profile")}
              >
                피부 프로필 등록하기 ›
              </button>
            )}
          </div>
        </Card>

        <section>
          <SectionHeader title="진행중인 루틴" />
          {activeRoutine ? (
            <button
              type="button"
              className="w-full rounded-card border border-line bg-surface-white p-4 text-left shadow-card"
              onClick={() => router.push("/care-log")}
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
                onClick={() => router.push(profile ? "/routine/register" : "/skin-profile")}
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
                  onClick={() => router.push(`/notes/${note.id}`)}
                  className="w-32 shrink-0 rounded-panel border border-line bg-surface-white p-3 text-center"
                >
                  <Badge className="mb-2">완료</Badge>
                  <Illustration
                    src={note.authorAvatar || defaultAvatar(note.id)}
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
            router.push("/login");
          }}
        >
          로그아웃
        </Button>
      </div>
    </AppShell>
  );
}

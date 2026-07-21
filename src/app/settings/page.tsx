"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { trackEvent } from "@/lib/analytics";
import { logout, showToast } from "@/lib/store";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

function SettingsRow({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3.5 text-left"
    >
      <span className={`text-[15px] font-bold ${danger ? "text-accent" : "text-ink"}`}>
        {label}
      </span>
      <span className="text-ink-muted">›</span>
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state } = useAppDerivations();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/settings");
  }, [hydrated, state.isLoggedIn, router]);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="설정" center backHref="/mypage" />

      <div className="page-pad mt-4 space-y-5 pb-8 animate-fade-up">
        <section>
          <h2 className="mb-2 text-sm font-extrabold text-ink">서비스 안내</h2>
          <Card padded={false} className="overflow-hidden divide-y divide-black/5">
            <SettingsRow label="공지사항" onClick={() => router.push("/settings/notices")} />
            <SettingsRow label="문의하기" onClick={() => router.push("/settings/inquiry")} />
            <SettingsRow label="이용약관" onClick={() => router.push("/settings/terms")} />
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-extrabold text-ink">계정</h2>
          <Card padded={false} className="overflow-hidden divide-y divide-black/5">
            <SettingsRow label="로그아웃" onClick={() => setLogoutOpen(true)} />
            <SettingsRow
              label="회원탈퇴"
              danger
              onClick={() => setWithdrawOpen(true)}
            />
          </Card>
        </section>
      </div>

      <Modal
        open={logoutOpen}
        title="로그아웃 할까요?"
        confirmLabel="로그아웃"
        cancelLabel="취소"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          await logout();
          trackEvent("logout", { entry_point: "mypage" });
          setBusy(false);
          setLogoutOpen(false);
          router.replace("/login");
        }}
      />

      <Modal
        open={withdrawOpen}
        title="정말 탈퇴할까요?"
        description="탈퇴 시 루틴·케어로그·스킨노트 등 계정 데이터가 삭제될 수 있어요. MVP에서는 로그아웃 처리 후 안내만 제공합니다."
        confirmLabel={busy ? "처리 중..." : "탈퇴하기"}
        cancelLabel="취소"
        onCancel={() => setWithdrawOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          await logout();
          trackEvent("logout", { entry_point: "withdraw" });
          setBusy(false);
          setWithdrawOpen(false);
          showToast("회원탈퇴 요청이 접수되었어요.");
          router.replace("/login");
        }}
      />
    </AppShell>
  );
}

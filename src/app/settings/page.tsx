"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { trackEvent } from "@/lib/analytics";
import { logout, showToast, withdrawAccount } from "@/lib/store";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

function SettingsRow({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3.5 text-left"
    >
      <span className="text-[15px] font-bold text-ink">{label}</span>
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
  /** 로그아웃/탈퇴 후 홈 이동 시 로그인 강제 리다이렉트 방지 */
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn && !leaving) router.replace("/login?next=/settings");
  }, [hydrated, state.isLoggedIn, router, leaving]);

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
            <SettingsRow label="회원탈퇴" onClick={() => setWithdrawOpen(true)} />
          </Card>
        </section>
      </div>

      <Modal
        open={logoutOpen}
        title="로그아웃 하시겠습니까?"
        cancelLabel="아니요"
        confirmLabel={busy ? "처리 중..." : "예"}
        centered
        actionEmphasis="cancel"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          if (busy) return;
          setBusy(true);
          try {
            setLeaving(true);
            await logout();
            trackEvent("logout", { entry_point: "mypage" });
            setLogoutOpen(false);
            router.replace("/");
          } finally {
            setBusy(false);
          }
        }}
      />

      <Modal
        open={withdrawOpen}
        title="회원탈퇴 하시겠습니까?"
        description="탈퇴 시, 모든 정보가 삭제되며 복구되지 않습니다."
        cancelLabel="아니요"
        confirmLabel={busy ? "처리 중..." : "예"}
        centered
        actionEmphasis="cancel"
        onCancel={() => setWithdrawOpen(false)}
        onConfirm={async () => {
          if (busy) return;
          setBusy(true);
          try {
            const result = await withdrawAccount();
            if (!result.ok) {
              showToast(result.message);
              return;
            }
            setLeaving(true);
            trackEvent("logout", { entry_point: "withdraw" });
            setWithdrawOpen(false);
            router.replace("/");
          } finally {
            setBusy(false);
          }
        }}
      />
    </AppShell>
  );
}

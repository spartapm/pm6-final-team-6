"use client";

import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { showToast } from "@/lib/store";

const NOTICES = [
  { id: "n1", title: "(예시) ANA 업데이트 v1 > v2 수정사항" },
  { id: "n2", title: "(예시) 최근 신고내역 관련 처리내역" },
  { id: "n3", title: "(예시) 런칭 기념 1달 이벤트" },
];

export default function NoticesPage() {
  return (
    <AppShell>
      <PageHeader title="공지사항" center backHref="/settings" />

      <div className="page-pad mt-4 space-y-3 pb-8 animate-fade-up">
        {NOTICES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="w-full text-left"
            onClick={() => showToast("공지 상세는 추후 제공될 예정이에요.")}
          >
            <Card className="!px-4 !py-4">
              <p className="text-[14px] font-bold leading-snug text-ink">{item.title}</p>
            </Card>
          </button>
        ))}
        <p className="pt-4 text-center text-xs text-ink-muted">
          공지 상세 내용은 추후 업데이트될 예정이에요.
        </p>
      </div>
    </AppShell>
  );
}

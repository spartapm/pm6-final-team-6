"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { getNoticesNewestFirst } from "@/lib/notices";

export default function NoticesPage() {
  const router = useRouter();
  const notices = getNoticesNewestFirst();

  return (
    <AppShell>
      <PageHeader title="공지사항" center backHref="/settings" />
      <div className="page-pad mt-3">
        <div className="border-b border-line/50" />
      </div>

      <div className="page-pad mt-4 space-y-3 pb-8 animate-fade-up">
        {notices.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-muted">
            등록된 공지사항이 없어요
          </p>
        ) : (
          notices.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left"
              onClick={() => router.push(`/settings/notices/${item.id}`)}
            >
              <Card className="!px-4 !py-4">
                <p className="truncate text-[14px] font-bold leading-snug text-ink">
                  {item.title}
                </p>
              </Card>
            </button>
          ))
        )}
      </div>
    </AppShell>
  );
}

"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import { formatNoticeDate, getNoticeById } from "@/lib/notices";

export default function NoticeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const notice = useMemo(() => getNoticeById(id), [id]);

  if (!notice) {
    return (
      <AppShell>
        <PageHeader title="공지사항" center backHref="/settings/notices" />
        <div className="page-pad py-16 text-center text-sm text-ink-muted">
          공지글을 찾을 수 없어요.
          <button
            type="button"
            className="mt-4 block w-full text-sm font-bold text-sky"
            onClick={() => router.replace("/settings/notices")}
          >
            목록으로 돌아가기
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="공지사항" center backHref="/settings/notices" />

      <article className="page-pad mt-5 pb-10 animate-fade-up">
        <h2 className="break-keep text-center text-[17px] font-extrabold leading-snug text-ink">
          {notice.title}
        </h2>

        <div className="mt-4 border-b border-line/50" />

        <div className="mt-5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
          {notice.body}
        </div>

        {notice.imageUrls && notice.imageUrls.length > 0 && (
          <div className="mt-5 space-y-3">
            {notice.imageUrls.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="w-full rounded-card object-cover"
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-right text-[12px] text-ink-muted">
          작성일: {formatNoticeDate(notice.publishedAt)}
        </p>
      </article>
    </AppShell>
  );
}

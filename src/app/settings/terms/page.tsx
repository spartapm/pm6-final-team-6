"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import LegalDocument from "@/components/ui/LegalDocument";
import PageHeader from "@/components/ui/PageHeader";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/legal";

type Tab = "terms" | "privacy";

function scrollMainToTop() {
  const main = document.querySelector(".app-main, .app-main--flush");
  if (main instanceof HTMLElement) {
    main.scrollTop = 0;
  }
}

function TermsInner() {
  const search = useSearchParams();
  const [tab, setTab] = useState<Tab>("terms");

  useEffect(() => {
    const q = search.get("tab");
    if (q === "privacy" || q === "terms") setTab(q);
  }, [search]);

  useEffect(() => {
    scrollMainToTop();
  }, [tab]);

  const switchTab = (next: Tab) => {
    if (next === tab) {
      scrollMainToTop();
      return;
    }
    setTab(next);
  };

  return (
    <>
      <PageHeader title="이용약관" center backHref="/settings" />

      <div className="page-pad mt-2 animate-fade-up">
        <div className="flex border-b border-line/50">
          <button
            type="button"
            onClick={() => switchTab("terms")}
            className={`flex-1 pb-2.5 text-sm font-extrabold ${
              tab === "terms" ? "border-b-2 border-sky text-sky" : "text-ink-muted"
            }`}
          >
            이용약관
          </button>
          <button
            type="button"
            onClick={() => switchTab("privacy")}
            className={`flex-1 pb-2.5 text-sm font-extrabold ${
              tab === "privacy" ? "border-b-2 border-sky text-sky" : "text-ink-muted"
            }`}
          >
            개인정보 처리방침
          </button>
        </div>

        <article className="mt-4 pb-10">
          <LegalDocument text={tab === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY} />
        </article>
      </div>
    </>
  );
}

export default function TermsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
        }
      >
        <TermsInner />
      </Suspense>
    </AppShell>
  );
}

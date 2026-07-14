"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/PageHeader";

type Tab = "terms" | "privacy";

const PLACEHOLDER_TERMS = `ANA 이용약관

본 문서는 플레이스홀더입니다.
최종 이용약관 전문은 추후 제공받아 반영할 예정입니다.

제1장 총칙
제1조 (목적)
1. 본 약관은 ANA(A Note Archive) 서비스 이용과 관련한 기본 사항을 안내하기 위한 임시 문구입니다.

제2조 (정의)
1. ANA: 피부 루틴 기록 서비스
2. 케어로그: 일일 루틴 수행을 기록하는 기능
3. 스킨노트: 루틴 종료 후 생성되는 경험 카드
4. 스킨서랍장: 공유된 스킨노트가 모이는 공간
5. 변화 과정 기록: 주간 피부 변화 태그·사진 기록

제2장 서비스 이용
제3조 (서비스의 제공)
1. 회사는 피부 프로필, 루틴, 케어로그, 스킨노트, 커뮤니티 기능을 제공합니다.
2. 서비스 내용은 운영 정책에 따라 변경될 수 있습니다.

(이하 전문 업데이트 예정)`;

const PLACEHOLDER_PRIVACY = `ANA 개인정보처리방침

본 문서는 플레이스홀더입니다.
최종 개인정보 처리방침 전문은 추후 제공받아 반영할 예정입니다.

제1조 (수집하는 개인정보 항목)
1. 회원 가입 시: 이메일, 닉네임, 비밀번호, 연령대, 성별(선택)
2. 서비스 이용 시: 피부 프로필, 루틴·케어로그·스킨노트 기록

제2조 (개인정보의 이용 목적)
1. 회원 식별 및 서비스 제공
2. 고객 문의 응대
3. 서비스 개선 및 통계 분석

제3조 (보관 및 파기)
1. 관련 법령에 따른 기간 동안 보관 후 파기합니다.

(이하 전문 업데이트 예정)`;

function TermsInner() {
  const search = useSearchParams();
  const [tab, setTab] = useState<Tab>("terms");

  useEffect(() => {
    const q = search.get("tab");
    if (q === "privacy" || q === "terms") setTab(q);
  }, [search]);

  return (
    <>
      <PageHeader title="이용 약관" center backHref="/settings" />

      <div className="page-pad mt-2 animate-fade-up">
        <div className="flex border-b border-line/50">
          <button
            type="button"
            onClick={() => setTab("terms")}
            className={`flex-1 pb-2.5 text-sm font-extrabold ${
              tab === "terms" ? "border-b-2 border-sky text-sky" : "text-ink-muted"
            }`}
          >
            이용약관
          </button>
          <button
            type="button"
            onClick={() => setTab("privacy")}
            className={`flex-1 pb-2.5 text-sm font-extrabold ${
              tab === "privacy" ? "border-b-2 border-sky text-sky" : "text-ink-muted"
            }`}
          >
            개인정보 처리방침
          </button>
        </div>

        <article className="mt-4 whitespace-pre-wrap pb-10 text-[13px] leading-relaxed text-ink-soft">
          {tab === "terms" ? PLACEHOLDER_TERMS : PLACEHOLDER_PRIVACY}
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

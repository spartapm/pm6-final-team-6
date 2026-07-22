"use client";

import { Fragment } from "react";

/**
 * 약관 본문 렌더러
 * - 장/조 제목 굵게
 * - 링크·이메일 자동 링크 동작 방지 (조회 전용)
 */
export default function LegalDocument({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  return (
    <div
      className="select-text text-[13px] leading-relaxed text-ink-soft [&_a]:pointer-events-none [&_a]:text-inherit [&_a]:no-underline"
      {...{ "x-apple-data-detectors": "false" }}
    >
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (/^ANA\s/.test(trimmed) || trimmed === "ANA 개인정보처리방침") {
          return (
            <p key={index} className="text-[15px] font-extrabold text-ink">
              {trimmed}
            </p>
          );
        }

        if (/^제\d+장/.test(trimmed) || trimmed === "부칙") {
          return (
            <p key={index} className="mt-5 text-[14px] font-extrabold text-ink">
              {trimmed}
            </p>
          );
        }

        if (/^제\d+조/.test(trimmed)) {
          return (
            <p key={index} className="mt-4 text-[13px] font-extrabold text-ink">
              {trimmed}
            </p>
          );
        }

        // 호(하위): "  1)" / "(1)" 등 — 항 하위 들여쓰기
        if (/^\(\d+\)/.test(trimmed) || /^\d+\)/.test(trimmed)) {
          return (
            <p key={index} className="mt-1 pl-3 text-[13px] text-ink-soft">
              {trimmed}
            </p>
          );
        }

        // 항: "1." 시작
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <p key={index} className="mt-1.5 text-[13px] text-ink-soft">
              {trimmed}
            </p>
          );
        }

        return (
          <Fragment key={index}>
            <p className="mt-1.5 text-[13px] text-ink-soft">{trimmed}</p>
          </Fragment>
        );
      })}
    </div>
  );
}

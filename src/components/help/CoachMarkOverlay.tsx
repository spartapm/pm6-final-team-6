"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type { FeatureHelpStep } from "@/lib/featureHelp/types";

type Rect = { top: number; left: number; width: number; height: number };

function measureTarget(targetId: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-help-id="${targetId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function CoachMarkOverlay({
  step,
  stepIndex,
  stepCount,
  onAdvance,
  onClose,
}: {
  step: FeatureHelpStep;
  stepIndex: number;
  stepCount: number;
  onAdvance: () => void;
  onClose: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const pad = step.padding ?? 8;

  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-help-id="${step.targetId}"]`);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    const update = () => setRect(measureTarget(step.targetId));
    update();
    const timers = [80, 200, 360, 520].map((ms) => window.setTimeout(update, ms));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.targetId]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const main = document.querySelector<HTMLElement>(".app-main, .app-main--flush");
    const prevMain = main?.style.overflow;
    if (main) main.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (main) main.style.overflow = prevMain ?? "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hole = rect
    ? {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const placement =
    step.placement === "auto" || !step.placement
      ? hole && hole.top + hole.height > window.innerHeight * 0.55
        ? "above"
        : "below"
      : step.placement;

  const tooltipStyle = (() => {
    if (!hole) {
      return { top: "40%", left: "50%", transform: "translate(-50%, -50%)" } as const;
    }
    const maxWidth = Math.min(300, window.innerWidth - 32);
    const left = Math.min(
      Math.max(16, hole.left + hole.width / 2 - maxWidth / 2),
      window.innerWidth - maxWidth - 16
    );
    if (placement === "above") {
      return {
        left,
        width: maxWidth,
        bottom: window.innerHeight - hole.top + 12,
      } as const;
    }
    return {
      left,
      width: maxWidth,
      top: hole.top + hole.height + 12,
    } as const;
  })();

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="기능설명">
      {/* Dim panes (빈 영역 클릭 → 다음) */}
      {hole ? (
        <>
          <button
            type="button"
            aria-label="다음 설명"
            className="fixed left-0 right-0 top-0 bg-ink/50"
            style={{ height: hole.top }}
            onClick={onAdvance}
          />
          <button
            type="button"
            aria-label="다음 설명"
            className="fixed bottom-0 left-0 right-0 bg-ink/50"
            style={{ top: hole.top + hole.height }}
            onClick={onAdvance}
          />
          <button
            type="button"
            aria-label="다음 설명"
            className="fixed bg-ink/50"
            style={{
              top: hole.top,
              left: 0,
              width: hole.left,
              height: hole.height,
            }}
            onClick={onAdvance}
          />
          <button
            type="button"
            aria-label="다음 설명"
            className="fixed bg-ink/50"
            style={{
              top: hole.top,
              left: hole.left + hole.width,
              right: 0,
              height: hole.height,
            }}
            onClick={onAdvance}
          />
          {/* 하이라이트 영역: 클릭해도 다음으로 가지 않음·원본 인터랙션 차단 */}
          <div
            className="pointer-events-auto fixed rounded-[18px] ring-2 ring-white/90"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              boxShadow: "0 0 0 1px rgba(123,165,253,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
            aria-hidden
          />
        </>
      ) : (
        <button
          type="button"
          aria-label="다음 설명"
          className="fixed inset-0 bg-ink/50"
          onClick={onAdvance}
        />
      )}

      {/* 툴팁 */}
      <div
        className="pointer-events-none fixed z-[101] rounded-[16px] bg-white px-4 py-3 shadow-float"
        style={tooltipStyle}
      >
        <p className="text-[14px] font-extrabold text-sky">{step.title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink">{step.description}</p>
      </div>

      {/* 진행 인디케이터 (클릭 불가) — 하단 네비 유무에 따라 위치 조정 */}
      <div
        className="pointer-events-none fixed inset-x-0 z-[101] flex justify-center gap-1.5"
        style={{
          bottom: document.querySelector(".bottom-nav")
            ? "calc(var(--nav-height) + var(--safe-bottom) + 10px)"
            : "calc(var(--safe-bottom) + 20px)",
        }}
      >
        {Array.from({ length: stepCount }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i === stepIndex ? "bg-sky" : "bg-white/55"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

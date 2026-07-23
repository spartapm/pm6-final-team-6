"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type { FeatureHelpStep } from "@/lib/featureHelp/types";

type Rect = { top: number; left: number; width: number; height: number };

const TOP_GUTTER = 12;
const BOTTOM_GUTTER = 56;
const TOOLTIP_GAP = 12;
const TOOLTIP_EST_HEIGHT = 96;

function measureTarget(targetId: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-help-id="${targetId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function getScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".app-main, .app-main--flush");
}

/** 타깃이 길면 상단을 뷰포트에 맞추고, 툴팁 공간을 확보한다. */
function scrollTargetIntoView(targetId: string, preferTooltipAbove: boolean) {
  const el = document.querySelector<HTMLElement>(`[data-help-id="${targetId}"]`);
  const root = getScrollRoot();
  if (!el || !root) return;

  const rootRect = root.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const available = viewportH - TOP_GUTTER - BOTTOM_GUTTER;

  if (elRect.height <= available * 0.55) {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  // 긴 타깃: 상단을 툴팁 아래(또는 상단 거터)에 맞춤
  const desiredTop = preferTooltipAbove
    ? TOP_GUTTER + TOOLTIP_EST_HEIGHT + TOOLTIP_GAP
    : TOP_GUTTER + 24;
  const delta = elRect.top - rootRect.top - (desiredTop - rootRect.top);
  root.scrollBy({ top: delta, behavior: "smooth" });
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
    const preferAbove = step.placement === "above";
    scrollTargetIntoView(step.targetId, preferAbove || step.placement === "auto");

    const update = () => setRect(measureTarget(step.targetId));
    update();
    const timers = [80, 200, 360, 520, 700].map((ms) => window.setTimeout(update, ms));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.targetId, step.placement]);

  // body만 잠그고 app-main 스크롤은 유지 (긴 하이라이트 대응)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 오버레이 위 휠/터치로 본문 스크롤 전달
  useEffect(() => {
    const root = getScrollRoot();
    if (!root) return;

    const onWheel = (e: WheelEvent) => {
      root.scrollTop += e.deltaY;
      e.preventDefault();
    };

    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      const dy = startY - y;
      startY = y;
      if (Math.abs(dy) < 1) return;
      root.scrollTop += dy;
      e.preventDefault();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hole = (() => {
    if (!rect) return null;
    const viewH = window.innerHeight;
    const rawTop = rect.top - pad;
    const rawBottom = rect.top + rect.height + pad;
    const top = Math.max(TOP_GUTTER, Math.min(rawTop, viewH - BOTTOM_GUTTER - 48));
    const bottom = Math.min(viewH - BOTTOM_GUTTER, Math.max(rawBottom, top + 48));
    return {
      top,
      left: Math.max(0, rect.left - pad),
      width: rect.width + pad * 2,
      height: Math.max(48, bottom - top),
    };
  })();

  const placement = (() => {
    if (step.placement && step.placement !== "auto") return step.placement;
    if (!hole) return "below" as const;
    const spaceAbove = hole.top - TOP_GUTTER;
    const spaceBelow = window.innerHeight - (hole.top + hole.height) - BOTTOM_GUTTER;
    if (spaceAbove >= TOOLTIP_EST_HEIGHT + TOOLTIP_GAP) return "above" as const;
    if (spaceBelow >= TOOLTIP_EST_HEIGHT + TOOLTIP_GAP) return "below" as const;
    return spaceAbove >= spaceBelow ? ("above" as const) : ("below" as const);
  })();

  const tooltipStyle = (() => {
    const maxWidth = Math.min(300, window.innerWidth - 32);
    if (!hole) {
      return { top: "40%", left: "50%", transform: "translate(-50%, -50%)", width: maxWidth } as const;
    }
    const left = Math.min(
      Math.max(16, hole.left + hole.width / 2 - maxWidth / 2),
      window.innerWidth - maxWidth - 16
    );

    if (placement === "above") {
      const bottom = Math.max(
        window.innerHeight - hole.top + TOOLTIP_GAP,
        BOTTOM_GUTTER + 8
      );
      // 상단이 잘리면 top 고정으로 전환
      const estimatedTop = hole.top - TOOLTIP_GAP - TOOLTIP_EST_HEIGHT;
      if (estimatedTop < TOP_GUTTER) {
        return { left, width: maxWidth, top: TOP_GUTTER } as const;
      }
      return { left, width: maxWidth, bottom } as const;
    }

    const top = hole.top + hole.height + TOOLTIP_GAP;
    if (top + TOOLTIP_EST_HEIGHT > window.innerHeight - BOTTOM_GUTTER) {
      return {
        left,
        width: maxWidth,
        bottom: BOTTOM_GUTTER + 8,
      } as const;
    }
    return { left, width: maxWidth, top } as const;
  })();

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="기능설명">
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
              width: Math.max(0, hole.left),
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

      <div
        className="pointer-events-none fixed z-[101] max-h-[40vh] overflow-y-auto rounded-[16px] bg-white px-4 py-3 shadow-float"
        style={tooltipStyle}
      >
        <p className="text-[14px] font-extrabold text-sky">{step.title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink">{step.description}</p>
      </div>

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

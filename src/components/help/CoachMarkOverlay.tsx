"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FeatureHelpStep } from "@/lib/featureHelp/types";

type Rect = { top: number; left: number; width: number; height: number };
type Hole = Rect & { clipped: boolean };

const TOP_GUTTER = 12;
const BOTTOM_GUTTER = 56;
const TOOLTIP_GAP = 10;
const TOOLTIP_EST_HEIGHT = 108;
const SCROLL_HINT = "위아래로 스크롤해 전체 내용을 확인해 주세요.";
const DRAG_THRESHOLD_PX = 8;

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

function safeBottomOffset() {
  const hasNav = Boolean(document.querySelector(".bottom-nav"));
  return hasNav
    ? `calc(var(--nav-height) + var(--safe-bottom) + 10px)`
    : `calc(var(--safe-bottom) + 20px)`;
}

function scrollTargetIntoView(targetId: string) {
  const el = document.querySelector<HTMLElement>(`[data-help-id="${targetId}"]`);
  const root = getScrollRoot();
  if (!el || !root) return;

  const elRect = el.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const available = window.innerHeight - TOP_GUTTER - BOTTOM_GUTTER - TOOLTIP_EST_HEIGHT;

  if (elRect.height <= available * 0.6) {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  const desiredTop = TOP_GUTTER + TOOLTIP_EST_HEIGHT + TOOLTIP_GAP + 8;
  const delta = elRect.top - rootRect.top - (desiredTop - rootRect.top);
  root.scrollBy({ top: delta, behavior: "smooth" });
}

function needsScrollToSeeAll(rect: Rect | null, pad: number) {
  if (!rect) return false;
  const available = window.innerHeight - TOP_GUTTER - BOTTOM_GUTTER;
  return rect.height + pad * 2 > available * 0.72;
}

function buildHole(rect: Rect | null, pad: number, viewH: number, viewW: number): Hole | null {
  if (!rect) return null;
  const rawTop = rect.top - pad;
  const rawBottom = rect.top + rect.height + pad;
  const top = Math.max(TOP_GUTTER, rawTop);
  const bottom = Math.min(viewH - BOTTOM_GUTTER, rawBottom);
  if (bottom <= top) return null;
  return {
    top,
    left: Math.max(0, rect.left - pad),
    width: Math.min(viewW, rect.width + pad * 2),
    height: bottom - top,
    clipped: rawTop < TOP_GUTTER || rawBottom > viewH - BOTTOM_GUTTER,
  };
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
  const [viewport, setViewport] = useState({ w: 360, h: 640 });
  const draggedRef = useRef(false);
  const holeRef = useRef<Hole | null>(null);
  const pad = step.padding ?? 8;
  const showScrollHint = needsScrollToSeeAll(rect, pad);

  const hole = buildHole(rect, pad, viewport.h, viewport.w);
  holeRef.current = hole;

  useLayoutEffect(() => {
    scrollTargetIntoView(step.targetId);

    const update = () => {
      setRect(measureTarget(step.targetId));
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    const timers = [80, 200, 360, 520, 700].map((ms) => window.setTimeout(update, ms));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    const root = getScrollRoot();
    root?.addEventListener("scroll", update, { passive: true });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      root?.removeEventListener("scroll", update);
    };
  }, [step.targetId, step.placement]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 휠/터치 스크롤 → app-main, 하이라이트·말풍선은 scroll 리스너로 갱신
  useEffect(() => {
    const root = getScrollRoot();
    if (!root) return;

    let startY = 0;
    let startX = 0;
    let tracking = false;

    const inHole = (x: number, y: number) => {
      const h = holeRef.current;
      if (!h) return false;
      return x >= h.left && x <= h.left + h.width && y >= h.top && y <= h.top + h.height;
    };

    const onWheel = (e: WheelEvent) => {
      root.scrollTop += e.deltaY;
      setRect(measureTarget(step.targetId));
      e.preventDefault();
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      tracking = true;
      startY = t.clientY;
      startX = t.clientX;
      draggedRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      if (!t) return;
      const dy = startY - t.clientY;
      const dx = t.clientX - startX;
      if (Math.abs(dy) > DRAG_THRESHOLD_PX || Math.abs(dx) > DRAG_THRESHOLD_PX) {
        draggedRef.current = true;
      }
      // 세로 스와이프 → 본문 스크롤 (딤/하이라이트 모두)
      if (Math.abs(dy) >= 1 && Math.abs(dy) >= Math.abs(dx) * 0.6) {
        root.scrollTop += dy;
        startY = t.clientY;
        setRect(measureTarget(step.targetId));
        // 하이라이트 위에서는 기본 제스처 차단해 스크롤만 수행
        if (inHole(t.clientX, t.clientY) || draggedRef.current) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = () => {
      tracking = false;
      // click 합성 이후에 dragged 해제
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 50);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [step.targetId]);

  const placement = (() => {
    if (showScrollHint || hole?.clipped) return "top-safe" as const;
    if (step.placement && step.placement !== "auto") return step.placement;
    if (!hole) return "below" as const;
    const spaceAbove = hole.top - TOP_GUTTER;
    const spaceBelow = viewport.h - (hole.top + hole.height) - BOTTOM_GUTTER;
    if (spaceAbove >= TOOLTIP_EST_HEIGHT + TOOLTIP_GAP) return "above" as const;
    if (spaceBelow >= TOOLTIP_EST_HEIGHT + TOOLTIP_GAP) return "below" as const;
    return spaceAbove >= spaceBelow ? ("above" as const) : ("below" as const);
  })();

  const tooltipStyle = (() => {
    const maxWidth = Math.min(300, viewport.w - 32);
    if (!hole) {
      return {
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: maxWidth,
      } as const;
    }
    const left = Math.min(
      Math.max(16, hole.left + hole.width / 2 - maxWidth / 2),
      viewport.w - maxWidth - 16
    );

    if (placement === "top-safe") {
      return { left, width: maxWidth, top: TOP_GUTTER } as const;
    }

    if (placement === "above") {
      const estimatedTop = hole.top - TOOLTIP_GAP - TOOLTIP_EST_HEIGHT;
      if (estimatedTop < TOP_GUTTER) {
        return { left, width: maxWidth, top: TOP_GUTTER } as const;
      }
      return {
        left,
        width: maxWidth,
        bottom: Math.max(viewport.h - hole.top + TOOLTIP_GAP, BOTTOM_GUTTER + 8),
      } as const;
    }

    const top = hole.top + hole.height + TOOLTIP_GAP;
    if (top + TOOLTIP_EST_HEIGHT > viewport.h - BOTTOM_GUTTER) {
      return { left, width: maxWidth, top: TOP_GUTTER } as const;
    }
    return { left, width: maxWidth, top } as const;
  })();

  const tryAdvance = () => {
    if (draggedRef.current) return;
    onAdvance();
  };

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="기능설명">
      {hole ? (
        <>
          <button
            type="button"
            aria-label="다음 설명"
            className="fixed left-0 right-0 top-0 bg-ink/50"
            style={{ height: hole.top }}
            onClick={tryAdvance}
          />
          <button
            type="button"
            aria-label="다음 설명"
            className="fixed bottom-0 left-0 right-0 bg-ink/50"
            style={{ top: hole.top + hole.height }}
            onClick={tryAdvance}
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
            onClick={tryAdvance}
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
            onClick={tryAdvance}
          />
          <div
            className="pointer-events-auto fixed rounded-[18px] ring-2 ring-white/90"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              boxShadow: "0 0 0 1px rgba(123,165,253,0.35)",
              touchAction: "none",
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
          onClick={tryAdvance}
        />
      )}

      <div
        className="pointer-events-none fixed z-[101] max-h-[min(42vh,240px)] overflow-y-auto rounded-[16px] bg-white px-4 py-3 shadow-float"
        style={tooltipStyle}
      >
        <p className="text-[14px] font-extrabold text-sky">{step.title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink">{step.description}</p>
        {showScrollHint ? (
          <p className="mt-2 text-[12px] font-bold leading-snug text-sky">{SCROLL_HINT}</p>
        ) : null}
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 z-[101] flex justify-center gap-1.5"
        style={{ bottom: safeBottomOffset() }}
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

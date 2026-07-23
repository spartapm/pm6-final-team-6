"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  ONBOARDING_SLIDES,
  completeOnboarding,
  hasCompletedOnboarding,
} from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const touchX = useRef<number | null>(null);
  const last = index >= ONBOARDING_SLIDES.length - 1;

  useEffect(() => {
    if (hasCompletedOnboarding()) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  const finish = useCallback(() => {
    completeOnboarding();
    router.replace("/");
  }, [router]);

  const goNext = useCallback(() => {
    if (last) finish();
    else setIndex((i) => Math.min(i + 1, ONBOARDING_SLIDES.length - 1));
  }, [finish, last]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto flex h-[100svh] max-w-phone items-center justify-center bg-page text-ink-muted">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[100svh] max-w-phone flex-col bg-page">
      <div className="flex shrink-0 items-center justify-end px-4 pb-1 pt-[max(12px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={finish}
          className="px-1 py-2 text-[14px] font-bold text-ink-soft"
        >
          건너뛰기
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 touch-pan-y"
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const endX = e.changedTouches[0]?.clientX ?? touchX.current;
          const dx = endX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) < 48) return;
          if (dx < 0) goNext();
          else goPrev();
        }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {ONBOARDING_SLIDES.map((slide) => (
            <div
              key={slide.id}
              className="flex h-full w-full shrink-0 items-center justify-center px-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.alt}
                className="max-h-full w-full object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <div className="mb-4 flex items-center justify-center gap-1.5" aria-hidden>
          {ONBOARDING_SLIDES.map((slide, i) => (
            <span
              key={slide.id}
              className={
                i === index
                  ? "h-2 w-5 rounded-full bg-sky"
                  : "h-2 w-2 rounded-full bg-[#C9D4E8]"
              }
            />
          ))}
        </div>
        <Button fullWidth size="lg" onClick={goNext}>
          {last ? "시작하기" : "다음"}
        </Button>
      </div>
    </div>
  );
}

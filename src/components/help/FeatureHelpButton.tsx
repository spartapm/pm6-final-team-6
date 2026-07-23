"use client";

import { hasFeatureHelpTour } from "@/lib/featureHelp/tours";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { useFeatureHelp } from "./FeatureHelpContext";

/** 화면 우측 상단 공통 기능설명 버튼 */
export default function FeatureHelpButton({
  tourId,
  className = "",
}: {
  tourId: string;
  className?: string;
}) {
  const { startTour, isActive } = useFeatureHelp();

  if (!hasFeatureHelpTour(tourId)) return null;

  return (
    <button
      type="button"
      aria-label="기능설명"
      disabled={isActive}
      onClick={() => startTour(tourId)}
      className={[
        "flex shrink-0 items-center justify-center transition enabled:active:scale-95 disabled:opacity-40",
        className,
      ].join(" ")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ILLUSTRATIONS.featureHelp}
        alt=""
        width={36}
        height={42}
        className="h-[42px] w-[36px] object-contain"
        draggable={false}
      />
    </button>
  );
}

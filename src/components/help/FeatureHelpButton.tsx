"use client";

import { hasFeatureHelpTour } from "@/lib/featureHelp/tours";
import { useFeatureHelp } from "./FeatureHelpContext";

/** 화면 우측 상단 공통 기능설명(?) 버튼 */
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
        "flex shrink-0 flex-col items-center gap-0.5 text-sky transition enabled:active:scale-95 disabled:opacity-40",
        className,
      ].join(" ")}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-sky bg-white text-[16px] font-extrabold leading-none text-sky shadow-sm">
        ?
      </span>
      <span className="text-[10px] font-bold leading-none text-sky">기능설명</span>
    </button>
  );
}

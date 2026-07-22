"use client";

import { type ReactNode } from "react";
import Button from "./Button";

export default function Modal({
  open,
  title,
  description,
  children,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
  hideCancel,
  /** 제목·본문 중앙 정렬 (설정 확인 모달 등) */
  centered,
  /**
   * confirm: 확인=primary, 취소=outline (기본)
   * cancel: 아니요=primary, 예=outline (설정 모달)
   */
  actionEmphasis = "confirm",
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  hideCancel?: boolean;
  centered?: boolean;
  actionEmphasis?: "confirm" | "cancel";
}) {
  if (!open) return null;

  const cancelPrimary = actionEmphasis === "cancel";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/35 px-6 animate-soft-pop">
      <div className="w-full max-w-[320px] rounded-card bg-white p-5 shadow-float">
        <h3
          className={`text-lg font-extrabold text-ink ${centered ? "text-center" : ""}`}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`mt-2 text-sm leading-relaxed text-ink-soft ${
              centered ? "text-center" : ""
            }`}
          >
            {description}
          </p>
        )}
        {children}
        <div className="mt-5 flex gap-2">
          {!hideCancel && (
            <Button
              variant={cancelPrimary ? "primary" : "outline"}
              size="md"
              className="flex-1"
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={cancelPrimary ? "outline" : "primary"}
            size="md"
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

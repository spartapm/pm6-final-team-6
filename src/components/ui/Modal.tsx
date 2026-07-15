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
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/35 px-6 animate-soft-pop">
      <div className="w-full max-w-[320px] rounded-card bg-white p-5 shadow-float">
        <h3 className="text-lg font-extrabold text-ink">{title}</h3>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
        )}
        {children}
        <div className="mt-5 flex gap-2">
          {!hideCancel && (
            <Button variant="outline" size="md" className="flex-1" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button size="md" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

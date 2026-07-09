"use client";

import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function FieldLabel({
  children,
  required,
  hint,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-sm font-bold text-ink">{children}</span>
      {required && (
        <span className="rounded-chip bg-accent-faint px-2 py-0.5 text-[11px] font-bold text-accent">
          필수
        </span>
      )}
      {hint && (
        <span className="rounded-chip bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-ink-muted">
          {hint}
        </span>
      )}
    </div>
  );
}

export function TextInput({
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        className={[
          "h-12 w-full rounded-field border bg-surface-white px-4 text-[15px] text-ink outline-none transition placeholder:text-ink-muted",
          error ? "border-accent" : "border-line focus:border-accent",
          className,
        ].join(" ")}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-accent">{error}</p>}
    </div>
  );
}

export function TextArea({
  error,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <div>
      <textarea
        className={[
          "min-h-[96px] w-full rounded-field border bg-surface-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-muted",
          error ? "border-accent" : "border-line focus:border-accent",
          className,
        ].join(" ")}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-accent">{error}</p>}
    </div>
  );
}

export function SelectInput({
  error,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <select
        className={[
          "h-12 w-full rounded-field border bg-surface-white px-4 text-[15px] text-ink outline-none transition",
          error ? "border-accent" : "border-line focus:border-accent",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs font-medium text-accent">{error}</p>}
    </div>
  );
}

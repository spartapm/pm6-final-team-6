"use client";

export default function StarRating({
  value,
  onChange,
  size = "md",
  readOnly,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
}) {
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-3xl" : "text-2xl";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          className={`${text} ${star <= value ? "text-accent" : "text-ink-muted/45"} ${
            readOnly ? "cursor-default" : ""
          }`}
          onClick={() => onChange?.(star === value ? 0 : star)}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

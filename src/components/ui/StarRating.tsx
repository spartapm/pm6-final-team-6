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
          className={`${text} ${
            star <= value ? "text-star" : "text-star-empty drop-shadow-[0_0_0.5px_#7CA5FE]"
          } ${readOnly ? "cursor-default" : ""}`}
          style={
            star > value
              ? { WebkitTextStroke: "1px #7CA5FE", color: "#F9FBFE" }
              : undefined
          }
          onClick={() => onChange?.(star === value ? 0 : star)}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

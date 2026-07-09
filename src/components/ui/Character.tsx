export default function Character({
  mood = "smile",
  size = 72,
  className = "",
}: {
  mood?: "smile" | "neutral" | "empty" | "celebrate" | "wave";
  size?: number;
  className?: string;
}) {
  const faces = {
    smile: { eye: "M9 14c.5 1.2 1.6 2 3 2s2.5-.8 3-2", blush: true },
    neutral: { eye: "", blush: false },
    empty: { eye: "", blush: false },
    celebrate: { eye: "M9 14c.5 1.4 1.6 2.2 3 2.2s2.5-.8 3-2.2", blush: true },
    wave: { eye: "M9 14c.5 1.2 1.6 2 3 2s2.5-.8 3-2", blush: true },
  }[mood] ?? { eye: "", blush: false };

  if (mood === "empty") {
    return (
      <div
        className={`rounded-full border border-dashed border-line bg-surface ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="blob" x1="16" y1="8" x2="56" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8DA1" />
          <stop offset="1" stopColor="#FF617D" />
        </linearGradient>
      </defs>
      <ellipse cx="36" cy="40" rx="24" ry="22" fill="url(#blob)" />
      <circle cx="36" cy="28" r="18" fill="#FF8DA1" />
      <circle cx="30" cy="26" r="2.2" fill="#220A0E" />
      <circle cx="42" cy="26" r="2.2" fill="#220A0E" />
      {faces.blush && (
        <>
          <ellipse cx="24" cy="32" rx="3.2" ry="2" fill="#FF617D" opacity="0.45" />
          <ellipse cx="48" cy="32" rx="3.2" ry="2" fill="#FF617D" opacity="0.45" />
        </>
      )}
      {faces.eye ? (
        <path d={faces.eye} stroke="#220A0E" strokeWidth="2" strokeLinecap="round" fill="none" transform="translate(12 8)" />
      ) : (
        <path d="M33 34h6" stroke="#220A0E" strokeWidth="2" strokeLinecap="round" />
      )}
      {mood === "wave" && (
        <path d="M54 24c4-2 7 1 6 5" stroke="#FF617D" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {mood === "celebrate" && (
        <>
          <circle cx="18" cy="14" r="2" fill="#FF617D" />
          <circle cx="54" cy="12" r="1.6" fill="#FF8DA1" />
          <circle cx="58" cy="22" r="1.4" fill="#FF617D" />
        </>
      )}
    </svg>
  );
}

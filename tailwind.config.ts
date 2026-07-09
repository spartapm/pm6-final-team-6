import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#220A0E",
          soft: "#61212D",
          muted: "#B58A94",
        },
        accent: {
          DEFAULT: "#FF617D",
          soft: "#FF8DA1",
          faint: "#FBE3EC",
          disabled: "#F7EEEF",
        },
        surface: {
          DEFAULT: "#FFFAFB",
          soft: "#FBE3EC",
          page: "#F4E8EA",
          white: "#FFFFFF",
        },
        line: {
          DEFAULT: "#FF8DA1",
          soft: "#FBE3EC",
          dashed: "#FF8DA1",
        },
      },
      borderRadius: {
        card: "20px",
        panel: "16px",
        chip: "9999px",
        field: "14px",
      },
      boxShadow: {
        card: "0 10px 28px rgba(34, 10, 14, 0.06)",
        float: "0 12px 32px rgba(255, 97, 125, 0.18)",
        nav: "0 -8px 24px rgba(34, 10, 14, 0.05)",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      maxWidth: {
        phone: "360px",
      },
      spacing: {
        page: "16px",
        nav: "72px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pop": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 97, 125, 0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255, 97, 125, 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "soft-pop": "soft-pop 0.35s ease-out both",
        "pulse-ring": "pulse-ring 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

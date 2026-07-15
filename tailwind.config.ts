import type { Config } from "tailwindcss";

/** 색상 기준: design/tokens.md */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1E2329",
          soft: "#707786",
          muted: "#707786",
        },
        accent: {
          DEFAULT: "#FB89A3",
          soft: "#FB89A3",
          faint: "#FAEEF4",
          disabled: "#F2F5F9",
        },
        sky: {
          DEFAULT: "#7BA5FD",
          soft: "#AFC9F8",
          faint: "#DDEBFF",
          deep: "#7BA5FD",
        },
        surface: {
          DEFAULT: "#F9FBFE",
          soft: "#DDEBFF",
          page: "#DDEBFF",
          card: "#F9FBFE",
          white: "#F9FBFE",
          empty: "#F5F5F5",
        },
        line: {
          DEFAULT: "#7CA5FE",
          soft: "#DDEBFF",
          dashed: "#AFC9F8",
        },
        star: {
          DEFAULT: "#7CA5FE",
          empty: "#F9FBFE",
        },
        btn: {
          disabled: "#F2F5F9",
        },
      },
      borderRadius: {
        card: "24px",
        panel: "18px",
        chip: "9999px",
        field: "16px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(30, 35, 41, 0.06)",
        float: "0 10px 28px rgba(123, 165, 253, 0.22)",
        nav: "0 -6px 20px rgba(30, 35, 41, 0.04)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(251, 137, 163, 0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(251, 137, 163, 0)" },
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

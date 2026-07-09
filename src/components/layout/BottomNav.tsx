"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDerivations } from "@/lib/useAppState";

const tabs = [
  {
    href: "/",
    key: "home",
    label: "홈",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
          stroke={active ? "#FF617D" : "#B58A94"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/care-log",
    key: "care",
    label: "케어로그",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="5"
          y="3"
          width="14"
          height="18"
          rx="2"
          stroke={active ? "#FF617D" : "#B58A94"}
          strokeWidth="1.8"
        />
        <path
          d="M8 8h8M8 12h8M8 16h5"
          stroke={active ? "#FF617D" : "#B58A94"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/drawer",
    key: "drawer",
    label: "스킨서랍장",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 6h14v4H5V6zm0 6h14v6H5v-6z"
          stroke={active ? "#FF617D" : "#B58A94"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="8" r="1" fill={active ? "#FF617D" : "#B58A94"} />
        <circle cx="8.5" cy="15" r="1" fill={active ? "#FF617D" : "#B58A94"} />
      </svg>
    ),
  },
  {
    href: "/mypage",
    key: "mypage",
    label: "마이페이지",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="8"
          r="3.2"
          stroke={active ? "#FF617D" : "#B58A94"}
          strokeWidth="1.8"
        />
        <path
          d="M5 19c1.8-3.2 4.2-4.8 7-4.8S17.2 15.8 19 19"
          stroke={active ? "#FF617D" : "#B58A94"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function isActive(pathname: string, key: string) {
  if (key === "home") return pathname === "/";
  if (key === "care") return pathname.startsWith("/care-log");
  if (key === "drawer") return pathname.startsWith("/drawer") || pathname.startsWith("/notes");
  if (key === "mypage") return pathname.startsWith("/mypage");
  return false;
}

export default function BottomNav() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { state } = useAppDerivations();

  return (
    <nav className="bottom-nav fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-phone items-start justify-around border-t border-line/40 bg-surface-white pt-2 shadow-nav">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.key);
        return (
          <button
            key={tab.key}
            type="button"
            className="flex min-w-[72px] flex-col items-center gap-1 px-2 py-1"
            onClick={() => {
              if (tab.key === "care" && !state.isLoggedIn) {
                router.push("/login?next=/care-log");
                return;
              }
              if (tab.key === "mypage" && !state.isLoggedIn) {
                router.push("/login?next=/mypage");
                return;
              }
              router.push(tab.href);
            }}
          >
            {tab.icon(active)}
            <span
              className={`text-[11px] font-bold ${active ? "text-accent" : "text-ink-muted"}`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function NavLinkFallback() {
  return (
    <Link href="/" className="sr-only">
      home
    </Link>
  );
}

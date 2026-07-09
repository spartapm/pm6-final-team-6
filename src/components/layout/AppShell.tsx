"use client";

import { type ReactNode } from "react";
import BottomNav from "./BottomNav";
import Toast from "@/components/ui/Toast";

export default function AppShell({
  children,
  showNav = true,
}: {
  children: ReactNode;
  showNav?: boolean;
}) {
  return (
    <div className="app-frame">
      <main className={showNav ? "app-main" : "app-main--flush"}>{children}</main>
      {showNav && <BottomNav />}
      <Toast />
    </div>
  );
}

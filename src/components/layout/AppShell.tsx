"use client";

import { type ReactNode, useEffect } from "react";
import BottomNav from "./BottomNav";
import { FeatureHelpProvider } from "@/components/help/FeatureHelpContext";
import Toast from "@/components/ui/Toast";
import { trackActiveRoutineUser } from "@/lib/analytics";
import { useAppDerivations } from "@/lib/useAppState";

/** Fires active_routine_users once/day when a user with an active routine is confirmed. */
function ActiveRoutineUsersBeacon() {
  const { state, activeRoutine } = useAppDerivations();

  useEffect(() => {
    if (!state.isLoggedIn || !state.currentUserId || !activeRoutine) return;
    trackActiveRoutineUser(state.currentUserId);
  }, [state.isLoggedIn, state.currentUserId, activeRoutine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export default function AppShell({
  children,
  showNav = true,
}: {
  children: ReactNode;
  showNav?: boolean;
}) {
  return (
    <FeatureHelpProvider>
      <div className={`app-frame ${showNav ? "app-frame--nav" : ""}`}>
        <ActiveRoutineUsersBeacon />
        <main className={showNav ? "app-main" : "app-main--flush"}>{children}</main>
        {showNav && <BottomNav />}
        <Toast />
      </div>
    </FeatureHelpProvider>
  );
}

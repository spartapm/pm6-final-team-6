"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  defaultState,
  getActiveRoutine,
  getCurrentProfile,
  getCurrentUser,
  getHonorNotes,
  getMyNotes,
  getPublicNotes,
  loadState,
  syncAuthState,
} from "./store";
import { supabase } from "./supabase";
import type { AppState } from "./types";

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("ana-state-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("ana-state-change", handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot() {
  return loadState();
}

function getServerSnapshot() {
  return defaultState;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let mounted = true;
    void syncAuthState().finally(() => {
      if (mounted) setHydrated(true);
    });
    const { data } = supabase.auth.onAuthStateChange(() => {
      void syncAuthState();
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return hydrated;
}

export function useAppDerivations() {
  const state = useAppState();
  const user = getCurrentUser(state);
  const profile = getCurrentProfile(state);
  const activeRoutine = getActiveRoutine(state);
  const myNotes = getMyNotes(state);
  const publicNotes = getPublicNotes(state);
  const honor = getHonorNotes(state);
  return { state, user, profile, activeRoutine, myNotes, publicNotes, honor };
}

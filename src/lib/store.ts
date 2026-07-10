"use client";

import {
  daysSince,
  todayKey,
  uid,
  weekKey,
} from "./constants";
import {
  deleteSkinNote,
  fetchPublicNotes,
  fetchUserBundle,
  hideNoteDb,
  insertComment,
  insertRoutine,
  insertSkinNote,
  newUuid,
  removeComment,
  reportNoteDb,
  toggleCommentLikeDb,
  toggleHelp,
  toggleSave,
  updateRoutineStatus,
  upsertDailyLog,
  upsertPrefs,
  upsertProfile,
  upsertSkinProfile,
  upsertWeeklyChange,
} from "./db";
import { supabase } from "./supabase";
import type {
  AppState,
  Comment,
  Difficulty,
  EndReason,
  Product,
  Routine,
  RoutineStep,
  SkinNote,
  SkinProfile,
  UserAccount,
  WeeklyChange,
} from "./types";

const KEY = "ana-skin-state-v3";

/** useSyncExternalStore용 캐시 — getSnapshot은 동일 참조를 반환해야 함 */
let memoryState: AppState | null = null;
let hydratedFromStorage = false;

export const defaultState: AppState = {
  isLoggedIn: false,
  autoLogin: false,
  currentUserId: null,
  selectedRoutineId: null,
  accounts: [],
  profiles: {},
  routines: [],
  dailyLogs: [],
  weeklyChanges: [],
  skinNotes: [],
  comments: [],
  savedNoteIds: [],
  helpedNoteIds: [],
  likedCommentIds: [],
  hiddenNoteIds: [],
  viewedNoteIds: [],
  reportedNoteIds: [],
  bannerDismissed: { drawer: false, detail: false },
  viewQuota: { date: todayKey(), count: 0 },
  pendingEnd: null,
  resetTokens: {},
  toast: null,
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeState(parsed: Partial<AppState>): AppState {
  return {
    ...defaultState,
    ...parsed,
    likedCommentIds: parsed.likedCommentIds ?? [],
    reportedNoteIds: parsed.reportedNoteIds ?? [],
    selectedRoutineId: parsed.selectedRoutineId ?? null,
    bannerDismissed: {
      ...defaultState.bannerDismissed,
      ...(parsed.bannerDismissed ?? {}),
    },
    routines: (parsed.routines ?? []).map((r) => ({
      ...r,
      userId:
        r.userId ||
        (typeof r.id === "string" && r.id.startsWith("routine_")
          ? r.id.split("_")[1]
          : ""),
    })),
    toast: parsed.toast ?? null,
  };
}

export function loadState(): AppState {
  if (memoryState) return memoryState;
  if (!canUseStorage()) {
    memoryState = { ...defaultState };
    return memoryState;
  }
  if (!hydratedFromStorage) {
    hydratedFromStorage = true;
    try {
      const raw = window.localStorage.getItem(KEY);
      memoryState = raw
        ? normalizeState(JSON.parse(raw) as Partial<AppState>)
        : { ...defaultState, toast: null };
    } catch {
      memoryState = { ...defaultState, toast: null };
    }
  }
  if (!memoryState) memoryState = { ...defaultState, toast: null };
  return memoryState;
}

export function saveState(next: AppState) {
  memoryState = next;
  if (canUseStorage()) {
    const { toast: _toast, ...persistable } = next;
    window.localStorage.setItem(KEY, JSON.stringify(persistable));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ana-state-change", { detail: next }));
  }
}

export function updateState(updater: (state: AppState) => AppState) {
  const next = updater(loadState());
  saveState(next);
  return next;
}

export function showToast(message: string) {
  updateState((s) => (s.toast === message ? s : { ...s, toast: message }));
  window.setTimeout(() => {
    updateState((s) => (s.toast === message ? { ...s, toast: null } : s));
  }, 2200);
}

export function getCurrentUser(state: AppState) {
  if (!state.currentUserId) return null;
  return state.accounts.find((a) => a.id === state.currentUserId) ?? null;
}

export function getCurrentProfile(state: AppState) {
  if (!state.currentUserId) return null;
  return state.profiles[state.currentUserId] ?? null;
}

export function getMyActiveRoutines(state: AppState) {
  if (!state.currentUserId) return [];
  return state.routines.filter(
    (r) => r.status === "active" && r.userId === state.currentUserId
  );
}

export function getActiveRoutine(state: AppState) {
  const mine = getMyActiveRoutines(state);
  if (mine.length === 0) return null;
  if (state.selectedRoutineId) {
    const selected = mine.find((r) => r.id === state.selectedRoutineId);
    if (selected) return selected;
  }
  return mine[0];
}

export function getMyNotes(state: AppState) {
  if (!state.currentUserId) return [];
  return state.skinNotes.filter((n) => n.authorId === state.currentUserId);
}

export function getPublicNotes(state: AppState) {
  return state.skinNotes.filter(
    (n) =>
      n.visibility === "public" &&
      !n.isAbandoned &&
      !state.hiddenNoteIds.includes(n.id)
  );
}

export function getHonorNotes(state: AppState) {
  const publicNotes = getPublicNotes(state);
  const bySave = [...publicNotes].sort((a, b) => b.saveCount - a.saveCount)[0] ?? null;
  const byComment =
    [...publicNotes].sort((a, b) => b.commentCount - a.commentCount)[0] ?? null;
  const byHelp = [...publicNotes].sort((a, b) => b.helpCount - a.helpCount)[0] ?? null;
  return { bySave, byComment, byHelp };
}

export async function syncAuthState() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) {
      let publicNotes: SkinNote[] = [];
      try {
        publicNotes = await fetchPublicNotes();
      } catch {
        publicNotes = [];
      }
      return updateState((s) => ({
        ...s,
        isLoggedIn: false,
        currentUserId: null,
        selectedRoutineId: null,
        skinNotes: publicNotes,
        comments: [],
      }));
    }

    const userId = session.user.id;
    let bundle: Awaited<ReturnType<typeof fetchUserBundle>>;
    try {
      bundle = await fetchUserBundle(userId);
    } catch {
      return updateState((s) => ({
        ...s,
        isLoggedIn: true,
        currentUserId: userId,
        autoLogin: true,
      }));
    }

    const account =
      bundle.account ??
      ({
        id: userId,
        email: session.user.email ?? "",
        password: "",
        nickname:
          session.user.user_metadata?.nickname ??
          session.user.email?.split("@")[0] ??
          "ANA유저",
        ageGroup:
          (session.user.user_metadata?.age_group as UserAccount["ageGroup"]) ?? "20대",
        gender: (session.user.user_metadata?.gender as UserAccount["gender"]) ?? null,
        createdAt: new Date().toISOString(),
      } satisfies UserAccount);

    if (!bundle.account) {
      try {
        await upsertProfile(account);
      } catch {
        // schema may not be applied yet
      }
    }

    return updateState((s) => ({
      ...s,
      isLoggedIn: true,
      currentUserId: userId,
      autoLogin: true,
      accounts: [account, ...s.accounts.filter((a) => a.id !== userId)],
      profiles: bundle.skinProfile
        ? { ...s.profiles, [userId]: bundle.skinProfile }
        : s.profiles,
      routines: bundle.routines,
      dailyLogs: bundle.dailyLogs,
      weeklyChanges: bundle.weeklyChanges,
      skinNotes: bundle.skinNotes,
      comments: bundle.comments,
      savedNoteIds: bundle.savedNoteIds,
      helpedNoteIds: bundle.helpedNoteIds,
      likedCommentIds: bundle.likedCommentIds,
      hiddenNoteIds: bundle.hiddenNoteIds,
      reportedNoteIds: bundle.reportedNoteIds,
      selectedRoutineId: bundle.prefs?.selectedRoutineId ?? s.selectedRoutineId,
      bannerDismissed: bundle.prefs?.bannerDismissed ?? s.bannerDismissed,
      viewQuota: bundle.prefs?.viewQuota?.date ? bundle.prefs.viewQuota : s.viewQuota,
    }));
  } catch (error) {
    console.error("[ANA] syncAuthState failed", error);
    return loadState();
  }
}

export async function signup(input: {
  nickname: string;
  email: string;
  password: string;
  ageGroup: UserAccount["ageGroup"];
  gender: UserAccount["gender"];
}) {
  const { data: nickRows } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("nickname", input.nickname)
    .maybeSingle();
  if (nickRows) return { ok: false as const, message: "이미 사용 중인 닉네임입니다." };

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        nickname: input.nickname,
        age_group: input.ageGroup,
        gender: input.gender,
      },
    },
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { ok: false as const, message: "이미 가입된 이메일입니다." };
    }
    return { ok: false as const, message: error.message };
  }
  if (!data.user) return { ok: false as const, message: "회원가입에 실패했습니다." };

  if (!data.session) {
    return {
      ok: true as const,
      needsEmailConfirmation: true as const,
      user: null,
      message: "이메일 인증 후 로그인해주세요.",
    };
  }

  const account: UserAccount = {
    id: data.user.id,
    email: input.email,
    password: "",
    nickname: input.nickname,
    ageGroup: input.ageGroup,
    gender: input.gender,
    createdAt: new Date().toISOString(),
  };
  const profileError = await upsertProfile(account);
  if (profileError) {
    return { ok: false as const, message: profileError.message };
  }

  updateState((s) => ({
    ...s,
    accounts: [account, ...s.accounts.filter((a) => a.id !== account.id)],
    isLoggedIn: true,
    currentUserId: account.id,
    autoLogin: true,
  }));
  await syncAuthState();
  return { ok: true as const, user: account };
}

export async function login(email: string, password: string, autoLogin: boolean) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false as const, message: "이메일 또는 비밀번호가 일치하지 않습니다." };
  }
  updateState((s) => ({ ...s, autoLogin }));
  const state = await syncAuthState();
  const user = getCurrentUser(state);
  return { ok: true as const, user };
}

export async function logout() {
  await supabase.auth.signOut();
  const publicNotes = await fetchPublicNotes().catch(() => [] as SkinNote[]);
  updateState(() => ({
    ...defaultState,
    skinNotes: publicNotes,
    comments: [],
  }));
}

export async function saveSkinProfile(profile: SkinProfile) {
  const state = loadState();
  if (!state.currentUserId) return;
  updateState((s) => ({
    ...s,
    profiles: { ...s.profiles, [s.currentUserId!]: profile },
  }));
  await upsertSkinProfile(state.currentUserId, profile);
}

export async function createRoutine(input: {
  title: string;
  concernLabel: string;
  steps: Array<{ category: RoutineStep["category"]; product: Product }>;
  source: Routine["source"];
}) {
  const state = loadState();
  if (!state.currentUserId) return null;
  const routine: Routine = {
    id: newUuid(),
    userId: state.currentUserId,
    title: input.title,
    concernLabel: input.concernLabel,
    source: input.source,
    startedAt: new Date().toISOString(),
    status: "active",
    steps: input.steps.map((step, index) => ({
      id: newUuid(),
      category: step.category,
      product: step.product,
      order: index + 1,
    })),
  };
  updateState((s) => ({
    ...s,
    selectedRoutineId: routine.id,
    routines: [...s.routines, routine],
  }));
  await insertRoutine(routine);
  await upsertPrefs(state.currentUserId, {
    selectedRoutineId: routine.id,
    bannerDrawer: state.bannerDismissed.drawer,
    bannerDetail: state.bannerDismissed.detail,
    viewQuotaDate: state.viewQuota.date,
    viewQuotaCount: state.viewQuota.count,
  });
  return routine;
}

export async function saveDailyLog(routineId: string, completedStepIds: string[]) {
  const date = todayKey();
  const state = loadState();
  if (!state.currentUserId) return;
  const log = {
    date,
    routineId,
    completedStepIds,
    savedAt: new Date().toISOString(),
  };
  updateState((s) => {
    const others = s.dailyLogs.filter((l) => !(l.date === date && l.routineId === routineId));
    return { ...s, dailyLogs: [...others, log] };
  });
  await upsertDailyLog(state.currentUserId, log);
  showToast("오늘의 케어로그가 저장되었어요.");
}

export async function saveWeeklyChange(input: Omit<WeeklyChange, "id" | "createdAt" | "weekKey">) {
  const state = loadState();
  if (!state.currentUserId) return null;
  const change: WeeklyChange = {
    ...input,
    id: newUuid(),
    weekKey: weekKey(),
    createdAt: new Date().toISOString(),
  };
  updateState((s) => ({
    ...s,
    weeklyChanges: [
      ...s.weeklyChanges.filter(
        (w) => !(w.routineId === change.routineId && w.weekKey === change.weekKey)
      ),
      change,
    ],
  }));
  await upsertWeeklyChange(state.currentUserId, change);
  showToast("이번 주 변화 과정이 저장되었어요.");
  return change;
}

export function setPendingEnd(pending: AppState["pendingEnd"]) {
  updateState((s) => ({ ...s, pendingEnd: pending }));
}

export async function finishRoutine(input: {
  reason: EndReason;
  difficulty: Difficulty;
  tags: string[];
  feltChange: number;
  visibility: "private" | "public";
}) {
  const state = loadState();
  const user = getCurrentUser(state);
  const profile = getCurrentProfile(state);
  const routine = getActiveRoutine(state);
  if (!user || !profile || !routine) return null;

  const durationDays = daysSince(routine.startedAt);
  const isAbandoned = input.reason === "지속하기 어려워서 그만할래요";
  const visibility = isAbandoned ? "private" : input.visibility;
  const weekly = state.weeklyChanges
    .filter((w) => w.routineId === routine.id)
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  const note: SkinNote = {
    id: newUuid(),
    authorId: user.id,
    authorNickname: user.nickname,
    authorAvatar: user.avatarUrl,
    skinType: profile.skinType,
    concerns: profile.concerns,
    sensitivity: profile.sensitivity,
    ageGroup: user.ageGroup,
    title: `${durationDays}일 사용 후기`,
    tags: input.tags,
    products: routine.steps.map((s) => s.product),
    durationDays,
    difficulty: input.difficulty,
    feltChange: input.feltChange,
    endReason: input.reason,
    changeTimeline:
      weekly.length > 0
        ? weekly.map((w, i) => ({
            label: `${(i + 1) * 7}일차`,
            photoUrl: w.photoUrl,
            feeling: w.feeling,
          }))
        : [{ label: `${durationDays}일차`, feeling: "변화가 있었어요" }],
    visibility,
    isAbandoned,
    createdAt: new Date().toISOString(),
    saveCount: 0,
    helpCount: 0,
    commentCount: 0,
  };

  updateState((s) => ({
    ...s,
    routines: s.routines.map((r) =>
      r.id === routine.id ? { ...r, status: "ended" as const } : r
    ),
    selectedRoutineId: null,
    skinNotes: [note, ...s.skinNotes],
    pendingEnd: null,
  }));

  await updateRoutineStatus(routine.id, "ended");
  await insertSkinNote(note);
  await upsertPrefs(user.id, {
    selectedRoutineId: null,
    bannerDrawer: state.bannerDismissed.drawer,
    bannerDetail: state.bannerDismissed.detail,
    viewQuotaDate: state.viewQuota.date,
    viewQuotaCount: state.viewQuota.count,
  });

  return note;
}

export async function toggleSaveNote(noteId: string) {
  const state = loadState();
  if (!state.currentUserId) return;
  const saved = state.savedNoteIds.includes(noteId);
  updateState((s) => ({
    ...s,
    savedNoteIds: saved
      ? s.savedNoteIds.filter((id) => id !== noteId)
      : [...s.savedNoteIds, noteId],
    skinNotes: s.skinNotes.map((n) =>
      n.id === noteId ? { ...n, saveCount: Math.max(0, n.saveCount + (saved ? -1 : 1)) } : n
    ),
  }));
  await toggleSave(state.currentUserId, noteId, saved);
}

export async function toggleHelpNote(noteId: string) {
  const state = loadState();
  if (!state.currentUserId) return;
  const helped = state.helpedNoteIds.includes(noteId);
  updateState((s) => ({
    ...s,
    helpedNoteIds: helped
      ? s.helpedNoteIds.filter((id) => id !== noteId)
      : [...s.helpedNoteIds, noteId],
    skinNotes: s.skinNotes.map((n) =>
      n.id === noteId ? { ...n, helpCount: Math.max(0, n.helpCount + (helped ? -1 : 1)) } : n
    ),
  }));
  await toggleHelp(state.currentUserId, noteId, helped);
}

export async function addComment(noteId: string, content: string) {
  const state = loadState();
  const user = getCurrentUser(state);
  if (!user) return;
  const comment: Comment = {
    id: newUuid(),
    noteId,
    authorId: user.id,
    authorNickname: user.nickname,
    authorAvatar: user.avatarUrl,
    content,
    createdAt: new Date().toISOString(),
    likeCount: 0,
  };
  updateState((s) => ({
    ...s,
    comments: [comment, ...s.comments],
    skinNotes: s.skinNotes.map((n) =>
      n.id === noteId ? { ...n, commentCount: n.commentCount + 1 } : n
    ),
  }));
  await insertComment(comment);
}

export async function deleteComment(commentId: string) {
  const state = loadState();
  const target = state.comments.find((c) => c.id === commentId);
  if (!target) return;
  updateState((s) => ({
    ...s,
    comments: s.comments.filter((c) => c.id !== commentId),
    skinNotes: s.skinNotes.map((n) =>
      n.id === target.noteId
        ? { ...n, commentCount: Math.max(0, n.commentCount - 1) }
        : n
    ),
  }));
  await removeComment(commentId, target.noteId);
}

export async function deleteNote(noteId: string) {
  updateState((s) => ({
    ...s,
    skinNotes: s.skinNotes.filter((n) => n.id !== noteId),
    comments: s.comments.filter((c) => c.noteId !== noteId),
  }));
  await deleteSkinNote(noteId);
}

export async function hideNote(noteId: string) {
  const state = loadState();
  if (!state.currentUserId) return;
  updateState((s) => ({
    ...s,
    hiddenNoteIds: s.hiddenNoteIds.includes(noteId)
      ? s.hiddenNoteIds
      : [...s.hiddenNoteIds, noteId],
  }));
  await hideNoteDb(state.currentUserId, noteId);
}

export async function toggleCommentLike(commentId: string) {
  const state = loadState();
  if (!state.currentUserId) return;
  const liked = state.likedCommentIds.includes(commentId);
  updateState((s) => ({
    ...s,
    likedCommentIds: liked
      ? s.likedCommentIds.filter((id) => id !== commentId)
      : [...s.likedCommentIds, commentId],
    comments: s.comments.map((c) =>
      c.id === commentId
        ? { ...c, likeCount: Math.max(0, c.likeCount + (liked ? -1 : 1)), likedByMe: !liked }
        : c
    ),
  }));
  await toggleCommentLikeDb(state.currentUserId, commentId, liked);
}

export function markNoteViewed(noteId: string) {
  updateState((s) => ({
    ...s,
    viewedNoteIds: s.viewedNoteIds.includes(noteId)
      ? s.viewedNoteIds
      : [...s.viewedNoteIds, noteId],
  }));
}

export async function reportNote(noteId: string) {
  const state = loadState();
  if (!state.currentUserId) return;
  updateState((s) => ({
    ...s,
    reportedNoteIds: s.reportedNoteIds.includes(noteId)
      ? s.reportedNoteIds
      : [...s.reportedNoteIds, noteId],
  }));
  await reportNoteDb(state.currentUserId, noteId);
  showToast("신고가 접수되었어요.");
}

export async function requestResetCode(email: string) {
  try {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      return {
        ok: false as const,
        message: data.message || "가입되지 않은 이메일입니다.",
      };
    }
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      message: "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

export async function verifyResetCode(email: string, code: string) {
  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: code }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      message?: string;
      resetToken?: string;
    };
    if (!res.ok || !data.ok || !data.resetToken) {
      return {
        ok: false as const,
        message: data.message || "인증번호가 일치하지 않습니다.",
      };
    }
    updateState((s) => ({
      ...s,
      resetTokens: {
        ...s.resetTokens,
        [email]: {
          code: data.resetToken!,
          expiresAt: Date.now() + 15 * 60 * 1000,
        },
      },
    }));
    return { ok: true as const, resetToken: data.resetToken };
  } catch {
    return { ok: false as const, message: "인증 확인에 실패했습니다." };
  }
}

export async function resetPassword(email: string, password: string) {
  const state = loadState();
  const token = state.resetTokens[email];
  if (!token?.code || Date.now() > token.expiresAt) {
    return {
      ok: false as const,
      message: "인증이 만료되었습니다. 다시 시도해주세요.",
    };
  }

  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        resetToken: token.code,
        password,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      return {
        ok: false as const,
        message: data.message || "비밀번호 변경에 실패했습니다. 다시 시도해주세요.",
      };
    }
    updateState((s) => ({
      ...s,
      resetTokens: Object.fromEntries(
        Object.entries(s.resetTokens).filter(([key]) => key !== email)
      ),
    }));
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      message: "비밀번호 변경에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

export async function updateAvatar(dataUrl: string) {
  const state = loadState();
  if (!state.currentUserId) return;
  const user = getCurrentUser(state);
  if (!user) return;
  const next = { ...user, avatarUrl: dataUrl };
  updateState((s) => ({
    ...s,
    accounts: s.accounts.map((a) => (a.id === s.currentUserId ? next : a)),
  }));
  await upsertProfile(next);
}

/** 런칭 1개월간 스킨노트 열람 제한 미적용 */
export function canViewNoteDetail(_state: AppState) {
  return { allowed: true as const, unlimited: true as const, limit: Infinity, used: 0 };
}

export async function consumeViewQuota() {
  const state = loadState();
  const today = todayKey();
  const count = state.viewQuota.date === today ? state.viewQuota.count + 1 : 1;
  updateState((s) => ({ ...s, viewQuota: { date: today, count } }));
  if (state.currentUserId) {
    await upsertPrefs(state.currentUserId, {
      selectedRoutineId: state.selectedRoutineId,
      bannerDrawer: state.bannerDismissed.drawer,
      bannerDetail: state.bannerDismissed.detail,
      viewQuotaDate: today,
      viewQuotaCount: count,
    });
  }
}

export async function dismissBanner(key: "drawer" | "detail") {
  const state = loadState();
  // 서랍장/상세 안내 배너는 함께 닫힘 처리
  const next = {
    drawer: true,
    detail: true,
    [key]: true,
  };
  updateState((s) => ({
    ...s,
    bannerDismissed: next,
  }));
  if (state.currentUserId) {
    await upsertPrefs(state.currentUserId, {
      selectedRoutineId: state.selectedRoutineId,
      bannerDrawer: next.drawer,
      bannerDetail: next.detail,
      viewQuotaDate: state.viewQuota.date,
      viewQuotaCount: state.viewQuota.count,
    });
  }
}

export async function selectRoutine(routineId: string) {
  const state = loadState();
  updateState((s) => ({ ...s, selectedRoutineId: routineId }));
  if (state.currentUserId) {
    await upsertPrefs(state.currentUserId, {
      selectedRoutineId: routineId,
      bannerDrawer: state.bannerDismissed.drawer,
      bannerDetail: state.bannerDismissed.detail,
      viewQuotaDate: state.viewQuota.date,
      viewQuotaCount: state.viewQuota.count,
    });
  }
}


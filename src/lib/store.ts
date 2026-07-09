"use client";

import {
  RECOMMEND_ROUTINES,
  SAMPLE_PRODUCTS,
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

const KEY = "ana-skin-state-v2";

const seedNotes: SkinNote[] = [
  {
    id: "note_seed_1",
    authorId: "seed_user_1",
    authorNickname: "피부기록러",
    skinType: "복합성",
    concerns: ["민감/붉음증", "여드름/트러블"],
    sensitivity: "높음",
    ageGroup: "20대",
    title: "14일 사용 후기",
    tags: ["#붉은기 완화", "#피부결 개선", "#수분 충전"],
    products: [
      SAMPLE_PRODUCTS[0],
      SAMPLE_PRODUCTS[1],
      SAMPLE_PRODUCTS[2],
      SAMPLE_PRODUCTS[3],
    ],
    durationDays: 14,
    difficulty: "보통이에요",
    feltChange: 4,
    endReason: "변화가 느껴져서 마칠래요",
    changeTimeline: [
      { label: "사용 전", feeling: "변화가 없었어요" },
      { label: "7일차", feeling: "모르겠어요" },
      { label: "14일차", feeling: "변화가 있었어요" },
    ],
    visibility: "public",
    isAbandoned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    saveCount: 42,
    helpCount: 28,
    commentCount: 12,
  },
  {
    id: "note_seed_2",
    authorId: "seed_user_2",
    authorNickname: "수분요정",
    skinType: "건성",
    concerns: ["보습/건조함"],
    sensitivity: "보통",
    ageGroup: "30대",
    title: "21일 사용 후기",
    tags: ["#보습 강화", "#피부결 개선"],
    products: [SAMPLE_PRODUCTS[8], SAMPLE_PRODUCTS[4], SAMPLE_PRODUCTS[10]],
    durationDays: 21,
    difficulty: "쉬웠어요",
    feltChange: 5,
    endReason: "변화가 느껴져서 마칠래요",
    changeTimeline: [
      { label: "사용 전", feeling: "변화가 없었어요" },
      { label: "7일차", feeling: "변화가 있었어요" },
      { label: "14일차", feeling: "변화가 있었어요" },
    ],
    visibility: "public",
    isAbandoned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    saveCount: 61,
    helpCount: 19,
    commentCount: 8,
  },
  {
    id: "note_seed_3",
    authorId: "seed_user_3",
    authorNickname: "모공케어중",
    skinType: "지성",
    concerns: ["모공/피지"],
    sensitivity: "낮음",
    ageGroup: "20대",
    title: "10일 사용 후기",
    tags: ["#모공 케어", "#피지 조절"],
    products: [SAMPLE_PRODUCTS[7], SAMPLE_PRODUCTS[9], SAMPLE_PRODUCTS[3]],
    durationDays: 10,
    difficulty: "어려웠어요",
    feltChange: 3,
    endReason: "변화는 없지만 기록을 마칠래요",
    changeTimeline: [
      { label: "사용 전", feeling: "변화가 없었어요" },
      { label: "7일차", feeling: "모르겠어요" },
    ],
    visibility: "public",
    isAbandoned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    saveCount: 18,
    helpCount: 33,
    commentCount: 5,
  },
];

const seedComments: Comment[] = [
  {
    id: "c1",
    noteId: "note_seed_1",
    authorId: "seed_user_2",
    authorNickname: "수분요정",
    content: "저도 비슷한 루틴으로 붉은기가 줄었어요!",
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    likeCount: 4,
  },
  {
    id: "c2",
    noteId: "note_seed_1",
    authorId: "seed_user_3",
    authorNickname: "모공케어중",
    content: "제품 구성이 참고가 많이 됐어요 감사합니다.",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    likeCount: 2,
  },
];

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
  skinNotes: seedNotes,
  comments: seedComments,
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

export function loadState(): AppState {
  if (!canUseStorage()) return defaultState;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
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
      toast: null,
    };
  } catch {
    return defaultState;
  }
}

export function saveState(next: AppState) {
  if (!canUseStorage()) return;
  const { toast: _toast, ...persistable } = next;
  window.localStorage.setItem(KEY, JSON.stringify(persistable));
  window.dispatchEvent(new CustomEvent("ana-state-change", { detail: next }));
}

export function updateState(updater: (state: AppState) => AppState) {
  const next = updater(loadState());
  saveState(next);
  return next;
}

export function showToast(message: string) {
  updateState((s) => ({ ...s, toast: message }));
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
    (n) => n.visibility === "public" && !state.hiddenNoteIds.includes(n.id)
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
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.user) {
    const publicNotes = await fetchPublicNotes();
    return updateState((s) => ({
      ...s,
      isLoggedIn: false,
      currentUserId: null,
      selectedRoutineId: null,
      skinNotes: publicNotes.length ? publicNotes : s.skinNotes,
    }));
  }

  const userId = session.user.id;
  const bundle = await fetchUserBundle(userId);
  const account =
    bundle.account ??
    ({
      id: userId,
      email: session.user.email ?? "",
      password: "",
      nickname: session.user.user_metadata?.nickname ?? session.user.email?.split("@")[0] ?? "ANA유저",
      ageGroup: (session.user.user_metadata?.age_group as UserAccount["ageGroup"]) ?? "20대",
      gender: (session.user.user_metadata?.gender as UserAccount["gender"]) ?? null,
      createdAt: new Date().toISOString(),
    } satisfies UserAccount);

  if (!bundle.account) {
    await upsertProfile(account);
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
    skinNotes: bundle.skinNotes.length ? bundle.skinNotes : s.skinNotes,
    comments: bundle.comments.length ? bundle.comments : s.comments,
    savedNoteIds: bundle.savedNoteIds,
    helpedNoteIds: bundle.helpedNoteIds,
    likedCommentIds: bundle.likedCommentIds,
    hiddenNoteIds: bundle.hiddenNoteIds,
    reportedNoteIds: bundle.reportedNoteIds,
    selectedRoutineId: bundle.prefs?.selectedRoutineId ?? s.selectedRoutineId,
    bannerDismissed: bundle.prefs?.bannerDismissed ?? s.bannerDismissed,
    viewQuota:
      bundle.prefs?.viewQuota?.date
        ? bundle.prefs.viewQuota
        : s.viewQuota,
  }));
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
  const publicNotes = await fetchPublicNotes();
  updateState((s) => ({
    ...defaultState,
    skinNotes: publicNotes.length ? publicNotes : seedNotes,
    comments: seedComments,
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

export function buildRecommendRoutine(index = 0) {
  const rec = RECOMMEND_ROUTINES[index % RECOMMEND_ROUTINES.length];
  return {
    ...rec,
    steps: rec.steps.map((step) => ({
      category: step.category,
      product: SAMPLE_PRODUCTS.find((p) => p.id === step.productId)!,
    })),
  };
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
  const weekly = state.weeklyChanges.filter((w) => w.routineId === routine.id);
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
            label: i === 0 ? "사용 전" : `${(i + 1) * 7}일차`,
            photoUrl: w.photoUrl,
            feeling: w.feeling,
          }))
        : [
            { label: "사용 전", feeling: "변화가 없었어요" },
            { label: `${durationDays}일차`, feeling: "변화가 있었어요" },
          ],
    visibility: input.visibility,
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

export function ensureDemoAccount() {
  // Supabase 연동 후에는 실제 회원가입/로그인 사용
}

export async function requestResetCode(email: string) {
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/forgot-password?step=3` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    return { ok: false as const, message: error.message || "가입되지 않은 이메일입니다." };
  }
  updateState((s) => ({
    ...s,
    resetTokens: {
      ...s.resetTokens,
      [email]: { code: "EMAIL_SENT", expiresAt: Date.now() + 60 * 60 * 1000 },
    },
  }));
  return { ok: true as const, code: "EMAIL_SENT" };
}

export async function verifyResetCode(email: string, code: string) {
  const state = loadState();
  const token = state.resetTokens[email];
  if (!token) return { ok: false as const, message: "인증번호가 만료되었습니다. 다시 시도해주세요." };
  if (Date.now() > token.expiresAt) {
    return { ok: false as const, message: "인증번호가 만료되었습니다. 다시 시도해주세요." };
  }
  // 이메일 링크로 진입한 recovery 세션이 있으면 통과
  const { data } = await supabase.auth.getSession();
  if (data.session) return { ok: true as const };
  // 로컬 테스트용: 123456 허용
  if (code === "123456" || token.code === "EMAIL_SENT") {
    if (code === "123456" || code.length === 6) return { ok: true as const };
  }
  return { ok: false as const, message: "인증번호가 일치하지 않습니다. 이메일 링크 확인 후 다시 시도해주세요." };
}

export async function resetPassword(email: string, password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // recovery 세션이 없으면 안내
    showToast(error.message || "비밀번호 변경에 실패했습니다. 이메일 링크로 다시 접속해주세요.");
    return { ok: false as const, message: error.message };
  }
  updateState((s) => ({
    ...s,
    resetTokens: Object.fromEntries(
      Object.entries(s.resetTokens).filter(([key]) => key !== email)
    ),
  }));
  await supabase.auth.signOut();
  return { ok: true as const };
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

export function canViewNoteDetail(state: AppState) {
  const myNotes = getMyNotes(state).filter((n) => n.visibility === "public");
  const hasPhotoShare = myNotes.some((n) =>
    n.changeTimeline.some((t) => Boolean(t.photoUrl))
  );
  if (hasPhotoShare) return { allowed: true as const, unlimited: true };
  const hasTagShare = myNotes.length > 0;
  const today = todayKey();
  const quota = state.viewQuota.date === today ? state.viewQuota.count : 0;
  if (!hasTagShare) {
    return { allowed: quota < 1, unlimited: false, limit: 1, used: quota };
  }
  return { allowed: quota < 10, unlimited: false, limit: 10, used: quota };
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
  const next = {
    ...state.bannerDismissed,
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


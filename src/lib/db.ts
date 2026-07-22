import { supabase } from "./supabase";
import type {
  AgeGroup,
  Comment,
  DailyLog,
  Gender,
  Product,
  Routine,
  SkinNote,
  SkinProfile,
  UserAccount,
  WeeklyChange,
} from "./types";

export async function getAuthUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchPublicNotes(): Promise<SkinNote[]> {
  const { data, error } = await supabase
    .from("skin_notes")
    .select("*")
    .eq("visibility", "public")
    .eq("is_abandoned", false)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapNote);
}

export async function fetchUserBundle(userId: string) {
  const [
    profileRes,
    skinRes,
    routinesRes,
    logsRes,
    weeklyRes,
    myNotesRes,
    publicNotesRes,
    commentsRes,
    savesRes,
    helpsRes,
    commentLikesRes,
    hidesRes,
    reportsRes,
    prefsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("skin_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("routines").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("daily_logs").select("*").eq("user_id", userId),
    supabase.from("weekly_changes").select("*").eq("user_id", userId),
    supabase.from("skin_notes").select("*").eq("author_id", userId).order("created_at", { ascending: false }),
    supabase.from("skin_notes").select("*").eq("visibility", "public").order("created_at", { ascending: false }),
    supabase.from("note_comments").select("*").order("created_at", { ascending: false }),
    supabase.from("note_saves").select("note_id").eq("user_id", userId),
    supabase.from("note_helps").select("note_id").eq("user_id", userId),
    supabase.from("comment_likes").select("comment_id").eq("user_id", userId),
    supabase.from("note_hides").select("note_id").eq("user_id", userId),
    supabase.from("note_reports").select("note_id").eq("user_id", userId),
    supabase.from("user_prefs").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const account: UserAccount | null = profileRes.data
    ? {
        id: profileRes.data.user_id,
        email: profileRes.data.email,
        password: "",
        nickname: profileRes.data.nickname,
        ageGroup: profileRes.data.age_group as AgeGroup,
        gender: (profileRes.data.gender as Gender) ?? null,
        avatarUrl: profileRes.data.avatar_url ?? undefined,
        createdAt: profileRes.data.created_at,
      }
    : null;

  const skinProfile: SkinProfile | null = skinRes.data
    ? {
        skinType: skinRes.data.skin_type,
        concerns: skinRes.data.concerns,
        sensitivity: skinRes.data.sensitivity,
      }
    : null;

  const myNotes = (myNotesRes.data ?? []).map(mapNote);
  const publicNotes = (publicNotesRes.data ?? []).map(mapNote);
  const noteMap = new Map<string, SkinNote>();
  [...publicNotes, ...myNotes].forEach((n) => noteMap.set(n.id, n));

  return {
    account,
    skinProfile,
    routines: (routinesRes.data ?? []).map(mapRoutine),
    dailyLogs: (logsRes.data ?? []).map(mapDailyLog),
    weeklyChanges: (weeklyRes.data ?? []).map(mapWeekly),
    skinNotes: Array.from(noteMap.values()),
    comments: (commentsRes.data ?? []).map(mapComment),
    savedNoteIds: (savesRes.data ?? []).map((r) => r.note_id as string),
    helpedNoteIds: (helpsRes.data ?? []).map((r) => r.note_id as string),
    likedCommentIds: (commentLikesRes.data ?? []).map((r) => r.comment_id as string),
    hiddenNoteIds: (hidesRes.data ?? []).map((r) => r.note_id as string),
    reportedNoteIds: (reportsRes.data ?? []).map((r) => r.note_id as string),
    prefs: prefsRes.data
      ? {
          selectedRoutineId: prefsRes.data.selected_routine_id as string | null,
          bannerDismissed: {
            drawer: Boolean(prefsRes.data.banner_drawer),
            detail: Boolean(prefsRes.data.banner_detail),
          },
          viewQuota: {
            date: prefsRes.data.view_quota_date
              ? String(prefsRes.data.view_quota_date)
              : "",
            count: Number(prefsRes.data.view_quota_count ?? 0),
          },
        }
      : null,
  };
}

export async function upsertProfile(account: UserAccount) {
  const { error } = await supabase.from("profiles").upsert({
    user_id: account.id,
    email: account.email,
    nickname: account.nickname,
    age_group: account.ageGroup,
    gender: account.gender,
    avatar_url: account.avatarUrl ?? null,
    updated_at: new Date().toISOString(),
  });
  return error;
}

export async function upsertSkinProfile(userId: string, profile: SkinProfile) {
  return supabase.from("skin_profiles").upsert({
    user_id: userId,
    skin_type: profile.skinType,
    concerns: profile.concerns,
    sensitivity: profile.sensitivity,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteSkinProfile(userId: string) {
  return supabase.from("skin_profiles").delete().eq("user_id", userId);
}

export async function insertRoutine(routine: Routine) {
  return supabase.from("routines").insert({
    id: routine.id,
    user_id: routine.userId,
    title: routine.title,
    concern_label: routine.concernLabel,
    steps: routine.steps,
    source: routine.source,
    status: routine.status,
    started_at: routine.startedAt,
  });
}

export async function updateRoutineStatus(routineId: string, status: "active" | "ended") {
  return supabase.from("routines").update({ status }).eq("id", routineId);
}

export async function upsertDailyLog(userId: string, log: DailyLog) {
  return supabase.from("daily_logs").upsert(
    {
      user_id: userId,
      routine_id: log.routineId,
      log_date: log.date,
      completed_step_ids: log.completedStepIds,
      saved_at: log.savedAt,
    },
    { onConflict: "user_id,routine_id,log_date" }
  );
}

export async function upsertWeeklyChange(userId: string, change: WeeklyChange) {
  return supabase.from("weekly_changes").upsert(
    {
      id: change.id,
      user_id: userId,
      routine_id: change.routineId,
      week_key: change.weekKey,
      photo_url: change.photoUrl ?? null,
      feeling: change.feeling,
      tags: change.tags,
      created_at: change.createdAt,
    },
    { onConflict: "user_id,routine_id,week_key" }
  );
}

export async function insertSkinNote(note: SkinNote) {
  return supabase.from("skin_notes").insert({
    id: note.id,
    author_id: note.authorId,
    author_nickname: note.authorNickname,
    author_avatar: note.authorAvatar ?? null,
    skin_type: note.skinType,
    concerns: note.concerns,
    sensitivity: note.sensitivity,
    age_group: note.ageGroup,
    title: note.title,
    tags: note.tags,
    products: note.products,
    duration_days: note.durationDays,
    difficulty: note.difficulty,
    felt_change: note.feltChange,
    end_reason: note.endReason,
    change_timeline: note.changeTimeline,
    visibility: note.visibility,
    is_abandoned: note.isAbandoned,
    save_count: note.saveCount,
    help_count: note.helpCount,
    comment_count: note.commentCount,
    created_at: note.createdAt,
  });
}

export async function deleteSkinNote(noteId: string) {
  return supabase.from("skin_notes").delete().eq("id", noteId);
}

export async function insertComment(comment: Comment) {
  const { error } = await supabase.from("note_comments").insert({
    id: comment.id,
    note_id: comment.noteId,
    author_id: comment.authorId,
    author_nickname: comment.authorNickname,
    author_avatar: comment.authorAvatar ?? null,
    content: comment.content,
    like_count: comment.likeCount,
    created_at: comment.createdAt,
  });
  if (error) return { error };
  const { data } = await supabase
    .from("skin_notes")
    .select("comment_count")
    .eq("id", comment.noteId)
    .maybeSingle();
  await supabase
    .from("skin_notes")
    .update({ comment_count: Number(data?.comment_count ?? 0) + 1 })
    .eq("id", comment.noteId);
  return { error: null };
}

export async function removeComment(commentId: string, noteId: string) {
  await supabase.from("note_comments").delete().eq("id", commentId);
  const { data } = await supabase
    .from("skin_notes")
    .select("comment_count")
    .eq("id", noteId)
    .maybeSingle();
  await supabase
    .from("skin_notes")
    .update({ comment_count: Math.max(0, Number(data?.comment_count ?? 1) - 1) })
    .eq("id", noteId);
}

export async function toggleSave(userId: string, noteId: string, currentlySaved: boolean) {
  if (currentlySaved) {
    await supabase.from("note_saves").delete().eq("user_id", userId).eq("note_id", noteId);
  } else {
    await supabase.from("note_saves").insert({ user_id: userId, note_id: noteId });
  }
  const { data } = await supabase.from("skin_notes").select("save_count").eq("id", noteId).maybeSingle();
  await supabase
    .from("skin_notes")
    .update({
      save_count: Math.max(0, Number(data?.save_count ?? 0) + (currentlySaved ? -1 : 1)),
    })
    .eq("id", noteId);
}

export async function toggleHelp(userId: string, noteId: string, currentlyHelped: boolean) {
  if (currentlyHelped) {
    await supabase.from("note_helps").delete().eq("user_id", userId).eq("note_id", noteId);
  } else {
    await supabase.from("note_helps").insert({ user_id: userId, note_id: noteId });
  }
  const { data } = await supabase.from("skin_notes").select("help_count").eq("id", noteId).maybeSingle();
  await supabase
    .from("skin_notes")
    .update({
      help_count: Math.max(0, Number(data?.help_count ?? 0) + (currentlyHelped ? -1 : 1)),
    })
    .eq("id", noteId);
}

export async function toggleCommentLikeDb(
  userId: string,
  commentId: string,
  currentlyLiked: boolean
) {
  if (currentlyLiked) {
    await supabase.from("comment_likes").delete().eq("user_id", userId).eq("comment_id", commentId);
  } else {
    await supabase.from("comment_likes").insert({ user_id: userId, comment_id: commentId });
  }
  const { data } = await supabase
    .from("note_comments")
    .select("like_count")
    .eq("id", commentId)
    .maybeSingle();
  await supabase
    .from("note_comments")
    .update({
      like_count: Math.max(0, Number(data?.like_count ?? 0) + (currentlyLiked ? -1 : 1)),
    })
    .eq("id", commentId);
}

export async function hideNoteDb(userId: string, noteId: string) {
  return supabase.from("note_hides").upsert({ user_id: userId, note_id: noteId });
}

export async function reportNoteDb(userId: string, noteId: string) {
  return supabase.from("note_reports").upsert({ user_id: userId, note_id: noteId });
}

export async function fetchCommentById(commentId: string) {
  const { data, error } = await supabase
    .from("note_comments")
    .select("id, note_id, author_id, content")
    .eq("id", commentId)
    .maybeSingle();
  if (error) return { ok: false as const, error, comment: null };
  if (!data) return { ok: true as const, comment: null, error: null };
  return {
    ok: true as const,
    error: null,
    comment: {
      id: String(data.id),
      noteId: String(data.note_id),
      authorId: String(data.author_id),
      content: String(data.content ?? ""),
    },
  };
}

export async function reportCommentDb(input: {
  userId: string;
  commentId: string;
  noteId: string;
  targetAuthorId: string;
  commentContent: string;
}) {
  return supabase.from("comment_reports").upsert({
    user_id: input.userId,
    comment_id: input.commentId,
    note_id: input.noteId,
    target_author_id: input.targetAuthorId,
    comment_content: input.commentContent,
  });
}

export async function upsertPrefs(
  userId: string,
  prefs: {
    selectedRoutineId?: string | null;
    bannerDrawer?: boolean;
    bannerDetail?: boolean;
    viewQuotaDate?: string;
    viewQuotaCount?: number;
  }
) {
  return supabase.from("user_prefs").upsert({
    user_id: userId,
    selected_routine_id: prefs.selectedRoutineId ?? null,
    banner_drawer: prefs.bannerDrawer ?? false,
    banner_detail: prefs.bannerDetail ?? false,
    view_quota_date: prefs.viewQuotaDate || null,
    view_quota_count: prefs.viewQuotaCount ?? 0,
    updated_at: new Date().toISOString(),
  });
}

function mapRoutine(row: Record<string, unknown>): Routine {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    concernLabel: String(row.concern_label),
    steps: (row.steps as Routine["steps"]) ?? [],
    source: row.source as Routine["source"],
    status: row.status as Routine["status"],
    startedAt: String(row.started_at),
  };
}

function mapDailyLog(row: Record<string, unknown>): DailyLog {
  return {
    date: String(row.log_date),
    routineId: String(row.routine_id),
    completedStepIds: (row.completed_step_ids as string[]) ?? [],
    savedAt: String(row.saved_at),
  };
}

function mapWeekly(row: Record<string, unknown>): WeeklyChange {
  return {
    id: String(row.id),
    routineId: String(row.routine_id),
    weekKey: String(row.week_key),
    photoUrl: (row.photo_url as string | null) ?? undefined,
    feeling: row.feeling as WeeklyChange["feeling"],
    tags: (row.tags as string[]) ?? [],
    createdAt: String(row.created_at),
  };
}

function mapNote(row: Record<string, unknown>): SkinNote {
  return {
    id: String(row.id),
    authorId: String(row.author_id),
    authorNickname: String(row.author_nickname),
    authorAvatar: (row.author_avatar as string | null) ?? undefined,
    skinType: row.skin_type as SkinNote["skinType"],
    concerns: (row.concerns as SkinNote["concerns"]) ?? [],
    sensitivity: row.sensitivity as SkinNote["sensitivity"],
    ageGroup: row.age_group as SkinNote["ageGroup"],
    title: String(row.title),
    tags: (row.tags as string[]) ?? [],
    products: (row.products as Product[]) ?? [],
    durationDays: Number(row.duration_days ?? 1),
    difficulty: row.difficulty as SkinNote["difficulty"],
    feltChange: Number(row.felt_change ?? 0),
    endReason: row.end_reason as SkinNote["endReason"],
    changeTimeline: (row.change_timeline as SkinNote["changeTimeline"]) ?? [],
    visibility: row.visibility as SkinNote["visibility"],
    isAbandoned: Boolean(row.is_abandoned),
    createdAt: String(row.created_at),
    saveCount: Number(row.save_count ?? 0),
    helpCount: Number(row.help_count ?? 0),
    commentCount: Number(row.comment_count ?? 0),
  };
}

function mapComment(row: Record<string, unknown>): Comment {
  return {
    id: String(row.id),
    noteId: String(row.note_id),
    authorId: String(row.author_id),
    authorNickname: String(row.author_nickname),
    authorAvatar: (row.author_avatar as string | null) ?? undefined,
    content: String(row.content),
    createdAt: String(row.created_at),
    likeCount: Number(row.like_count ?? 0),
  };
}

export function newUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return uidFallback();
}

function uidFallback() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

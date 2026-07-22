export type SkinType = "건성" | "지성" | "복합성" | "민감성";

export type SkinConcern =
  | "여드름/트러블"
  | "색소침착"
  | "모공/피지"
  | "주름/탄력"
  | "민감/붉음증"
  | "보습/건조함"
  | "미백/칙칙함"
  | "각질";

export type Sensitivity = "낮음" | "보통" | "높음";

export type AgeGroup = "10대" | "20대" | "30대" | "40대" | "50대 이상";

export type Gender = "여성" | "남성" | null;

export type ChangeFeeling = "변화가 있었어요" | "모르겠어요" | "변화가 없었어요";

export type EndReason =
  | "변화가 느껴져서 마칠래요"
  | "변화는 없지만 기록을 마칠래요"
  | "지속하기 어려워서 그만할래요";

export type Difficulty = "쉬웠어요" | "보통이에요" | "어려웠어요";

export type RoutineStepCategory =
  | "클렌징"
  | "토너"
  | "세럼"
  | "앰플"
  | "크림"
  | "선크림"
  | "마스크"
  | "기타";

export type Product = {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  category?: RoutineStepCategory;
  isCustom?: boolean;
};

export type RoutineStep = {
  id: string;
  category: RoutineStepCategory;
  product: Product;
  order: number;
};

export type Routine = {
  id: string;
  userId: string;
  title: string;
  concernLabel: string;
  steps: RoutineStep[];
  startedAt: string;
  source: "manual" | "recommend";
  status: "active" | "ended";
};

export type DailyLog = {
  date: string;
  routineId: string;
  completedStepIds: string[];
  savedAt: string;
};

export type WeeklyChange = {
  id: string;
  routineId: string;
  weekKey: string;
  photoUrl?: string;
  feeling: ChangeFeeling;
  tags: string[];
  createdAt: string;
};

export type SkinNote = {
  id: string;
  authorId: string;
  authorNickname: string;
  authorAvatar?: string;
  skinType: SkinType;
  concerns: SkinConcern[];
  sensitivity: Sensitivity;
  ageGroup: AgeGroup;
  title: string;
  tags: string[];
  products: Product[];
  durationDays: number;
  difficulty: Difficulty;
  feltChange: number;
  endReason: EndReason;
  changeTimeline: Array<{
    label: string;
    photoUrl?: string;
    feeling?: ChangeFeeling;
  }>;
  visibility: "private" | "public";
  isAbandoned: boolean;
  createdAt: string;
  saveCount: number;
  helpCount: number;
  commentCount: number;
  savedByMe?: boolean;
  helpedByMe?: boolean;
};

export type Comment = {
  id: string;
  noteId: string;
  authorId: string;
  authorNickname: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  likeCount: number;
  likedByMe?: boolean;
};

export type UserAccount = {
  id: string;
  email: string;
  password: string;
  nickname: string;
  ageGroup: AgeGroup;
  gender: Gender;
  avatarUrl?: string;
  createdAt: string;
};

export type SkinProfile = {
  skinType: SkinType;
  concerns: SkinConcern[];
  sensitivity: Sensitivity;
};

export type AppState = {
  isLoggedIn: boolean;
  autoLogin: boolean;
  currentUserId: string | null;
  selectedRoutineId: string | null;
  accounts: UserAccount[];
  profiles: Record<string, SkinProfile>;
  routines: Routine[];
  dailyLogs: DailyLog[];
  weeklyChanges: WeeklyChange[];
  skinNotes: SkinNote[];
  comments: Comment[];
  savedNoteIds: string[];
  helpedNoteIds: string[];
  likedCommentIds: string[];
  hiddenNoteIds: string[];
  viewedNoteIds: string[];
  reportedNoteIds: string[];
  bannerDismissed: {
    drawer: boolean;
    detail: boolean;
  };
  viewQuota: {
    date: string;
    count: number;
  };
  pendingEnd: {
    reason?: EndReason;
    /** "지속하기 어려워서 그만할래요" 세부 사유 (최대 2개) */
    quitDetails?: string[];
    difficulty?: Difficulty;
    tags: string[];
    feltChange: number;
  } | null;
  resetTokens: Record<string, { code: string; expiresAt: number }>;
  toast: string | null;
};

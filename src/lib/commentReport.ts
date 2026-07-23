/** 게시글/댓글 신고 → 문의하기 전달용 컨텍스트 (화면에는 ID 미노출) */

export const REPORT_INQUIRY_STORAGE_KEY = "ana-report-inquiry";
/** 문의하기 이전 버튼 복귀 경로 (초안 consume 후에도 유지) */
export const REPORT_RETURN_PATH_KEY = "ana-report-inquiry-return";

/** @deprecated 하위 호환 */
export const COMMENT_REPORT_STORAGE_KEY = REPORT_INQUIRY_STORAGE_KEY;

export type ReportInquiryContext = {
  kind: "note" | "comment";
  reporterId: string;
  noteId: string;
  /** 문의하기 이전 버튼 복귀 경로 */
  returnPath: string;
  noteTitle?: string;
  commentId?: string;
  commentContent?: string;
  commentAuthorId?: string;
};

/** @deprecated 하위 호환 별칭 */
export type CommentReportContext = ReportInquiryContext & {
  targetType: "댓글";
};

export function saveReportInquiryContext(ctx: ReportInquiryContext) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REPORT_INQUIRY_STORAGE_KEY, JSON.stringify(ctx));
  window.sessionStorage.setItem(REPORT_RETURN_PATH_KEY, ctx.returnPath);
}

export function loadReportReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.sessionStorage.getItem(REPORT_RETURN_PATH_KEY);
  return path && path.startsWith("/") ? path : null;
}

export function clearReportReturnPath() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REPORT_RETURN_PATH_KEY);
}

function parseReportInquiryContext(raw: string): ReportInquiryContext | null {
  try {
    const parsed = JSON.parse(raw) as ReportInquiryContext & { targetType?: string };
    if (!parsed?.noteId) return null;
    const returnPath = parsed.returnPath || `/notes/${parsed.noteId}`;
    if (parsed.kind !== "note" && parsed.kind !== "comment") {
      // 구 포맷: targetType === "댓글"
      if (parsed.targetType === "댓글") {
        return {
          kind: "comment",
          reporterId: parsed.reporterId,
          noteId: parsed.noteId,
          returnPath,
          commentId: parsed.commentId,
          commentContent: parsed.commentContent,
          commentAuthorId: parsed.commentAuthorId,
        };
      }
      return null;
    }
    return { ...parsed, returnPath };
  } catch {
    return null;
  }
}

/** 읽기만 (문의하기 초안·복귀 경로 유지용) */
export function loadReportInquiryContext(): ReportInquiryContext | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(REPORT_INQUIRY_STORAGE_KEY);
  if (!raw) return null;
  return parseReportInquiryContext(raw);
}

export function clearReportInquiryContext() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REPORT_INQUIRY_STORAGE_KEY);
}

export function consumeReportInquiryContext(): ReportInquiryContext | null {
  const ctx = loadReportInquiryContext();
  if (ctx) clearReportInquiryContext();
  return ctx;
}

/** @deprecated */
export function saveCommentReportContext(
  ctx: Omit<ReportInquiryContext, "kind" | "returnPath"> & {
    targetType: "댓글";
    noteId: string;
  }
) {
  saveReportInquiryContext({
    kind: "comment",
    reporterId: ctx.reporterId,
    noteId: ctx.noteId,
    returnPath: `/notes/${ctx.noteId}`,
    commentId: ctx.commentId,
    commentContent: ctx.commentContent,
    commentAuthorId: ctx.commentAuthorId,
  });
}

/** @deprecated */
export function consumeCommentReportContext(): CommentReportContext | null {
  const ctx = consumeReportInquiryContext();
  if (!ctx || ctx.kind !== "comment") return null;
  return { ...ctx, targetType: "댓글" };
}

export function buildReportInquiryDraft(ctx: ReportInquiryContext) {
  const time = new Date().toLocaleString("ko-KR");
  if (ctx.kind === "note") {
    return {
      title: "스킨노트 신고",
      body: `문의/신고 대상: 스킨노트
문제가 발생한 화면: 스킨노트 상세
발생 시간: ${time}
자세한 내용:
아래 스킨노트를 신고합니다.

[신고 대상 스킨노트]
${ctx.noteTitle?.trim() || "(제목 없음)"}

(추가 설명)
`,
    };
  }

  const snippet = (ctx.commentContent ?? "").trim();
  const clipped =
    snippet.length > 200 ? `${snippet.slice(0, 200)}…` : snippet || "(내용 없음)";

  return {
    title: "댓글 신고",
    body: `문의/신고 대상: 댓글
문제가 발생한 화면: 스킨노트 상세
발생 시간: ${time}
자세한 내용:
아래 댓글을 신고합니다.

[신고 대상 댓글]
${clipped}

(추가 설명)
`,
  };
}

/** @deprecated */
export function buildCommentReportInquiryDraft(ctx: CommentReportContext) {
  return buildReportInquiryDraft(ctx);
}

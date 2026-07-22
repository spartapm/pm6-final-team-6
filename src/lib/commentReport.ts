/** 댓글 신고 → 문의하기 전달용 컨텍스트 (화면에는 ID 미노출) */

export const COMMENT_REPORT_STORAGE_KEY = "ana-comment-report";

export type CommentReportContext = {
  reporterId: string;
  targetType: "댓글";
  commentId: string;
  commentContent: string;
  commentAuthorId: string;
  noteId: string;
};

export function saveCommentReportContext(ctx: CommentReportContext) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(COMMENT_REPORT_STORAGE_KEY, JSON.stringify(ctx));
}

export function consumeCommentReportContext(): CommentReportContext | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(COMMENT_REPORT_STORAGE_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(COMMENT_REPORT_STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw) as CommentReportContext;
    if (parsed?.targetType !== "댓글" || !parsed.commentId || !parsed.noteId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 문의하기 화면에 노출할 미리 채움 텍스트 (내부 ID 제외) */
export function buildCommentReportInquiryDraft(ctx: CommentReportContext) {
  const snippet =
    ctx.commentContent.trim().length > 200
      ? `${ctx.commentContent.trim().slice(0, 200)}…`
      : ctx.commentContent.trim();

  return {
    title: "댓글 신고",
    body: `문의/신고 대상: 댓글
문제가 발생한 화면: 스킨노트 상세
발생 시간: ${new Date().toLocaleString("ko-KR")}
자세한 내용:
아래 댓글을 신고합니다.

[신고 대상 댓글]
${snippet || "(내용 없음)"}

(추가 설명)
`,
  };
}

/** 게시글/댓글 신고 → 문의하기 전달용 컨텍스트 (화면에는 ID 미노출) */

export const REPORT_INQUIRY_STORAGE_KEY = "ana-report-inquiry";

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
}

export function consumeReportInquiryContext(): ReportInquiryContext | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(REPORT_INQUIRY_STORAGE_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(REPORT_INQUIRY_STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw) as ReportInquiryContext & { targetType?: string };
    if (!parsed?.noteId || !parsed.returnPath) return null;
    if (parsed.kind !== "note" && parsed.kind !== "comment") {
      // 구 포맷: targetType === "댓글"
      if (parsed.targetType === "댓글") {
        return {
          kind: "comment",
          reporterId: parsed.reporterId,
          noteId: parsed.noteId,
          returnPath: parsed.returnPath || `/notes/${parsed.noteId}`,
          commentId: parsed.commentId,
          commentContent: parsed.commentContent,
          commentAuthorId: parsed.commentAuthorId,
        };
      }
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
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

import { NextResponse } from "next/server";
import { getResendApiKey, getResendFrom } from "@/lib/server/env";

export const runtime = "nodejs";

const SUPPORT_EMAIL = "anacosmetics2026@gmail.com";
const MAX_BODY = 2000;
const MAX_IMAGES = 3;

type Attachment = {
  filename: string;
  content: string; // base64
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title?: string;
      content?: string;
      fromEmail?: string;
      attachments?: Attachment[];
      reportMeta?: {
        reporterId?: string;
        targetType?: string;
        commentId?: string;
        commentContent?: string;
        commentAuthorId?: string;
        noteId?: string;
        noteTitle?: string;
      };
    };

    const title = body.title?.trim() || "";
    const content = body.content?.trim() || "";
    const fromEmail = body.fromEmail?.trim() || "";
    const reportMeta = body.reportMeta;
    const attachments = Array.isArray(body.attachments)
      ? body.attachments.slice(0, MAX_IMAGES)
      : [];

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "제목을 입력해주세요." },
        { status: 400 }
      );
    }
    if (!content) {
      return NextResponse.json(
        { ok: false, message: "문의 내용을 입력해주세요." },
        { status: 400 }
      );
    }
    if (content.length > MAX_BODY) {
      return NextResponse.json(
        { ok: false, message: "문의 내용은 2000자 이내로 작성해주세요." },
        { status: 400 }
      );
    }

    const apiKey = getResendApiKey();
    const from = getResendFrom();

    const reportBlock =
      reportMeta?.targetType === "댓글"
        ? `
        <hr />
        <p><strong>[댓글 신고 접수 데이터]</strong></p>
        <ul>
          <li>신고자 ID: ${escapeHtml(reportMeta.reporterId || "")}</li>
          <li>신고 대상 유형: 댓글</li>
          <li>신고 대상 댓글: ${escapeHtml(reportMeta.commentContent || "")}</li>
          <li>신고 대상 댓글 작성자 ID: ${escapeHtml(reportMeta.commentAuthorId || "")}</li>
          <li>스킨노트 ID: ${escapeHtml(reportMeta.noteId || "")}</li>
          <li>댓글 ID: ${escapeHtml(reportMeta.commentId || "")}</li>
        </ul>
      `
        : reportMeta?.targetType === "스킨노트"
          ? `
        <hr />
        <p><strong>[스킨노트 신고 접수 데이터]</strong></p>
        <ul>
          <li>신고자 ID: ${escapeHtml(reportMeta.reporterId || "")}</li>
          <li>신고 대상 유형: 스킨노트</li>
          <li>스킨노트 제목: ${escapeHtml(reportMeta.noteTitle || "")}</li>
          <li>스킨노트 ID: ${escapeHtml(reportMeta.noteId || "")}</li>
        </ul>
      `
          : "";

    const html = `
      <div style="font-family:sans-serif;line-height:1.7;color:#222">
        <p><strong>ANA 문의</strong></p>
        <p><strong>제목:</strong> ${escapeHtml(title)}</p>
        <p><strong>보낸 사람:</strong> ${escapeHtml(fromEmail || "(미로그인)")}</p>
        <hr />
        <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(content)}</pre>
        ${reportBlock}
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [SUPPORT_EMAIL],
        reply_to: fromEmail || undefined,
        subject: `[ANA 문의] ${title}`,
        html,
        attachments: attachments.map((a) => ({
          filename: a.filename || "screenshot.jpg",
          content: a.content.replace(/^data:[^;]+;base64,/, ""),
        })),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("inquiry resend error", res.status, text.slice(0, 300));
      return NextResponse.json(
        { ok: false, message: "문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "서버 API 키 설정에 문제가 있습니다."
        : "문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

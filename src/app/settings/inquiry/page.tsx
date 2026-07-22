"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { TextInput } from "@/components/ui/Field";
import {
  buildCommentReportInquiryDraft,
  consumeCommentReportContext,
  type CommentReportContext,
} from "@/lib/commentReport";
import { compressImageFile, validateImageFile } from "@/lib/image";
import { showToast } from "@/lib/store";
import { useAppDerivations } from "@/lib/useAppState";

const SUPPORT_EMAIL = "anacosmetics2026@gmail.com";
const MAX_LEN = 2000;
const MAX_PHOTOS = 3;

const BODY_PLACEHOLDER = `문의 내용을 자세히 입력해주세요.

예시)
- 문의/신고 대상:
- 문제가 발생한 화면:
- 발생 시간:
- 자세한 내용:`;

type PhotoItem = {
  id: string;
  name: string;
  previewUrl: string;
  dataUrl: string;
};

function InquiryInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { user } = useAppDerivations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reportMeta, setReportMeta] = useState<CommentReportContext | null>(null);

  useEffect(() => {
    if (search.get("from") !== "comment-report") return;
    const ctx = consumeCommentReportContext();
    if (!ctx) {
      router.replace("/settings/inquiry", { scroll: false });
      return;
    }
    const draft = buildCommentReportInquiryDraft(ctx);
    setReportMeta(ctx);
    setTitle(draft.title);
    setBody(draft.body.slice(0, MAX_LEN));
    router.replace("/settings/inquiry", { scroll: false });
  }, [search, router]);

  const errors = useMemo(() => {
    const e: { title?: string; body?: string } = {};
    if (!title.trim()) e.title = "제목을 입력해주세요.";
    if (!body.trim()) e.body = "문의 내용을 입력해주세요.";
    return e;
  }, [title, body]);

  const canSubmit = !errors.title && !errors.body;

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      showToast("스크린샷은 최대 3장까지 첨부할 수 있어요.");
      return;
    }

    const next: PhotoItem[] = [];
    for (const file of list.slice(0, room)) {
      const invalid = validateImageFile(file);
      if (invalid) {
        showToast(invalid);
        continue;
      }
      try {
        const dataUrl = await compressImageFile(file, { maxEdge: 1280, quality: 0.82 });
        next.push({
          id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          previewUrl: dataUrl,
          dataUrl,
        });
      } catch {
        showToast("사진 업로드에 실패했어요. 다시 시도해주세요.");
      }
    }

    if (next.length > 0) {
      setPhotos((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
    }
    if (list.length > room) {
      showToast("스크린샷은 최대 3장까지 첨부할 수 있어요.");
    }
  };

  const sendInquiry = async () => {
    setSubmitted(true);
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: body.trim(),
          fromEmail: user?.email ?? "",
          reportMeta: reportMeta
            ? {
                reporterId: reportMeta.reporterId,
                targetType: reportMeta.targetType,
                commentId: reportMeta.commentId,
                commentContent: reportMeta.commentContent,
                commentAuthorId: reportMeta.commentAuthorId,
                noteId: reportMeta.noteId,
              }
            : undefined,
          attachments: photos.map((p, i) => ({
            filename: p.name || `screenshot-${i + 1}.jpg`,
            content: p.dataUrl,
          })),
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;

      if (!res.ok || !json?.ok) {
        // API 실패 시 메일 앱으로 폴백 (첨부 제외)
        const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
          `[ANA 문의] ${title.trim()}`
        )}&body=${encodeURIComponent(
          `${body.trim()}\n\n---\n보낸 사람: ${user?.email ?? "(비로그인)"}\n첨부: ${
            photos.length > 0 ? `${photos.length}장` : "없음"
          }`
        )}`;
        window.location.href = mailto;
        showToast(json?.message || "문의 메일 작성 화면으로 이동했어요.");
        return;
      }

      showToast("문의가 접수되었어요.");
      router.push("/settings");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="문의하기" center backHref="/settings" />

      <div className="page-pad mt-4 space-y-4 pb-8 animate-fade-up">
        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">보내는 곳</p>
          <TextInput value={SUPPORT_EMAIL} readOnly className="!text-ink-soft" />
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">제목</p>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요."
            error={submitted ? errors.title : undefined}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">문의 내용</p>
          <div>
            <div className="relative">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
                placeholder={BODY_PLACEHOLDER}
                maxLength={MAX_LEN}
                className={[
                  "min-h-[200px] w-full rounded-field border bg-surface-card px-4 py-3 pb-9 text-[15px] text-ink outline-none transition placeholder:text-ink-muted/80",
                  submitted && errors.body
                    ? "border-[#ff0000]"
                    : "border-line focus:border-sky",
                ].join(" ")}
              />
              <span className="pointer-events-none absolute bottom-3 right-3 text-[11px] text-ink-muted">
                {body.length} / {MAX_LEN}
              </span>
            </div>
            {submitted && errors.body && (
              <p className="mt-1.5 text-[10px] font-medium text-[#ff0000]">{errors.body}</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">스크린샷 첨부 (선택)</p>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void addFiles(e.dataTransfer.files);
            }}
            className={[
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed bg-surface-card px-4 py-8 text-center transition",
              dragging ? "border-sky bg-sky-faint" : "border-sky",
            ].join(" ")}
          >
            <UploadIcon />
            <span className="text-sm font-bold text-ink-muted">
              파일을 선택하거나 드래그해 주세요.
            </span>
            <span className="text-[11px] text-ink-muted">최대 {MAX_PHOTOS}장 · jpg, png</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files) void addFiles(files);
                e.target.value = "";
              }}
            />
          </div>

          {photos.length > 0 && (
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <li key={photo.id} className="relative overflow-hidden rounded-field bg-surface-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="첨부 삭제"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-xs text-white"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-sky text-[10px] font-bold text-sky">
            i
          </span>
          문의 접수 후 로그인한 이메일로 답변을 보내드려요.
        </p>

        <Button
          fullWidth
          disabled={busy}
          className={
            !canSubmit
              ? "!border-transparent !bg-btn-disabled !text-ink-muted !shadow-none"
              : ""
          }
          onClick={() => void sendInquiry()}
        >
          {busy ? "전송 중..." : "문의 보내기"}
        </Button>
      </div>
    </AppShell>
  );
}

function UploadIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="#7BA5FD"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="#7BA5FD" strokeWidth="1.6" strokeLinejoin="round" />
      <path
        d="M12 17V10m0 0 2.5 2.5M12 10l-2.5 2.5"
        stroke="#7BA5FD"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function InquiryPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
        </AppShell>
      }
    >
      <InquiryInner />
    </Suspense>
  );
}

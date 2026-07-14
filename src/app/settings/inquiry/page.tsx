"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { TextArea, TextInput } from "@/components/ui/Field";
import { showToast } from "@/lib/store";
import { useAppDerivations } from "@/lib/useAppState";

const SUPPORT_EMAIL = "anacosmetics2026@gmail.com";
const MAX_LEN = 2000;

const BODY_PLACEHOLDER = `문의/신고 대상:
문제가 발생한 화면:
발생 시간:
자세한 내용:`;

export default function InquiryPage() {
  const router = useRouter();
  const { user } = useAppDerivations();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const errors = useMemo(() => {
    const e: { title?: string; body?: string } = {};
    if (!title.trim()) e.title = "제목을 입력해주세요.";
    if (!body.trim()) e.body = "문의 내용을 입력해주세요.";
    return e;
  }, [title, body]);

  const canSubmit = !errors.title && !errors.body;

  const sendInquiry = async () => {
    setSubmitted(true);
    if (!canSubmit) return;
    setBusy(true);
    try {
      const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        `[ANA 문의] ${title.trim()}`
      )}&body=${encodeURIComponent(
        `${body.trim()}\n\n---\n보낸 사람: ${user?.email ?? "(비로그인)"}\n첨부: ${
          fileName ?? "없음"
        }`
      )}`;
      window.location.href = mailto;
      showToast("문의 메일 작성 화면으로 이동했어요.");
      router.back();
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
          <div className="relative">
            <TextArea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
              placeholder={BODY_PLACEHOLDER}
              className="min-h-[180px] pb-8"
              error={submitted ? errors.body : undefined}
            />
            <span className="pointer-events-none absolute bottom-3 right-3 text-[11px] text-ink-muted">
              {body.length} / {MAX_LEN}
            </span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">스크린샷 첨부 (선택)</p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-sky bg-surface-card px-4 py-8 text-center">
            <span className="text-2xl text-sky" aria-hidden>
              ⬆
            </span>
            <span className="text-sm font-bold text-ink-muted">
              {fileName ? fileName : "파일을 선택하거나 드래그해 주세요."}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setFileName(file?.name ?? null);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-sky text-[10px] font-bold text-sky">
            i
          </span>
          문의 접수 후 로그인한 이메일로 답변을 보내드려요.
        </p>

        <Button fullWidth disabled={busy} onClick={() => void sendInquiry()}>
          {busy ? "처리 중..." : "문의 보내기"}
        </Button>
      </div>
    </AppShell>
  );
}

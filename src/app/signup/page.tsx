"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import { FieldLabel, SelectInput, TextInput } from "@/components/ui/Field";
import { AGE_GROUPS, isValidEmail, isValidPassword } from "@/lib/constants";
import { signup } from "@/lib/store";
import type { AgeGroup, Gender } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [gender, setGender] = useState<Gender>(null);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [docModal, setDocModal] = useState<"terms" | "privacy" | null>(null);
  const [saving, setSaving] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!nickname.trim()) e.nickname = "닉네임을 입력해주세요.";
    else if (nickname.trim().length < 2) e.nickname = "닉네임은 2자 이상 입력해주세요.";
    else if (nickname.trim().length > 12) e.nickname = "닉네임은 12자 이하로 입력해주세요.";
    if (!email.trim()) e.email = "이메일을 입력해주세요.";
    else if (!isValidEmail(email.trim())) e.email = "올바른 이메일 형식으로 입력해주세요.";
    if (!password) e.password = "비밀번호를 입력해주세요.";
    else if (!isValidPassword(password))
      e.password = "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.";
    if (!passwordConfirm) e.passwordConfirm = "비밀번호 확인을 입력해주세요.";
    else if (passwordConfirm !== password) e.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    if (!ageGroup) e.ageGroup = "연령대를 선택해주세요.";
    if (!terms) e.terms = "이용약관에 동의해주세요.";
    if (!privacy) e.privacy = "개인정보 처리방침에 동의해주세요.";
    return e;
  }, [nickname, email, password, passwordConfirm, ageGroup, terms, privacy]);

  const canSubmit = Object.keys(errors).length === 0;

  return (
    <AppShell showNav={false}>
      <PageHeader
        title="회원가입"
        subtitle="내 피부 고민에 맞는 루틴을 기록해요"
        backHref="/login"
        center
      />

      <div className="page-pad mt-5 space-y-4 pb-8 animate-fade-up">
        <div>
          <FieldLabel required>닉네임</FieldLabel>
          <TextInput
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임 입력"
            error={submitted ? errors.nickname : undefined}
          />
        </div>
        <div>
          <FieldLabel required>이메일</FieldLabel>
          <TextInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 입력"
            error={submitted ? errors.email : undefined}
          />
        </div>
        <div>
          <FieldLabel required>비밀번호</FieldLabel>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력 (8자 이상, 영문+숫자)"
            error={submitted ? errors.password : undefined}
          />
        </div>
        <div>
          <FieldLabel required>비밀번호 확인</FieldLabel>
          <TextInput
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 확인"
            error={submitted ? errors.passwordConfirm : undefined}
          />
        </div>
        <div>
          <FieldLabel required>연령대</FieldLabel>
          <SelectInput
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value as AgeGroup | "")}
            error={submitted ? errors.ageGroup : undefined}
          >
            <option value="">연령대 선택</option>
            {AGE_GROUPS.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel>성별</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {(["여성", "남성"] as const).map((g) => (
              <SelectChip
                key={g}
                selected={gender === g}
                onClick={() => setGender((prev) => (prev === g ? null : g))}
              >
                {g}
              </SelectChip>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-card border border-line bg-surface-white p-4">
          <label className="flex items-start justify-between gap-3 text-sm text-ink">
            <span className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              [필수] 이용약관 동의
            </span>
            <button
              type="button"
              className="shrink-0 font-bold text-accent"
              onClick={() => setDocModal("terms")}
            >
              보기
            </button>
          </label>
          {submitted && errors.terms && (
            <p className="text-xs font-medium text-accent">{errors.terms}</p>
          )}
          <label className="flex items-start justify-between gap-3 text-sm text-ink">
            <span className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              [필수] 개인정보 처리방침 동의
            </span>
            <button
              type="button"
              className="shrink-0 font-bold text-accent"
              onClick={() => setDocModal("privacy")}
            >
              보기
            </button>
          </label>
          {submitted && errors.privacy && (
            <p className="text-xs font-medium text-accent">{errors.privacy}</p>
          )}
        </div>

        {formError && <p className="text-sm font-medium text-accent">{formError}</p>}

        <Button
          fullWidth
          disabled={saving}
          onClick={async () => {
            setSubmitted(true);
            setFormError("");
            if (!canSubmit || !ageGroup) return;
            setSaving(true);
            try {
              const result = await signup({
                nickname: nickname.trim(),
                email: email.trim(),
                password,
                ageGroup,
                gender,
              });
              if (!result.ok) {
                setFormError(result.message);
                return;
              }
              if ("needsEmailConfirmation" in result && result.needsEmailConfirmation) {
                setFormError(result.message || "이메일 인증 후 로그인해주세요.");
                return;
              }
              router.push("/skin-profile");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "가입 중..." : "회원가입"}
        </Button>

        <p className="text-center text-sm text-ink-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-bold text-accent">
            로그인
          </Link>
        </p>
      </div>

      <Modal
        open={Boolean(docModal)}
        title={docModal === "terms" ? "이용약관" : "개인정보 처리방침"}
        description={
          docModal === "terms"
            ? "ANA 서비스 이용과 관련된 기본 약관입니다. MVP에서는 요약 안내만 제공합니다."
            : "수집 항목, 이용 목적, 보관 기간에 대한 안내입니다. MVP에서는 요약 안내만 제공합니다."
        }
        confirmLabel="확인"
        hideCancel
        onConfirm={() => setDocModal(null)}
      />
    </AppShell>
  );
}

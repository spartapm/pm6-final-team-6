"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import SelectChip from "@/components/ui/SelectChip";
import { SelectInput, TextInput } from "@/components/ui/Field";
import { mapAgeRange, mapGender, trackEvent } from "@/lib/analytics";
import { AGE_GROUPS, isValidEmail, isValidNickname, isValidPassword } from "@/lib/constants";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/legal";
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
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [docModal, setDocModal] = useState<"terms" | "privacy" | null>(null);
  const [saving, setSaving] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const nick = nickname.trim();
    if (!nick) e.nickname = "닉네임을 입력해주세요.";
    else if (nick.length < 2 || nick.length > 10)
      e.nickname = "닉네임은 2~10자로 입력해주세요.";
    else if (!isValidNickname(nick))
      e.nickname = "닉네임은 한글, 영문, 숫자만 사용할 수 있어요.";
    if (!email.trim()) e.email = "이메일을 입력해주세요.";
    else if (!isValidEmail(email.trim())) e.email = "올바른 이메일 형식으로 입력해주세요.";
    if (!password) e.password = "비밀번호를 입력해주세요.";
    else if (!isValidPassword(password))
      e.password = "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.";
    if (!passwordConfirm) e.passwordConfirm = "비밀번호 확인을 입력해주세요.";
    else if (passwordConfirm !== password) e.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    if (!ageGroup) e.ageGroup = "연령대를 선택해주세요.";
    if (!ageConfirmed) e.ageConfirmed = "만 14세 이상임을 확인해주세요.";
    if (!privacy) e.privacy = "개인정보 처리방침에 동의해주세요.";
    if (!terms) e.terms = "이용약관에 동의해주세요.";
    return e;
  }, [nickname, email, password, passwordConfirm, ageGroup, ageConfirmed, terms, privacy]);

  const canSubmit = Object.keys(errors).length === 0;

  return (
    <AppShell showNav={false}>
      <PageHeader
        title="회원가입"
        subtitle="내 피부 고민에 맞는 루틴을 기록해요"
        backHref="/login"
        center
      />

      <div className="page-pad mt-5 space-y-3 pb-8 animate-fade-up">
        <TextInput
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setNicknameError("");
          }}
          placeholder="닉네임 입력"
          maxLength={10}
          error={nicknameError || (submitted ? errors.nickname : undefined)}
        />
        <TextInput
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          placeholder="이메일 입력"
          inputMode="email"
          autoComplete="email"
          error={emailError || (submitted ? errors.email : undefined)}
        />
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 입력 (8자 이상, 영문+숫자)"
          error={submitted ? errors.password : undefined}
        />
        <TextInput
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호 확인"
          error={submitted ? errors.passwordConfirm : undefined}
        />
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

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {(["여성", "남성"] as const).map((g) => (
            <SelectChip
              key={g}
              selected={gender === g}
              onClick={() => setGender((prev) => (prev === g ? null : g))}
              className="!rounded-field py-3"
            >
              {g}
            </SelectChip>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="h-4 w-4 accent-sky"
            />
            [필수] 만 14세 이상입니다.
          </label>
          {submitted && errors.ageConfirmed && (
            <p className="text-[10px] font-medium text-[#ff0000]">{errors.ageConfirmed}</p>
          )}

          <label className="flex items-center justify-between gap-3 text-sm text-ink">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
                className="h-4 w-4 accent-sky"
              />
              [필수] 개인정보 처리방침 동의
            </span>
            <button
              type="button"
              className="shrink-0 text-xs font-bold text-ink-muted"
              onClick={() => setDocModal("privacy")}
            >
              보기 &gt;
            </button>
          </label>
          {submitted && errors.privacy && (
            <p className="text-[10px] font-medium text-[#ff0000]">{errors.privacy}</p>
          )}

          <label className="flex items-center justify-between gap-3 text-sm text-ink">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="h-4 w-4 accent-sky"
              />
              [필수] 이용약관 동의
            </span>
            <button
              type="button"
              className="shrink-0 text-xs font-bold text-ink-muted"
              onClick={() => setDocModal("terms")}
            >
              보기 &gt;
            </button>
          </label>
          {submitted && errors.terms && (
            <p className="text-[10px] font-medium text-[#ff0000]">{errors.terms}</p>
          )}
        </div>

        {formError && (
          <p className="text-[10px] font-medium text-[#ff0000]">{formError}</p>
        )}

        <Button
          fullWidth
          disabled={saving}
          className={`mt-2 ${
            !canSubmit
              ? "!border-transparent !bg-btn-disabled !text-ink-muted !shadow-none"
              : ""
          }`}
          onClick={async () => {
            setSubmitted(true);
            setFormError("");
            setNicknameError("");
            setEmailError("");
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
                if (result.message.includes("닉네임")) {
                  setNicknameError(result.message);
                } else if (result.message.includes("이메일") || result.message.includes("가입된")) {
                  setEmailError(result.message);
                } else {
                  setFormError(result.message);
                }
                return;
              }
              if ("needsEmailConfirmation" in result && result.needsEmailConfirmation) {
                setFormError(result.message || "이메일 인증 후 로그인해주세요.");
                return;
              }
              trackEvent("sign_up", {
                method: "email",
                age_range: mapAgeRange(ageGroup),
                gender: mapGender(gender),
              });
              router.push("/");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "가입 중..." : "회원가입"}
        </Button>

        <p className="text-center text-sm text-ink-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-extrabold text-ink underline">
            로그인
          </Link>
        </p>
      </div>

      <Modal
        open={Boolean(docModal)}
        title={docModal === "terms" ? "이용약관" : "개인정보 처리방침"}
        confirmLabel="확인"
        hideCancel
        onConfirm={() => setDocModal(null)}
        onCancel={() => setDocModal(null)}
      >
        <div className="mt-3 max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-field border border-line/60 bg-surface-soft px-3 py-3 text-[12px] leading-relaxed text-ink-soft">
          {docModal === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY}
        </div>
      </Modal>
    </AppShell>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { FieldLabel, TextInput } from "@/components/ui/Field";
import { isValidEmail, isValidPassword } from "@/lib/constants";
import {
  requestResetCode,
  resetPassword,
  showToast,
  verifyResetCode,
} from "@/lib/store";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(180);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step !== 2 || expired) return;
    if (seconds <= 0) {
      setExpired(true);
      setCanResend(true);
      return;
    }
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [step, seconds, expired]);

  const emailOk = isValidEmail(email.trim());
  const codeOk = /^\d{6}$/.test(code);
  const passwordOk =
    isValidPassword(password) && password === passwordConfirm && password.length > 0;

  const timerText = useMemo(() => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [seconds]);

  const titles = {
    1: "1 / 3 · 가입한 이메일을 입력해주세요",
    2: "2 / 3 · 이메일로 전송된 인증번호를 입력해주세요",
    3: "3 / 3 · 새 비밀번호를 설정해주세요",
  };

  const footers = {
    1: "화면 1/3 — 이메일 인증 요청",
    2: "화면 2/3 — 인증번호 확인",
    3: "화면 3/3 — 새 비밀번호 설정",
  };

  return (
    <AppShell showNav={false}>
      <PageHeader
        title="비밀번호 찾기"
        subtitle={titles[step]}
        center
        onBack={() => {
          if (step === 1) router.push("/login");
          else setStep((s) => (s === 3 ? 2 : 1));
        }}
      />

      <div className="page-pad mt-8 space-y-4 animate-fade-up">
        {step === 1 && (
          <>
            <div>
              <FieldLabel required>이메일</FieldLabel>
              <TextInput
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="이메일 입력"
                error={error}
              />
            </div>
            <Button
              fullWidth
              disabled={!emailOk || busy}
              onClick={async () => {
                if (!email.trim()) {
                  setError("이메일을 입력해주세요.");
                  return;
                }
                if (!emailOk) {
                  setError("올바른 이메일 형식으로 입력해주세요.");
                  return;
                }
                setBusy(true);
                const result = await requestResetCode(email.trim());
                setBusy(false);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setSeconds(180);
                setExpired(false);
                setCanResend(false);
                setCode("");
                setError("");
                setStep(2);
                showToast("인증번호를 이메일로 보냈어요.");
              }}
            >
              인증번호 받기
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <FieldLabel required>인증번호</FieldLabel>
              <div className="relative">
                <TextInput
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  placeholder="인증번호 6자리 입력"
                  disabled={expired}
                  error={
                    error ||
                    (expired
                      ? "인증번호가 만료되었습니다. 다시 시도해주세요."
                      : undefined)
                  }
                />
                <span className="absolute right-4 top-3 text-sm font-bold text-accent">
                  {timerText}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="text-sm font-bold text-accent disabled:opacity-40"
              disabled={!canResend || busy}
              onClick={async () => {
                setBusy(true);
                const result = await requestResetCode(email.trim());
                setBusy(false);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setCode("");
                setSeconds(180);
                setExpired(false);
                setCanResend(false);
                setError("");
                showToast("인증번호를 다시 보냈어요.");
              }}
            >
              인증번호 재전송
            </button>
            <Button
              fullWidth
              disabled={!codeOk || expired || busy}
              onClick={async () => {
                setBusy(true);
                const result = await verifyResetCode(email.trim(), code);
                setBusy(false);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setError("");
                setStep(3);
              }}
            >
              확인
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <FieldLabel required>새 비밀번호</FieldLabel>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="새 비밀번호 입력 (8자 이상, 영문+숫자)"
                error={
                  password && !isValidPassword(password)
                    ? "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다."
                    : undefined
                }
              />
            </div>
            <div>
              <FieldLabel required>새 비밀번호 확인</FieldLabel>
              <TextInput
                type="password"
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  setError("");
                }}
                placeholder="새 비밀번호 확인"
                error={
                  passwordConfirm && passwordConfirm !== password
                    ? "비밀번호가 일치하지 않습니다."
                    : error || undefined
                }
              />
            </div>
            <Button
              fullWidth
              disabled={!passwordOk || busy}
              onClick={async () => {
                setBusy(true);
                const result = await resetPassword(email.trim(), password);
                setBusy(false);
                if (result && "ok" in result && !result.ok) {
                  setError(result.message || "비밀번호 변경에 실패했습니다.");
                  return;
                }
                showToast("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
                router.push("/login");
              }}
            >
              변경완료
            </Button>
          </>
        )}

        <p className="pt-8 text-center text-xs text-ink-muted">{footers[step]}</p>
      </div>
    </AppShell>
  );
}

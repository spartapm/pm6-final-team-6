"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Illustration from "@/components/ui/Illustration";
import PageHeader from "@/components/ui/PageHeader";
import { TextInput } from "@/components/ui/Field";
import { trackEvent, trackScreenView } from "@/lib/analytics";
import { BRAND, isValidEmail } from "@/lib/constants";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { login } from "@/lib/store";

export default function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/mypage";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    trackScreenView("login");
  }, []);

  const errors = useMemo(() => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = "이메일을 입력해주세요.";
    else if (!isValidEmail(email.trim())) nextErrors.email = "올바른 이메일 형식으로 입력해주세요.";
    if (!password) nextErrors.password = "비밀번호를 입력해주세요.";
    return nextErrors;
  }, [email, password]);

  const canSubmit = Boolean(email.trim() && password);

  return (
    <AppShell showNav={false}>
      <PageHeader title="" backHref="/" />
      <div className="page-pad -mt-2 animate-fade-up">
        <div className="mb-8 text-center">
          <div className="mx-auto flex items-center justify-center">
            <Illustration src={ILLUSTRATIONS.homeHero} alt="ANA" width={120} height={105} priority />
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink">{BRAND}</h1>
          <p className="mt-1 text-sm font-bold text-ink-muted">A Note Archive</p>
          <p className="mt-3 text-sm text-ink-muted">내 피부 고민에 맞는 루틴을 기록해요</p>
        </div>

        <div className="space-y-3">
          <TextInput
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFormError("");
            }}
            placeholder="이메일 입력"
            error={submitted ? errors.email : undefined}
          />
          <TextInput
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFormError("");
            }}
            placeholder="비밀번호 입력"
            error={submitted ? errors.password : undefined}
          />

          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                className="h-4 w-4 accent-sky"
              />
              자동 로그인
            </label>
          </div>

          {formError && (
            <p className="text-[10px] font-medium text-[#ff0000]">{formError}</p>
          )}

          <Button
            fullWidth
            disabled={!canSubmit}
            onClick={async () => {
              setSubmitted(true);
              if (errors.email || errors.password) return;
              const result = await login(email.trim(), password, autoLogin);
              if (!result.ok) {
                setFormError(result.message);
                return;
              }
              trackEvent("login", { method: "email" });
              router.replace(next);
            }}
          >
            로그인
          </Button>

          <p className="pt-2 text-center text-sm text-ink-muted">
            아직 계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="font-extrabold text-ink underline"
              onClick={() => trackEvent("signup_start", { entry_point: "login_screen" })}
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}

import {
  ANTHROPIC_API_KEY,
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
  RESEND_API_KEY,
  RESEND_FROM,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "./secrets";

function required(name: string, value: string) {
  if (!value.trim()) {
    throw new Error(`${name} is not configured`);
  }
  return value.trim();
}

export function getResendApiKey() {
  return required("RESEND_API_KEY", RESEND_API_KEY);
}

export function getResendFrom() {
  return RESEND_FROM.trim() || "ANA <onboarding@resend.dev>";
}

export function getNaverCredentials() {
  return {
    clientId: required("NAVER_CLIENT_ID", NAVER_CLIENT_ID),
    clientSecret: required("NAVER_CLIENT_SECRET", NAVER_CLIENT_SECRET),
  };
}

export function getAnthropicApiKey() {
  return required("ANTHROPIC_API_KEY", ANTHROPIC_API_KEY);
}

export function getSupabaseAdminConfig() {
  return {
    url: SUPABASE_URL,
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
  };
}

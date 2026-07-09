import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ppxjklwepownrdyboaaj.supabase.co";
const supabasePublishableKey = "sb_publishable_mY8ao6sArBB-AooDrwuD8Q_6fma2Swt";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

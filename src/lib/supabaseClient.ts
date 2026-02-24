import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 .env에 설정되어야 합니다.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

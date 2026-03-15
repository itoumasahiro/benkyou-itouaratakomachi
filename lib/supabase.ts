import { createClient } from "@supabase/supabase-js";

// サーバーサイド専用（APIルートで使用）
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

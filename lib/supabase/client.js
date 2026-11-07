
import { createBrowserClient } from "@supabase/ssr";

let supabase;

export function getSupabaseBrowserClient() {
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase URL or publishable key."
    );
  }

  supabase = createBrowserClient(
    supabaseUrl,
    supabasePublishableKey
  );

  return supabase;
}

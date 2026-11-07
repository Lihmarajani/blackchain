import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ApplyLayout({ children }) {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  if (user.app_metadata?.role === "admin") {
    // Admins shouldn't apply, or maybe they can? Let's just allow or redirect them.
    // The instructions say "only authenticated landowners can submit applications".
    // We will redirect admin to dashboard so they don't apply.
    redirect("/admin");
  }

  return <>{children}</>;
}

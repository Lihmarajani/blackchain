"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function cancelApplication(application_number) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: "You must be logged in." };
    }

    const adminSupabase = getSupabaseAdminClient();

    // Verify ownership and status
    const { data: application, error: fetchError } = await adminSupabase
      .from("land_applications")
      .select("status")
      .eq("application_number", application_number)
      .or(`applicant_user_id.eq.${user.id},applicant_email.eq.${user.email}`)
      .maybeSingle();

    if (fetchError || !application) {
      return { error: "Application not found or unauthorized." };
    }

    if (application.status !== "pending") {
      return { error: "Only pending applications can be cancelled." };
    }

    const { error: updateError } = await adminSupabase
      .from("land_applications")
      .update({ status: "cancelled" })
      .eq("application_number", application_number);

    if (updateError) {
      return { error: "Failed to cancel application." };
    }

    return { success: true };
  } catch (error) {
    console.error("Cancel error:", error);
    return { error: "An unexpected error occurred." };
  }
}

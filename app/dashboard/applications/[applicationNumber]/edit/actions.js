"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function updateApplication(application_number, formData) {
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
      .select("*")
      .eq("application_number", application_number)
      .or(`applicant_user_id.eq.${user.id},applicant_email.eq.${user.email}`)
      .maybeSingle();

    if (fetchError || !application) {
      return { error: "Application not found or unauthorized." };
    }

    if (application.status !== "pending") {
      return { error: "Only pending applications can be updated." };
    }

    const updateData = {
      applicant_contact: formData.get("applicant_contact"),
      property_title_number: formData.get("property_title_number"),
      property_location: formData.get("property_location"),
      property_type: formData.get("property_type"),
      land_area: parseFloat(formData.get("land_area")),
      property_description: formData.get("property_description"),
    };

    const document = formData.get("document");
    if (document && document.size > 0) {
      if (document.size > 10485760) {
        return { error: "File size exceeds the 10 MB limit." };
      }
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(document.type)) {
        return { error: "Only PDF, JPG, and PNG files are allowed." };
      }

      const arrayBuffer = await document.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      updateData.document_sha256 = "0x" + hash;

      const document_storage_path = `applications/${application_number}-${Date.now()}-${document.name}`;
      updateData.document_storage_path = document_storage_path;

      const { error: uploadError } = await adminSupabase.storage
        .from("land-documents")
        .upload(document_storage_path, buffer, { contentType: document.type });

      if (uploadError) {
        return { error: "Failed to upload new document." };
      }
    }

    const { error: updateError } = await adminSupabase
      .from("land_applications")
      .update(updateData)
      .eq("application_number", application_number);

    if (updateError) {
      return { error: "Failed to update application details." };
    }

    return { success: true };
  } catch (error) {
    console.error("Update error:", error);
    return { error: "An unexpected error occurred." };
  }
}


"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.app_metadata?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function updateApplicationStatus(
  applicationNumber,
  status,
  notes
) {
  try {
    // 1. Verify administrator authentication
    const user = await verifyAdmin();

    const adminSupabase = getSupabaseAdminClient();

    // 2. Validate application number
    const parsedApplicationNumber = Number(applicationNumber);

    if (
      !Number.isSafeInteger(parsedApplicationNumber) ||
      parsedApplicationNumber <= 0
    ) {
      return { error: "Invalid application number." };
    }

    // 3. Validate status
    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return { error: "Invalid application status." };
    }

    // 4. Update application status
    const now = new Date().toISOString();

    const { data, error } = await adminSupabase
      .from("land_applications")
      .update({
        status,
        staff_notes: notes ?? null,
        reviewed_by: user.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("application_number", parsedApplicationNumber)
      .select("application_number")
      .maybeSingle();

    if (error) {
      console.error("Update application status error:", error);

      return {
        error: "Failed to update application status.",
      };
    }

    if (!data) {
      return { error: "Application not found." };
    }

    return {
      success: true,
      application_number: data.application_number,
    };
  } catch (err) {
    console.error("Update application status error:", err);

    return {
      error:
        err instanceof Error && err.message === "Unauthorized"
          ? "Unauthorized. Administrator access is required."
          : "Failed to update application status.",
    };
  }
}

export async function registerApplicationBlockchain(
  applicationNumber,
  propertyId,
  txHash
) {
  try {
    // 1. Verify administrator authentication
    await verifyAdmin();

    const adminSupabase = getSupabaseAdminClient();

    // 2. Validate application number
    const parsedApplicationNumber = Number(applicationNumber);

    if (
      !Number.isSafeInteger(parsedApplicationNumber) ||
      parsedApplicationNumber <= 0
    ) {
      return { error: "Invalid application number." };
    }

    // 3. Validate blockchain registration details
    if (
      propertyId === undefined ||
      propertyId === null ||
      String(propertyId).trim() === ""
    ) {
      return { error: "Blockchain property ID is required." };
    }

    if (
      typeof txHash !== "string" ||
      !/^0x[a-fA-F0-9]{64}$/.test(txHash)
    ) {
      return { error: "Invalid blockchain transaction hash." };
    }

    // 4. Update blockchain registration details
    const now = new Date().toISOString();

    const { data, error } = await adminSupabase
      .from("land_applications")
      .update({
        status: "registered",
        blockchain_property_id: String(propertyId),
        blockchain_transaction_hash: txHash,
        registered_at: now,
        updated_at: now,
      })
      .eq("application_number", parsedApplicationNumber)
      .select("application_number")
      .maybeSingle();

    if (error) {
      console.error("Register application blockchain error:", error);

      return {
        error: "Failed to update blockchain registration status.",
      };
    }

    if (!data) {
      return { error: "Application not found." };
    }

    return {
      success: true,
      application_number: data.application_number,
    };
  } catch (err) {
    console.error("Register application blockchain error:", err);

    return {
      error:
        err instanceof Error && err.message === "Unauthorized"
          ? "Unauthorized. Administrator access is required."
          : "Failed to update registration status.",
    };
  }
}

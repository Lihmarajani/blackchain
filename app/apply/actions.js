
"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

async function removeSupabaseFile(supabase, path) {
  if (!supabase || !path) return;

  const { error } = await supabase.storage
    .from("land-documents")
    .remove([path]);

  if (error) {
    console.error("Supabase cleanup failed:", error.message);
  }
}

async function unpinFromPinata(cid) {
  if (!cid || !process.env.PINATA_JWT) return;

  try {
    const response = await fetch(
      `https://api.pinata.cloud/pinning/unpin/${encodeURIComponent(cid)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Pinata cleanup failed with status:",
        response.status
      );
    }
  } catch (error) {
    console.error("Pinata cleanup failed:", error.message);
  }
}

async function uploadToPinata(buffer, fileName, contentType, documentId) {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    throw new Error(
      "PINATA_JWT is missing. Configure it in .env.local and restart the server."
    );
  }

  const formData = new FormData();

  const blob = new Blob([buffer], {
    type: contentType,
  });

  formData.append("file", blob, fileName);

  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: `land-document-${documentId}`,
    })
  );

  formData.append(
    "pinataOptions",
    JSON.stringify({
      cidVersion: 1,
    })
  );

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Pinata upload failed:", response.status);

    throw new Error(
      result?.error ||
        result?.message ||
        `Pinata upload failed with HTTP ${response.status}.`
    );
  }

  const cid = result?.IpfsHash;

  if (typeof cid !== "string" || !cid.trim()) {
    throw new Error(
      "Pinata did not return an IPFS CID."
    );
  }

  return cid;
}

export async function submitApplication(formData) {
  let uploadedPath = null;
  let uploadedIpfsCid = null;
  let adminSupabase = null;
  let databaseInsertCompleted = false;

  try {
    // 1. Check Pinata configuration before starting uploads.
    if (!process.env.PINATA_JWT) {
      return {
        error:
          "IPFS is not configured. Add PINATA_JWT to .env.local and restart the development server.",
      };
    }

    // 2. Verify applicant authentication.
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "You must be logged in to submit an application.",
      };
    }

    // 3. Read form fields.
    const applicant_name = formData.get("applicant_name");
    const applicant_email = formData.get("applicant_email");
    const applicant_contact = formData.get("applicant_contact");
    const property_title_number = formData.get("property_title_number");
    const property_location = formData.get("property_location");
    const property_type = formData.get("property_type");
    const land_area = Number(formData.get("land_area"));
    const property_description = formData.get("property_description");
    const document = formData.get("document");

    // 4. Validate required fields.
    if (
      typeof applicant_name !== "string" ||
      !applicant_name.trim() ||
      typeof applicant_email !== "string" ||
      !applicant_email.trim() ||
      typeof applicant_contact !== "string" ||
      !applicant_contact.trim() ||
      typeof property_title_number !== "string" ||
      !property_title_number.trim() ||
      typeof property_location !== "string" ||
      !property_location.trim() ||
      typeof property_type !== "string" ||
      !property_type.trim() ||
      !Number.isFinite(land_area) ||
      land_area <= 0 ||
      typeof property_description !== "string" ||
      !property_description.trim()
    ) {
      return {
        error: "Please complete all required fields correctly.",
      };
    }

    // 5. Validate the uploaded file.
    if (
      !document ||
      typeof document.size !== "number" ||
      document.size === 0
    ) {
      return {
        error: "A supporting document is required.",
      };
    }

    if (document.size > MAX_FILE_SIZE) {
      return {
        error: "File size exceeds the 10 MB limit.",
      };
    }

    if (!ALLOWED_TYPES.includes(document.type)) {
      return {
        error: "Only PDF, JPG, and PNG files are allowed.",
      };
    }

    // 6. Read the actual document bytes.
    const buffer = Buffer.from(await document.arrayBuffer());

    // 7. Calculate SHA-256 as 64 hexadecimal characters.
    const document_sha256 = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    if (!/^[a-fA-F0-9]{64}$/.test(document_sha256)) {
      return {
        error: "Document hash validation failed.",
      };
    }

    // 8. Prepare a unique storage path and document identifier.
    const documentId = crypto.randomUUID();

    const safeFileName = document.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const document_storage_path =
      `applications/${documentId}-${safeFileName}`;

    adminSupabase = getSupabaseAdminClient();

    // 9. Upload to the existing Supabase Storage bucket.
    const { error: storageError } = await adminSupabase.storage
      .from("land-documents")
      .upload(document_storage_path, buffer, {
        contentType: document.type,
        upsert: false,
      });

    if (storageError) {
      console.error("Supabase upload failed:", storageError.message);

      return {
        error: "Failed to upload document to Supabase Storage.",
      };
    }

    uploadedPath = document_storage_path;

    // 10. Upload the same file bytes to Pinata IPFS.
    try {
      uploadedIpfsCid = await uploadToPinata(
        buffer,
        safeFileName,
        document.type,
        documentId
      );
    } catch (error) {
      console.error("IPFS upload failed:", error.message);

      await removeSupabaseFile(adminSupabase, uploadedPath);
      uploadedPath = null;

      return {
        error:
          "The document was saved temporarily, but its IPFS upload failed. Please check your Pinata API key and try again.",
      };
    }

    // 11. Insert the application and both document identifiers.
    const { data: insertedData, error: dbError } =
      await adminSupabase
        .from("land_applications")
        .insert({
          applicant_name: applicant_name.trim(),
          applicant_email: applicant_email.trim(),
          applicant_contact: applicant_contact.trim(),
          property_title_number: property_title_number.trim(),
          property_location: property_location.trim(),
          property_type: property_type.trim(),
          land_area,
          property_description: property_description.trim(),
          document_storage_path,
          document_sha256,
          ipfs_cid: uploadedIpfsCid,
          status: "pending",
          applicant_user_id: user.id,
        })
        .select("application_number, ipfs_cid, document_sha256")
        .single();

    if (dbError) {
      console.error("Application insert failed:", dbError.message);

      await removeSupabaseFile(adminSupabase, uploadedPath);
      uploadedPath = null;

      await unpinFromPinata(uploadedIpfsCid);
      uploadedIpfsCid = null;

      return {
        error:
          "Failed to save application details. Please verify the database schema and try again.",
      };
    }

    databaseInsertCompleted = true;

    // 12. Return real values created during this submission.
    return {
      application_number: insertedData.application_number,
      ipfs_cid: insertedData.ipfs_cid,
      document_sha256: insertedData.document_sha256,
    };
  } catch (error) {
    console.error("Application submission failed:", error.message);

    // Best-effort cleanup for unexpected errors before database insertion.
    if (!databaseInsertCompleted) {
      await removeSupabaseFile(adminSupabase, uploadedPath);
      await unpinFromPinata(uploadedIpfsCid);
    }

    return {
      error:
        "An unexpected error occurred during submission. Please try again.",
    };
  }
}


import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import AdminActions from "./AdminActions";

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  registered: "Registered",
};

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  registered: "bg-violet-100 text-violet-800",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Detail({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium text-slate-900">
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value)}
      </p>
    </div>
  );
}

export default async function ApplicationDetailsPage({ params }) {
  const { applicationNumber } = await params;

  // 1. Verify authentication and administrator role.
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.app_metadata?.role !== "admin") {
    redirect("/admin/login");
  }

  // 2. Retrieve application details after authorization.
  const adminSupabase = getSupabaseAdminClient();

  const { data: application, error } = await adminSupabase
    .from("land_applications")
    .select(`
      application_number,
      applicant_name,
      applicant_email,
      applicant_contact,
      property_title_number,
      property_location,
      property_type,
      land_area,
      property_description,
      document_storage_path,
      document_sha256,
      ipfs_cid,
      status,
      staff_notes,
      blockchain_property_id,
      blockchain_transaction_hash,
      reviewed_by,
      reviewed_at,
      registered_at,
      created_at,
      updated_at
    `)
    .eq("application_number", applicationNumber)
    .maybeSingle();

  if (error) {
    console.error("Failed to load application:", error.message);

    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            Unable to load application
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            The application could not be retrieved. Check the server
            terminal for the database error.
          </p>

          <Link
            href="/admin"
            className="mt-5 inline-block font-medium text-blue-700 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!application) {
    notFound();
  }

  // 3. Generate a temporary link to the Supabase document.
  let documentUrl = null;
  let documentError = null;

  if (application.document_storage_path) {
    const { data: signedDocument, error: storageError } =
      await adminSupabase.storage
        .from("land-documents")
        .createSignedUrl(application.document_storage_path, 60);

    if (storageError) {
      console.error(
        "Failed to create document link:",
        storageError.message
      );

      documentError = "The document link could not be generated.";
    } else {
      documentUrl = signedDocument?.signedUrl ?? null;
    }
  }

  const statusLabel =
    STATUS_LABELS[application.status] || application.status;

  const statusStyle =
    STATUS_STYLES[application.status] ||
    "bg-slate-100 text-slate-700";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          <span aria-hidden="true">←</span>
          Back to dashboard
        </Link>

        {/* Application header */}
        <header className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold tracking-wide text-blue-700">
            LAND VERIFICATION SYSTEM
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Application Details
              </h1>

              <p className="mt-2 break-all text-sm text-slate-500">
                Application No.: {application.application_number}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Submitted {formatDate(application.created_at)}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusStyle}`}
            >
              {statusLabel}
            </span>
          </div>
        </header>

        {/* Applicant and property information */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Applicant Information
            </h2>

            <div className="mt-3">
              <Detail
                label="Full Name"
                value={application.applicant_name}
              />
              <Detail
                label="Email Address"
                value={application.applicant_email}
              />
              <Detail
                label="Contact Number"
                value={application.applicant_contact}
              />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Property Information
            </h2>

            <div className="mt-3">
              <Detail
                label="Title Number"
                value={application.property_title_number}
              />
              <Detail
                label="Property Location"
                value={application.property_location}
              />
              <Detail
                label="Property Type"
                value={application.property_type}
              />
              <Detail
                label="Land Area"
                value={
                  application.land_area != null
                    ? application.land_area
                    : null
                }
              />
              <Detail
                label="Property Description"
                value={application.property_description}
              />
            </div>
          </section>
        </div>

        {/* Submitted document */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Submitted Document
          </h2>

          <div className="mt-4">
            <p className="text-sm text-slate-500">
              SHA-256 Document Hash
            </p>

            <p className="mt-2 break-all rounded-lg bg-slate-50 p-4 font-mono text-sm text-slate-700">
              {application.document_sha256 ||
                "No document hash recorded"}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700">
              IPFS Content Identifier (CID)
            </p>

            <p className="mt-2 break-all rounded-lg bg-slate-50 p-4 font-mono text-sm text-slate-700">
              {application.ipfs_cid || "No IPFS CID recorded"}
            </p>

            {application.ipfs_cid && (
              <button
                type="button"
                onClick={undefined}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
            )}
          </div>

          <div className="mt-4">
            {documentUrl ? (
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Open Submitted Document
              </a>
            ) : (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                {documentError ||
                  "No document storage path is recorded for this application."}
              </p>
            )}
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            The signed Supabase document link expires after 60 seconds.
            The SHA-256 hash helps verify file integrity. The IPFS CID
            identifies the content stored on IPFS; neither value alone
            proves legal authenticity or ownership.
          </p>
        </section>

        {/* Review and blockchain information */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Review and Blockchain Information
          </h2>

          <div className="mt-3">
            <Detail
              label="Administrator Notes"
              value={application.staff_notes}
            />
            <Detail
              label="Reviewed By"
              value={application.reviewed_by}
            />
            <Detail
              label="Reviewed At"
              value={formatDate(application.reviewed_at)}
            />
            <Detail
              label="Registered At"
              value={formatDate(application.registered_at)}
            />
            <Detail
              label="Blockchain Property ID"
              value={application.blockchain_property_id}
            />
            <Detail
              label="Blockchain Transaction Hash"
              value={application.blockchain_transaction_hash}
            />
            <Detail
              label="Last Updated"
              value={formatDate(application.updated_at)}
            />
          </div>

          {application.blockchain_transaction_hash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${encodeURIComponent(
                application.blockchain_transaction_hash
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:underline"
            >
              View transaction on Sepolia Etherscan ↗
            </a>
          )}
        </section>

        {/* Passes ipfs_cid and the other selected fields to the client component. */}
        <AdminActions application={application} />

        <footer className="mt-6 text-center text-xs text-slate-500">
          Land Verification System · Administrator Portal
        </footer>
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import CancelApplicationButton from "./CancelApplicationButton";

export const dynamic = "force-dynamic";

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
    <div className="border-b border-gray-100 py-4 last:border-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words font-medium text-gray-900">
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </p>
    </div>
  );
}

export default async function ApplicantApplicationDetailsPage({ params }) {
  const { applicationNumber } = await params;

  const supabase = await getSupabaseServerClient();
  const adminSupabase = getSupabaseAdminClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the application. Make sure to enforce ownership!
  const { data: application, error } = await adminSupabase
    .from("land_applications")
    .select("*")
    .eq("application_number", applicationNumber)
    .eq("applicant_user_id", user.id) // Server-side ownership verification
    .maybeSingle();

  if (error) {
    console.error("Failed to load application:", error.message);
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">Unable to load application</h1>
          <p className="mt-2 text-sm text-gray-600">Please try again later.</p>
        </div>
      </main>
    );
  }

  if (!application) {
    notFound(); // Will show 404 if it doesn't exist or doesn't belong to the user
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <span aria-hidden="true">←</span> Back to dashboard
        </Link>

        <header className="mt-8 border-b border-slate-200 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-tight text-slate-900 sm:text-3xl">Application Details</h1>
              <p className="mt-2 break-all text-sm text-slate-500">Application No.: {application.application_number}</p>
              <p className="mt-1 text-sm text-slate-500">Submitted {formatDate(application.created_at)}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className="w-fit rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-700 uppercase tracking-wider border border-slate-200">
                {application.status.replace("_", " ")}
              </span>
              {application.status === "pending" && (
                <div className="flex flex-col items-end gap-2 mt-2">
                  <Link href={`/dashboard/applications/${application.application_number}/edit`} className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 w-full sm:w-auto">
                    Edit Application
                  </Link>
                  <div className="w-full sm:w-auto">
                    <CancelApplicationButton applicationNumber={application.application_number} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-light text-slate-900 border-b border-slate-100 pb-2">Property Information</h2>
            <div className="mt-4 space-y-1">
              <Detail label="Title Number" value={application.property_title_number} />
              <Detail label="Location" value={application.property_location} />
              <Detail label="Type" value={application.property_type} />
              <Detail label="Land Area" value={application.land_area ? `${application.land_area} sqm` : null} />
              <Detail label="Description" value={application.property_description} />
            </div>
          </section>

          <section className="flex flex-col gap-8">
            <div>
              <h2 className="text-lg font-light text-slate-900 border-b border-slate-100 pb-2">Staff Feedback</h2>
              <div className="mt-4 rounded-md bg-slate-50 p-4 border border-slate-100">
                {application.staff_notes ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{application.staff_notes}</p>
                ) : (
                  <p className="text-sm text-slate-500 italic">No notes from staff yet.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-light text-slate-900 border-b border-slate-100 pb-2">Blockchain Status</h2>
              <div className="mt-4 space-y-1">
                <Detail label="Property ID" value={application.blockchain_property_id} />
                <Detail label="Transaction Hash" value={application.blockchain_transaction_hash} />
                {application.blockchain_transaction_hash && (
                  <a href={`https://sepolia.etherscan.io/tx/${application.blockchain_transaction_hash}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600">
                    View on Etherscan ↗
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

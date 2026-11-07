import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import EditApplicationForm from "./EditApplicationForm";

export const dynamic = "force-dynamic";

export default async function EditApplicationPage({ params }) {
  const { applicationNumber } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the application. Enforce ownership by email fallback if needed, or by applicant_user_id.
  const adminSupabase = getSupabaseAdminClient();
  const { data: application, error } = await adminSupabase
    .from("land_applications")
    .select("*")
    .eq("application_number", applicationNumber)
    .or(`applicant_user_id.eq.${user.id},applicant_email.eq.${user.email}`)
    .maybeSingle();

  if (error || !application) {
    notFound();
  }

  if (application.status !== "pending") {
    // Only pending applications can be edited
    redirect(`/dashboard/applications/${applicationNumber}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href={`/dashboard/applications/${applicationNumber}`} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
          <span aria-hidden="true">←</span> Back to Application Details
        </Link>
        
        <header className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Edit Application</h1>
          <p className="mt-2 text-sm text-gray-500">Application No.: {application.application_number}</p>
        </header>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <EditApplicationForm application={application} />
        </div>
      </div>
    </main>
  );
}

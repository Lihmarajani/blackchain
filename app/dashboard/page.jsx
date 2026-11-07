import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logout } from "../auth/actions";
import ApplicationListClient from "./ApplicationListClient";

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const adminSupabase = getSupabaseAdminClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Ensure this user is not an admin logging in here
  if (user.app_metadata?.role === "admin") {
    redirect("/admin");
  }

  // Fetch applications for the authenticated user
  // Because RLS is active or we filter explicitly
  const { data: applications, error: appsError } = await adminSupabase
    .from("land_applications")
    .select("application_number, property_title_number, property_location, property_type, status, created_at")
    .eq("applicant_user_id", user.id)
    .order("created_at", { ascending: false });

  if (appsError) {
    console.error("Failed to load applications:", appsError.message);
  }

  const appList = applications || [];

  const stats = {
    total: appList.length,
    pending: appList.filter((a) => a.status === "pending").length,
    under_review: appList.filter((a) => a.status === "under_review").length,
    approved: appList.filter((a) => a.status === "approved").length,
    rejected: appList.filter((a) => a.status === "rejected").length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-amber-700 bg-amber-50';
      case 'under_review': return 'text-blue-700 bg-blue-50';
      case 'approved': return 'text-emerald-700 bg-emerald-50';
      case 'rejected': return 'text-red-700 bg-red-50';
      case 'registered': return 'text-violet-700 bg-violet-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-slate-900 sm:text-3xl">
              Applicant Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {user.user_metadata?.full_name || user.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/apply" className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800">
              Submit New Application
            </Link>
            <form action={logout}>
              <button type="submit" className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900">
                Log out
              </button>
            </form>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Total Applications", count: stats.total },
            { label: "Pending", count: stats.pending },
            { label: "Under Review", count: stats.under_review },
            { label: "Approved", count: stats.approved },
            { label: "Rejected", count: stats.rejected },
          ].map((stat, idx) => (
            <article key={idx} className="flex flex-col border-l-2 border-slate-200 pl-4 py-2">
              <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-light text-slate-900">{stat.count}</p>
            </article>
          ))}
        </section>

        <ApplicationListClient initialApplications={appList} />
      </div>
    </main>
  );
}

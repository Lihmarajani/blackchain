import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "pending", label: "Pending", color: "text-amber-700" },
  { value: "under_review", label: "Under Review", color: "text-blue-700" },
  { value: "approved", label: "Approved", color: "text-emerald-700" },
  { value: "rejected", label: "Rejected", color: "text-red-700" },
  { value: "registered", label: "Registered", color: "text-violet-700" },
  { value: "cancelled", label: "Cancelled", color: "text-gray-700" },
];

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

export default async function AdminDashboardPage({ searchParams }) {
  const params = await searchParams;
  const statusFilter = params?.status || "all";
  const typeFilter = params?.type || "all";
  const searchFilter = params?.search || "";
  const page = parseInt(params?.page || "1", 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || user.app_metadata?.role !== "admin") {
    redirect("/admin/login");
  }

  const adminSupabase = getSupabaseAdminClient();

  // Fetch stats (totals by status)
  const countResults = await Promise.all(
    STATUSES.map(async (st) => {
      const { count } = await adminSupabase
        .from("land_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", st.value);
      return { status: st.value, count: count ?? 0 };
    })
  );
  const totalApplications = countResults.reduce((acc, curr) => acc + curr.count, 0);

  // Build query for applications
  let query = adminSupabase
    .from("land_applications")
    .select("application_number, applicant_name, property_title_number, property_location, status, created_at", { count: "exact" });

  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (typeFilter !== "all") query = query.eq("property_type", typeFilter);
  if (searchFilter) {
    query = query.or(`application_number.ilike.%${searchFilter}%,applicant_name.ilike.%${searchFilter}%,property_title_number.ilike.%${searchFilter}%`);
  }

  const { data: applications, error: applicationsError, count: filteredCount } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const totalPages = Math.ceil((filteredCount || 0) / limit);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-700">LAND VERIFICATION SYSTEM</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Administrator Dashboard</h1>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="mt-1 font-medium text-slate-900">{user.email}</p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((st) => {
            const result = countResults.find((item) => item.status === st.value);
            return (
              <article key={st.value} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{st.label}</p>
                <p className={`mt-3 text-3xl font-bold ${st.color}`}>{result?.count ?? 0}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Applications</h2>
            <form className="flex flex-wrap gap-3">
              <input type="text" name="search" defaultValue={searchFilter} placeholder="Search applications..." className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <select name="status" defaultValue={statusFilter} className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="registered">Registered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select name="type" defaultValue={typeFilter} className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
                <option value="all">All Types</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="agricultural">Agricultural</option>
                <option value="industrial">Industrial</option>
              </select>
              <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">Filter</button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3 font-medium">Application No.</th>
                  <th className="px-3 py-3 font-medium">Applicant</th>
                  <th className="px-3 py-3 font-medium">Title No.</th>
                  <th className="px-3 py-3 font-medium">Location</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Submitted</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications?.map((app) => (
                  <tr key={app.application_number} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-4 font-medium text-slate-900">{app.application_number}</td>
                    <td className="px-3 py-4 text-slate-700">{app.applicant_name}</td>
                    <td className="px-3 py-4 text-slate-700">{app.property_title_number}</td>
                    <td className="px-3 py-4 text-slate-700">{app.property_location}</td>
                    <td className="px-3 py-4 font-semibold uppercase text-xs tracking-wider">
                      {app.status.replace("_", " ")}
                    </td>
                    <td className="px-3 py-4 text-slate-600">{formatDate(app.created_at)}</td>
                    <td className="px-3 py-4">
                      <Link href={`/admin/applications/${app.application_number}`} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {applications?.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-slate-500">No applications found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/admin?page=${page - 1}&status=${statusFilter}&type=${typeFilter}&search=${searchFilter}`} className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Previous</Link>
                )}
                {page < totalPages && (
                  <Link href={`/admin?page=${page + 1}&status=${statusFilter}&type=${typeFilter}&search=${searchFilter}`} className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Next</Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

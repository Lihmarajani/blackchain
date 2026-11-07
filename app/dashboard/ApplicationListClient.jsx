"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

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

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'text-amber-700 bg-amber-50';
    case 'under_review': return 'text-blue-700 bg-blue-50';
    case 'approved': return 'text-emerald-700 bg-emerald-50';
    case 'rejected': return 'text-red-700 bg-red-50';
    case 'registered': return 'text-violet-700 bg-violet-50';
    case 'cancelled': return 'text-gray-700 bg-gray-100';
    default: return 'text-gray-700 bg-gray-50';
  }
};

export default function ApplicationListClient({ initialApplications }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredApps = initialApplications.filter((app) => {
    const matchesSearch = 
      String(app.application_number || "").toLowerCase().includes(search.toLowerCase()) ||
      String(app.property_title_number || "").toLowerCase().includes(search.toLowerCase()) ||
      String(app.property_location || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-light text-slate-900">Your Applications</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search applications..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-md border border-slate-300 pl-9 pr-4 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 bg-white"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-900 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="registered">Registered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
          <p className="text-sm text-slate-500">No applications match your search criteria.</p>
          {initialApplications.length === 0 && (
            <Link href="/apply" className="mt-4 inline-block text-sm font-medium text-slate-900 underline hover:text-slate-600">
              Start your first application
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500">
                <th className="py-3 pr-3 font-medium">Application No.</th>
                <th className="px-3 py-3 font-medium">Title No.</th>
                <th className="px-3 py-3 font-medium">Location</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Submitted</th>
                <th className="pl-3 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.application_number} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 pr-3 font-medium text-slate-900">{app.application_number}</td>
                  <td className="px-3 py-4 text-slate-700">{app.property_title_number}</td>
                  <td className="px-3 py-4 text-slate-700">{app.property_location}</td>
                  <td className="px-3 py-4 text-slate-700">{app.property_type}</td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(app.status)} ring-opacity-20`}>
                      {app.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-slate-600">{formatDate(app.created_at)}</td>
                  <td className="pl-3 py-4 text-right">
                    <Link href={`/dashboard/applications/${app.application_number}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

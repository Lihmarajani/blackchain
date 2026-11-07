"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateApplication } from "./actions";

export default function EditApplicationForm({ application }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const result = await updateApplication(application.application_number, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/dashboard/applications/${application.application_number}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="applicant_contact" className="mb-2 block text-sm font-medium text-gray-700">Contact Number</label>
          <input type="text" id="applicant_contact" name="applicant_contact" defaultValue={application.applicant_contact} required className="w-full rounded-lg border border-gray-300 p-2.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
        </div>
        <div>
          <label htmlFor="property_title_number" className="mb-2 block text-sm font-medium text-gray-700">Title Number</label>
          <input type="text" id="property_title_number" name="property_title_number" defaultValue={application.property_title_number} required className="w-full rounded-lg border border-gray-300 p-2.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
        </div>
        <div>
          <label htmlFor="property_location" className="mb-2 block text-sm font-medium text-gray-700">Location</label>
          <input type="text" id="property_location" name="property_location" defaultValue={application.property_location} required className="w-full rounded-lg border border-gray-300 p-2.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
        </div>
        <div>
          <label htmlFor="property_type" className="mb-2 block text-sm font-medium text-gray-700">Property Type</label>
          <select id="property_type" name="property_type" defaultValue={application.property_type} required className="w-full rounded-lg border border-gray-300 p-2.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600">
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="agricultural">Agricultural</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>
        <div>
          <label htmlFor="land_area" className="mb-2 block text-sm font-medium text-gray-700">Land Area (sqm)</label>
          <input type="number" step="0.01" id="land_area" name="land_area" defaultValue={application.land_area} required className="w-full rounded-lg border border-gray-300 p-2.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
        </div>
      </div>
      <div>
        <label htmlFor="property_description" className="mb-2 block text-sm font-medium text-gray-700">Description</label>
        <textarea id="property_description" name="property_description" defaultValue={application.property_description || ""} className="w-full rounded-lg border border-gray-300 p-2.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" rows="3"></textarea>
      </div>
      <div>
        <label htmlFor="document" className="mb-2 block text-sm font-medium text-gray-700">Replace Supporting Document (Optional)</label>
        <input type="file" id="document" name="document" accept=".pdf, .jpg, .jpeg, .png" className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 bg-white text-slate-900" />
        <p className="mt-1 text-xs text-gray-500">Max 10 MB. Allowed: PDF, JPG, PNG.</p>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

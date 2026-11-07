"use client";

import { useState } from "react";
import Link from "next/link";
import { submitApplication } from "./actions";

export default function ApplyPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.target);

    try {
      const result = await submitApplication(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(
          <>
            Application submitted successfully! Application No: <strong>{result.application_number}</strong>.{" "}
            <Link href="/dashboard" className="underline font-semibold">View in Dashboard</Link>
          </>
        );
        event.target.reset();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-900">
          ← Back to Home
        </Link>
        <header className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Submit a Property Application
          </h1>
          <p className="mt-3 text-slate-600">
            Provide your property details and supporting documents for staff review.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {message && (
            <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-emerald-800 border border-emerald-200">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Full Name</label>
                <input required name="applicant_name" type="text" className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 bg-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Email</label>
                <input required name="applicant_email" type="email" className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 bg-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Contact Number</label>
                <input required name="applicant_contact" type="text" className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 bg-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Property Title Number</label>
                <input required name="property_title_number" type="text" className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 bg-white" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Property Location</label>
              <input required name="property_location" type="text" className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 bg-white" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Property Type</label>
                <select required name="property_type" className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 bg-white">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Land Area (sqm)</label>
                <input required name="land_area" type="number" step="0.01" className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 bg-white" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Property Description</label>
              <textarea required name="property_description" rows={3} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 bg-white"></textarea>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Supporting Document (PDF, JPG, PNG - Max 10MB)</label>
              <input required name="document" type="file" accept="application/pdf,image/jpeg,image/png" className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 bg-white" />
            </div>

            <button disabled={loading} type="submit" className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

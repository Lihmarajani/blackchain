"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPasswordForEmail } from "../auth/actions";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(event.target);
    const result = await resetPasswordForEmail(formData);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 text-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
          <p className="mt-2 text-sm text-slate-600">Enter your email to receive a password reset link.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
            If an account with that email exists, a reset link has been sent. Please check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Email Address</label>
              <input required name="email" type="email" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
            </div>

            <button disabled={loading} type="submit" className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/login" className="font-semibold text-blue-700 hover:underline">Return to login</Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { updatePassword } from "../auth/actions";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.target);
    const password = formData.get("password");
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const result = await updatePassword(formData);
    
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
          <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
          <p className="mt-2 text-sm text-slate-600">Enter your new secure password.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
            Your password has been updated successfully. <Link href="/login" className="font-semibold underline">Login now</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">New Password</label>
              <div className="relative">
                <input required name="password" type={showPassword ? "text" : "password"} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pr-10 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

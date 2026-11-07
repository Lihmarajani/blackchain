"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { login } from "../auth/actions";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.target);
    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // if successful, the server action will redirect
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Landowner Login</h1>
          <p className="mt-2 text-sm text-gray-600">Access your verification dashboard</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">Email Address</label>
            <input required name="email" type="email" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-800">Password</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-700 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input required name="password" type={showPassword ? "text" : "password"} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account? <Link href="/register" className="font-semibold text-blue-700 hover:underline">Register here</Link>
        </p>
      </div>
    </main>
  );
}

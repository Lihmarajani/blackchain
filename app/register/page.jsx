"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { register } from "../auth/actions";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(event.target);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const result = await register(formData);
    
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
      event.target.reset();
    }
    
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 text-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create an Account</h1>
          <p className="mt-2 text-sm text-gray-600">Register to submit property applications</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
            Registration successful! Please <Link href="/login" className="font-semibold underline">login here</Link>. If email confirmation is enabled, check your inbox.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">Full Name</label>
            <input required name="fullName" type="text" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">Email Address</label>
            <input required name="email" type="email" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">Password</label>
            <div className="relative">
              <input required name="password" type={showPassword ? "text" : "password"} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">Confirm Password</label>
            <div className="relative">
              <input required name="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link href="/login" className="font-semibold text-blue-700 hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}

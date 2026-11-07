"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function login(formData) {
  const supabase = await getSupabaseServerClient();
  const email = formData.get("email");
  const password = formData.get("password");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function register(formData) {
  const supabase = await getSupabaseServerClient();
  const email = formData.get("email");
  const password = formData.get("password");
  const fullName = formData.get("fullName");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPasswordForEmail(formData) {
  const supabase = await getSupabaseServerClient();
  const email = formData.get("email");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // In production, configure the redirect URL properly
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}

export async function updatePassword(formData) {
  const supabase = await getSupabaseServerClient();
  const password = formData.get("password");

  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
}

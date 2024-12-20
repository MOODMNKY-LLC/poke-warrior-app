"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const familyName = formData.get("family_name")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !familyName) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email, password, and family name are required",
    );
  }

  // First check if a profile already exists with this family name
  const { data: existingProfile } = await supabase
    .from('family_profiles')
    .select('family_name')
    .eq('family_name', familyName)
    .single()

  if (existingProfile) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "This family name is already taken. Please choose another.",
    )
  }

  // Proceed with user creation
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        family_name: familyName
      }
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  // Create initial family profile if user was created
  if (data?.user) {
    // First check if a profile already exists for this user
    const { data: existingUserProfile } = await supabase
      .from('family_profiles')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (existingUserProfile) {
      console.log('Profile already exists for user')
      return encodedRedirect(
        "success",
        "/sign-up",
        "Thanks for signing up! Please check your email for a verification link.",
      )
    }

    // Create new profile if one doesn't exist
    const { error: profileError } = await supabase
      .from('family_profiles')
      .insert({
        id: data.user.id,
        family_name: familyName,
        timezone: 'UTC',
        locale: 'en',
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Failed to create family profile:', profileError)
      // If profile creation fails, we should clean up the auth user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id)
      if (deleteError) console.error('Failed to clean up auth user:', deleteError)
      
      return encodedRedirect(
        "error",
        "/sign-up",
        "Failed to create family profile. Please try again."
      )
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  )
}

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

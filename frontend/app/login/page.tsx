"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Mail, ArrowRight, Info, X } from "lucide-react";

import { loginSchema, LoginSchema } from "@/lib/validation";
import { apiLogin, ApiRequestError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Navbar } from "@/components/ui/Navbar";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [serverError, setServerError] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
  });

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setInfoBanner("Registration completed successfully! Please sign in with your credentials.");
    } else if (searchParams.get("logged_out") === "1") {
      setInfoBanner("You have been safely signed out of your patient portal session.");
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginSchema) => {
    setServerError(null);

    try {
      await apiLogin({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        remember_me: data.remember_me,
      });

      // Session established via HttpOnly cookie; redirect to protected dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      // Clear password field on failed attempt
      setValue("password", "");

      if (err instanceof ApiRequestError) {
        setServerError(err.message);
      } else {
        setServerError("Invalid email address or password. Please try again.");
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-teal-700 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Patient Portal Sign In
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your authorized patient credentials to access your secure portal.
        </p>
      </div>

      {/* Info / Notification Banners */}
      {infoBanner && (
        <div className="mb-5">
          <Alert variant="success" onClose={() => setInfoBanner(null)}>
            {infoBanner}
          </Alert>
        </div>
      )}

      {/* Error Banner */}
      {serverError && (
        <div className="mb-5">
          <Alert
            variant="error"
            title="Authentication Failed"
            onClose={() => setServerError(null)}
          >
            {serverError}
          </Alert>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" aria-label="Sign In Form">
        <Input
          label="Email Address"
          type="email"
          required
          placeholder="name@example.com"
          autoComplete="username"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="space-y-1">
          <PasswordInput
            label="Password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-teal-700 focus:ring-teal-600 w-4 h-4"
              {...register("remember_me")}
            />
            <span>Remember this device</span>
          </label>

          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-teal-700 hover:text-teal-800 font-semibold focus:outline-none focus:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Authenticating..."
            disabled={isSubmitting}
            className="w-full"
          >
            Sign In to Patient Portal
          </Button>
        </div>
      </form>

      {/* Signup Redirection */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
        New to the patient portal?{" "}
        <Link
          href="/signup"
          className="font-semibold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1"
        >
          Create an account
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-lg border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-teal-800 font-semibold text-sm">
                <Info className="w-4 h-4" />
                <span>Password Recovery Assistance</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              For privacy and patient verification, self-service automated password resets are scheduled for our upcoming release. If you require immediate access, please contact our clinic support desk directly at <span className="font-semibold text-slate-800">+1 (800) 555-CARE</span> or speak with your clinic reception.
            </p>
            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowForgotModal(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="text-xs text-slate-400">Loading sign-in...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}

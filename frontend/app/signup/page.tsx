"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  HeartPulse,
  Languages,
  CheckCircle2,
  FileText,
  ArrowRight,
} from "lucide-react";

import { registerSchema, RegisterSchema } from "@/lib/validation";
import { apiRegister, ApiRequestError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PasswordRequirementList } from "@/components/auth/PasswordRequirementList";
import { Navbar } from "@/components/ui/Navbar";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other / Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Spanish", label: "Español (Spanish)" },
  { value: "French", label: "Français (French)" },
];

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      gender: "prefer_not_to_say",
      medical_condition: "",
      preferred_language: "English",
      password: "",
      confirm_password: "",
    },
  });

  const passwordValue = watch("password", "");
  const confirmPasswordValue = watch("confirm_password", "");
  const medicalConditionValue = watch("medical_condition", "");

  const onSubmit = async (data: RegisterSchema) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      await apiRegister({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim().toLowerCase(),
        gender: data.gender,
        medical_condition: data.medical_condition?.trim() || undefined,
        preferred_language: data.preferred_language,
        password: data.password,
        confirm_password: data.confirm_password,
      });

      setSuccessMessage(
        "Account successfully created! Redirecting you to the secure login page..."
      );

      // Short delay to allow patient to perceive successful registration
      setTimeout(() => {
        router.push("/login?registered=1");
      }, 1200);
    } catch (err: unknown) {
      // Clear password fields on failure while preserving valid profile values
      resetField("password");
      resetField("confirm_password");

      if (err instanceof ApiRequestError) {
        setServerError(err.message);
      } else {
        setServerError("An unexpected error occurred during registration. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Healthcare Trust & Information Panel (Desktop) */}
          <div className="lg:col-span-4 bg-teal-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 lg:sticky lg:top-24">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-600/40 text-teal-100 text-xs font-semibold">
                <HeartPulse className="w-3.5 h-3.5 text-teal-300" />
                <span>Patient Registration</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Your Health Journey Starts Here
              </h1>
              <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                Create a confidential patient account to access medical records, manage personal care
                preferences, and stay connected with your healthcare providers.
              </p>
            </div>

            <div className="space-y-4 border-t border-teal-700/60 pt-6">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center shrink-0 text-teal-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-white">Confidential & Protected</h2>
                  <p className="text-[11px] text-teal-200/90 leading-normal">
                    Industry-standard Argon2id hashing and strict privacy controls protect your medical and personal data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center shrink-0 text-teal-200">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-white">Multilingual Communication</h2>
                  <p className="text-[11px] text-teal-200/90 leading-normal">
                    Select your preferred language (English or हिन्दी) for consultations and updates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center shrink-0 text-teal-200">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-white">Personal Health Notes</h2>
                  <p className="text-[11px] text-teal-200/90 leading-normal">
                    Safely note existing conditions or allergies for your care team.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-teal-700/60 pt-4 text-xs text-teal-200 flex items-center justify-between">
              <span>Already registered?</span>
              <Link
                href="/login"
                className="font-semibold text-white hover:underline flex items-center gap-1 text-xs"
              >
                Sign in here
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8">
            <div className="border-b border-slate-200 pb-5 mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Create Patient Account
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please complete the required details below. All fields marked with an asterisk (
                <span className="text-rose-500">*</span>) are mandatory.
              </p>
            </div>

            {/* Error & Success Feedback */}
            {serverError && (
              <div className="mb-6">
                <Alert
                  variant="error"
                  title="Registration Failed"
                  onClose={() => setServerError(null)}
                >
                  {serverError}
                </Alert>
              </div>
            )}

            {successMessage && (
              <div className="mb-6">
                <Alert variant="success" title="Success!">
                  {successMessage}
                </Alert>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-6"
              aria-label="Patient Registration Form"
            >
              {/* Section 1: Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800 pb-1 border-b border-slate-100">
                  <User className="w-3.5 h-3.5" />
                  <span>Personal Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    required
                    placeholder="e.g. Jane"
                    autoComplete="given-name"
                    error={errors.first_name?.message}
                    {...register("first_name")}
                  />
                  <Input
                    label="Last Name"
                    required
                    placeholder="e.g. Doe"
                    autoComplete="family-name"
                    error={errors.last_name?.message}
                    {...register("last_name")}
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="name@example.com"
                  autoComplete="username"
                  leftIcon={<Mail className="w-4 h-4" />}
                  helperText="We will use this address for your portal login and clinical notices."
                  error={errors.email?.message}
                  {...register("email")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Gender"
                        required
                        options={GENDER_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.gender?.message}
                      />
                    )}
                  />

                  <Controller
                    name="preferred_language"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Preferred Language"
                        required
                        options={LANGUAGE_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        helperText="Language for consultation and documents."
                        error={errors.preferred_language?.message}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Section 2: Medical Profile */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800 pb-1 border-b border-slate-100">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Medical Profile (Optional)</span>
                </div>

                <Textarea
                  label="Relevant Medical Conditions & Allergies"
                  placeholder="e.g., Penicillin allergy, Hypertension, Asthma, or enter 'None'."
                  rows={3}
                  maxLength={2000}
                  value={medicalConditionValue}
                  helperText="Briefly describe known allergies, current chronic conditions, or ongoing treatments. Your care team uses this to personalize care."
                  error={errors.medical_condition?.message}
                  {...register("medical_condition")}
                />
              </div>

              {/* Section 3: Account Security */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800 pb-1 border-b border-slate-100">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Account Security</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PasswordInput
                    label="Password"
                    required
                    autoComplete="new-password"
                    placeholder="Create strong password"
                    error={errors.password?.message}
                    {...register("password")}
                  />

                  <PasswordInput
                    label="Confirm Password"
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    error={errors.confirm_password?.message}
                    {...register("confirm_password")}
                  />
                </div>

                {/* Password Requirements Checklist */}
                <PasswordRequirementList
                  password={passwordValue}
                  confirmPassword={confirmPasswordValue}
                  showMatchStatus={true}
                />
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500 text-center sm:text-left">
                  By registering, you agree to receive healthcare communications and confirm your medical information is accurate.
                </p>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Creating Account..."
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  Create Patient Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

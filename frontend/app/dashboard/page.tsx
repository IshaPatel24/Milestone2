"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Languages,
  HeartPulse,
  ShieldCheck,
  Calendar,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { Patient } from "@/types";
import { apiGetMe, apiLogout, ApiRequestError } from "@/lib/api";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        setIsLoading(true);
        const data = await apiGetMe();
        if (isMounted) {
          setPatient(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof ApiRequestError && err.status === 401) {
          // Unauthenticated -> redirect to login
          router.replace("/login");
        } else {
          setError("Failed to load your patient profile. Please refresh or sign in again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await apiLogout();
      router.replace("/login?logged_out=1");
    } catch {
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatGender = (gender: string | null) => {
    if (!gender) return "Not specified";
    switch (gender) {
      case "male":
        return "Male";
      case "female":
        return "Female";
      case "other":
        return "Other / Non-binary";
      case "prefer_not_to_say":
        return "Prefer not to say";
      default:
        return gender;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Verifying secure patient session...
          </p>
        </main>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-rose-200 rounded-xl p-6 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Session Error</h2>
            <p className="text-xs text-slate-600">{error || "Unable to retrieve patient data."}</p>
            <Button variant="primary" size="sm" onClick={() => router.push("/login")}>
              Return to Login
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar patientName={`${patient.first_name} ${patient.last_name}`} isDashboard={true} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Active Authenticated Session</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {patient.first_name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Your patient portal account is active. Manage your profile and care settings below.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-600" />}
              isLoading={isLoggingOut}
              onClick={handleLogout}
              className="text-slate-700 hover:text-rose-700 hover:border-rose-300 w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Profile Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Full Name */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Patient Name</span>
              <User className="w-4 h-4 text-teal-700" />
            </div>
            <p className="text-base font-bold text-slate-900 truncate">
              {patient.first_name} {patient.last_name}
            </p>
            <p className="text-[11px] text-slate-500">Patient ID: #{patient.id.toString().padStart(5, "0")}</p>
          </div>

          {/* Card 2: Email */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Email Address</span>
              <Mail className="w-4 h-4 text-teal-700" />
            </div>
            <p className="text-base font-bold text-slate-900 truncate">{patient.email}</p>
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Identity
            </p>
          </div>

          {/* Card 3: Gender & Demographics */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Gender</span>
              <User className="w-4 h-4 text-teal-700" />
            </div>
            <p className="text-base font-bold text-slate-900 capitalize">
              {formatGender(patient.gender)}
            </p>
            <p className="text-[11px] text-slate-500">Recorded demographics</p>
          </div>

          {/* Card 4: Preferred Language */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Language</span>
              <Languages className="w-4 h-4 text-teal-700" />
            </div>
            <p className="text-base font-bold text-slate-900">{patient.preferred_language}</p>
            <p className="text-[11px] text-slate-500">Clinical communication preference</p>
          </div>
        </div>

        {/* Sensitive Medical Notes Section (Privacy Protected) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-700" />
                <h2 className="text-base font-bold text-slate-900">
                  Recorded Medical Conditions & Allergies
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  Confidential Data
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Medical details are masked by default to protect your privacy in open environments.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={
                showMedicalInfo ? (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                )
              }
              onClick={() => setShowMedicalInfo((prev) => !prev)}
            >
              {showMedicalInfo ? "Hide Medical Info" : "View Medical Info"}
            </Button>
          </div>

          {showMedicalInfo ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 sm:p-5 text-xs sm:text-sm text-slate-800 leading-relaxed transition-all">
              {patient.medical_condition ? (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700">Patient Notes on File:</p>
                  <p className="whitespace-pre-wrap text-slate-800 bg-white p-3.5 rounded-lg border border-slate-200">
                    {patient.medical_condition}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  No specific chronic conditions or allergies were recorded during registration.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50/70 border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              <p>Medical notes are currently masked for privacy. Click &ldquo;View Medical Info&rdquo; to unmask.</p>
            </div>
          )}
        </div>

        {/* Account Details & Security Audit Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Account Security & Registry Record</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">Account Status</span>
              <p className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Active & Verified
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">Registration Date</span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(patient.created_at)}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">Credential Protection</span>
              <p className="font-semibold text-teal-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Argon2id Encrypted
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

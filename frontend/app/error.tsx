"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console without exposing sensitive data
    console.error("Portal application error occurred:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Application Error</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          An unexpected error occurred while loading this section of the patient portal.
        </p>
        <div className="pt-2 flex justify-center">
          <Button
            variant="primary"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => reset()}
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

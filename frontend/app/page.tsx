"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGetMe } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        await apiGetMe();
        router.replace("/dashboard");
      } catch {
        router.replace("/login");
      }
    }

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Connecting to Healthcare Patient Portal...
        </p>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      <p className="text-xs font-medium text-slate-500">Loading patient portal...</p>
    </div>
  );
}

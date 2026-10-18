import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7 text-teal-700" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested page could not be located in the patient portal. Please check the URL or return to the sign in page.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 px-4 py-2.5 rounded-lg transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patient Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

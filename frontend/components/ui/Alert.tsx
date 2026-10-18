import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export interface AlertProps {
  variant?: "error" | "success" | "info" | "warning";
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className = "",
}: AlertProps) {
  const variantStyles = {
    error: "bg-rose-50 border-rose-200 text-rose-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    info: "bg-teal-50 border-teal-200 text-teal-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  };

  const iconColors = {
    error: "text-rose-600",
    success: "text-emerald-600",
    info: "text-teal-700",
    warning: "text-amber-600",
  };

  const icons = {
    error: <AlertCircle className={`w-5 h-5 shrink-0 ${iconColors.error}`} />,
    success: <CheckCircle2 className={`w-5 h-5 shrink-0 ${iconColors.success}`} />,
    info: <Info className={`w-5 h-5 shrink-0 ${iconColors.info}`} />,
    warning: <AlertTriangle className={`w-5 h-5 shrink-0 ${iconColors.warning}`} />,
  };

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-lg border p-4 text-sm transition-all ${variantStyles[variant]} ${className}`}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold text-sm leading-tight">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { Check, Circle } from "lucide-react";
import { passwordRequirements } from "@/lib/validation";

interface PasswordRequirementListProps {
  password?: string;
  confirmPassword?: string;
  showMatchStatus?: boolean;
}

export function PasswordRequirementList({
  password = "",
  confirmPassword = "",
  showMatchStatus = false,
}: PasswordRequirementListProps) {
  const reqs = [
    {
      id: "length",
      label: "At least 8 characters",
      satisfied: passwordRequirements.minLength(password),
    },
    {
      id: "uppercase",
      label: "At least one uppercase letter (A-Z)",
      satisfied: passwordRequirements.hasUppercase(password),
    },
    {
      id: "lowercase",
      label: "At least one lowercase letter (a-z)",
      satisfied: passwordRequirements.hasLowercase(password),
    },
    {
      id: "number",
      label: "At least one numeric digit (0-9)",
      satisfied: passwordRequirements.hasNumber(password),
    },
    {
      id: "special",
      label: "At least one special character (@$!%*?&#...)",
      satisfied: passwordRequirements.hasSpecial(password),
    },
  ];

  if (showMatchStatus && confirmPassword) {
    reqs.push({
      id: "match",
      label: "Passwords match",
      satisfied: password.length > 0 && password === confirmPassword,
    });
  }

  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2 text-xs">
      <div className="font-semibold text-slate-700 flex items-center justify-between">
        <span>Password Security Criteria:</span>
        <span className="text-[11px] text-slate-500 font-normal">
          {reqs.filter((r) => r.satisfied).length}/{reqs.length} met
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" aria-label="Password requirements">
        {reqs.map((req) => (
          <li
            key={req.id}
            className={`flex items-center gap-1.5 transition-colors ${
              req.satisfied ? "text-emerald-700 font-medium" : "text-slate-500"
            }`}
          >
            {req.satisfied ? (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </span>
            ) : (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-400">
                <Circle className="w-2.5 h-2.5" />
              </span>
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

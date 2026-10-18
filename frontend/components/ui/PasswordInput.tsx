"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input, InputProps } from "./Input";

export interface PasswordInputProps extends Omit<InputProps, "type" | "rightElement"> {
  autoComplete?: "current-password" | "new-password" | "off";
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ autoComplete = "current-password", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        leftIcon={<Lock className="w-4 h-4" />}
        rightElement={
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-600/40 rounded transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        }
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";

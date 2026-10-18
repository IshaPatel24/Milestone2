import { z } from "zod";

export const passwordRequirements = {
  minLength: (pwd: string) => pwd.length >= 8,
  hasUppercase: (pwd: string) => /[A-Z]/.test(pwd),
  hasLowercase: (pwd: string) => /[a-z]/.test(pwd),
  hasNumber: (pwd: string) => /\d/.test(pwd),
  hasSpecial: (pwd: string) => /[@$!%*?&#^()_\-+=\[\]{}|;:,.<>]/.test(pwd),
};

export const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name cannot exceed 50 characters")
      .refine((val) => val.trim().length > 0, "First name cannot be empty"),
    last_name: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name cannot exceed 50 characters")
      .refine((val) => val.trim().length > 0, "Last name cannot be empty"),
    email: z
      .string()
      .min(1, "Email address is required")
      .email("Please enter a valid email address (e.g. name@example.com)")
      .max(255, "Email address is too long"),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
      errorMap: () => ({ message: "Please select a gender option" }),
    }),
    medical_condition: z
      .string()
      .max(2000, "Medical condition description cannot exceed 2000 characters")
      .optional(),
    preferred_language: z
      .string()
      .min(1, "Please select your preferred language"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters")
      .refine((val) => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
      .refine((val) => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
      .refine((val) => /\d/.test(val), "Password must contain at least one number")
      .refine(
        (val) => /[@$!%*?&#^()_\-+=\[\]{}|;:,.<>]/.test(val),
        "Password must contain at least one special character (@$!%*?&#...)"
      ),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember_me: z.boolean(),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;

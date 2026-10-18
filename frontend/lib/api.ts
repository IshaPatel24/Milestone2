import { Patient, RegisterFormData, LoginFormData, TokenResponse, ApiError } from "@/types";

/**
 * Resolves API Base URL:
 * 1. Server-side in Next.js functions: uses Vercel internal service binding `process.env.BACKEND_URL` if present.
 * 2. Client-side or external API: uses `process.env.NEXT_PUBLIC_API_URL`.
 * 3. Fallback:
 *    - In browser: relative `/api/v1` (routes to backend service on same Vercel domain via top-level rewrite).
 *    - In Node.js / tests: `http://localhost:8000/api/v1`.
 */
export function getApiBaseUrl(): string {
  // Check if running on server with Vercel service binding injected
  if (typeof window === "undefined" && process.env.BACKEND_URL) {
    const internalUrl = process.env.BACKEND_URL.replace(/\/+$/, "");
    return `${internalUrl}/api/v1`;
  }

  // Check explicit public API URL
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  // In browser on Vercel: relative path works natively with top-level rewrite
  if (typeof window !== "undefined") {
    return "/api/v1";
  }

  // Local development / testing default
  return "http://localhost:8000/api/v1";
}

// Token storage key for dual-layer authentication (cookie + header redundancy)
const TOKEN_STORAGE_KEY = "aegis_patient_token";

export function getStoredToken(): string | null {
  if (typeof window !== "undefined") {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

export function setStoredToken(token: string, rememberMe: boolean = false): void {
  if (typeof window !== "undefined") {
    try {
      if (rememberMe) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch {
      // Storage access may be restricted in private browsing
    }
  }
}

export function clearStoredToken(): void {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Storage access may be restricted
    }
  }
}

export class ApiRequestError extends Error {
  status: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(status: number, message: string, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Dual-layer authorization: transmit Bearer token alongside credentials
  // This ensures cross-origin requests succeed even if third-party cookies are restricted
  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Transmits HttpOnly session cookie
    });
  } catch (networkErr: unknown) {
    const errorMsg =
      networkErr instanceof Error && networkErr.message.includes("Failed to fetch")
        ? "Unable to connect to the healthcare portal API server. Please check your network or verify the backend service status."
        : "Network communication error. Please try again.";
    throw new ApiRequestError(0, errorMsg);
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
    }

    let errorDetail = "An unexpected error occurred. Please try again.";
    let fieldErrors: Array<{ field: string; message: string }> | undefined;

    try {
      const data: ApiError = await response.json();
      if (data.detail) {
        errorDetail = data.detail;
      }
      if (data.errors) {
        fieldErrors = data.errors;
      }
    } catch {
      errorDetail = `Request failed with status ${response.status}: ${response.statusText}`;
    }

    throw new ApiRequestError(response.status, errorDetail, fieldErrors);
  }

  return response.json() as Promise<T>;
}

export async function apiRegister(formData: RegisterFormData): Promise<Patient> {
  return request<Patient>("/auth/register", {
    method: "POST",
    body: JSON.stringify(formData),
  });
}

export async function apiLogin(formData: LoginFormData): Promise<TokenResponse> {
  const response = await request<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(formData),
  });

  if (response.access_token) {
    setStoredToken(response.access_token, formData.remember_me || false);
  }

  return response;
}

export async function apiGetMe(): Promise<Patient> {
  return request<Patient>("/auth/me", {
    method: "GET",
  });
}

export async function apiLogout(): Promise<{ message: string }> {
  try {
    const res = await request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
    clearStoredToken();
    return res;
  } catch (err) {
    clearStoredToken();
    throw err;
  }
}

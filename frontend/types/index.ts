export type GenderOption = "male" | "female" | "other" | "prefer_not_to_say";

export type LanguageOption = "English" | "Hindi" | "Spanish" | "French";

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  gender: GenderOption | string | null;
  medical_condition: string | null;
  preferred_language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  gender: GenderOption;
  medical_condition?: string;
  preferred_language: string;
  password: string;
  confirm_password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  patient: Patient;
}

export interface ApiError {
  detail: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

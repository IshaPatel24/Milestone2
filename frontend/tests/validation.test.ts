import { test, describe } from "node:test";
import assert from "node:assert";
import { registerSchema, loginSchema, passwordRequirements } from "../lib/validation.ts";

describe("Password Requirements Checker", () => {
  test("validates length >= 8", () => {
    assert.strictEqual(passwordRequirements.minLength("Ab1!"), false);
    assert.strictEqual(passwordRequirements.minLength("Abcdefg1!"), true);
  });

  test("validates uppercase letters", () => {
    assert.strictEqual(passwordRequirements.hasUppercase("password123!"), false);
    assert.strictEqual(passwordRequirements.hasUppercase("Password123!"), true);
  });

  test("validates lowercase letters", () => {
    assert.strictEqual(passwordRequirements.hasLowercase("PASSWORD123!"), false);
    assert.strictEqual(passwordRequirements.hasLowercase("Password123!"), true);
  });

  test("validates numeric digits", () => {
    assert.strictEqual(passwordRequirements.hasNumber("Password!"), false);
    assert.strictEqual(passwordRequirements.hasNumber("Password123!"), true);
  });

  test("validates special characters", () => {
    assert.strictEqual(passwordRequirements.hasSpecial("Password123"), false);
    assert.strictEqual(passwordRequirements.hasSpecial("Password123!"), true);
    assert.strictEqual(passwordRequirements.hasSpecial("Password123@"), true);
    assert.strictEqual(passwordRequirements.hasSpecial("Password123#"), true);
  });
});

describe("Client-side Registration Schema Validation", () => {
  const validData = {
    first_name: "Jane",
    last_name: "Doe",
    email: "jane.doe@example.com",
    gender: "female",
    medical_condition: "No known drug allergies.",
    preferred_language: "English",
    password: "SecurePassword123!",
    confirm_password: "SecurePassword123!",
  };

  test("accepts completely valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    assert.strictEqual(result.success, true);
  });

  test("rejects empty first name", () => {
    const result = registerSchema.safeParse({ ...validData, first_name: "   " });
    assert.strictEqual(result.success, false);
  });

  test("rejects empty last name", () => {
    const result = registerSchema.safeParse({ ...validData, last_name: "" });
    assert.strictEqual(result.success, false);
  });

  test("rejects invalid email address format", () => {
    const result = registerSchema.safeParse({ ...validData, email: "invalid-email" });
    assert.strictEqual(result.success, false);
  });

  test("rejects invalid gender choice", () => {
    const result = registerSchema.safeParse({ ...validData, gender: "unsupported_option" });
    assert.strictEqual(result.success, false);
  });

  test("rejects weak password missing special character", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Password1234",
      confirm_password: "Password1234",
    });
    assert.strictEqual(result.success, false);
  });

  test("rejects weak password under 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "P1!",
      confirm_password: "P1!",
    });
    assert.strictEqual(result.success, false);
  });

  test("rejects password confirmation mismatch", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "SecurePassword123!",
      confirm_password: "DifferentPassword123!",
    });
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.strictEqual(
        result.error.issues.some((issue) => issue.message === "Passwords do not match"),
        true
      );
    }
  });

  test("allows optional medical condition to be omitted", () => {
    const withoutMedical = { ...validData, medical_condition: undefined };
    const result = registerSchema.safeParse(withoutMedical);
    assert.strictEqual(result.success, true);
  });
});

describe("Client-side Login Schema Validation", () => {
  test("accepts valid login credentials", () => {
    const result = loginSchema.safeParse({
      email: "patient@example.com",
      password: "Password123!",
      remember_me: true,
    });
    assert.strictEqual(result.success, true);
  });

  test("rejects empty email or password", () => {
    const result1 = loginSchema.safeParse({ email: "", password: "Password123!", remember_me: false });
    assert.strictEqual(result1.success, false);

    const result2 = loginSchema.safeParse({ email: "patient@example.com", password: "", remember_me: false });
    assert.strictEqual(result2.success, false);
  });

  test("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "notanemail",
      password: "Password123!",
      remember_me: false,
    });
    assert.strictEqual(result.success, false);
  });
});

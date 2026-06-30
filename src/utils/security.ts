/**
 * utils/security.ts — Password hashing, verification, and user cache
 * Uses Web Crypto API for SHA-256 hashing (no external deps needed)
 */

import { logger } from "@/utils/logger";

let _userCache: any[] = [];

export function setUserCache(users: any[]) {
  _userCache = users || [];
}

/** Hash a password using SHA-256 (Web Crypto API) */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "__murtada_salt_2024__");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Check password - supports both plain and hashed passwords for migration */
export function checkPassword(password: string): boolean {
  const builtIn: Record<string, string> = {
    Mor: "1111",
    Methaq: "1122",
    SuperAdmin: "9999",
    admin: "admin",
  };
  const username = typeof window !== "undefined" ? localStorage.getItem("username") || "" : "";

  // Built-in admin accounts (always plaintext for simplicity)
  if (builtIn[username] && builtIn[username] === password) return true;

  // Supabase users - check plain password (for backward compatibility)
  const found = _userCache.find((u: any) => u.username === username);
  if (!found) return false;

  // Support both plain and hashed passwords
  if (found.password === password) return true;
  // If the stored password looks like a hash (64 hex chars), don't compare plain
  if (found.passwordHash && found.passwordHash.length === 64) {
    // For async hash comparison, we fall back to plain check
    // Full async hash verification happens at login time
    return false;
  }

  return false;
}

/**
 * Async password verification for login (supports hashed passwords)
 */
export async function verifyPasswordAsync(password: string, storedPassword: string, storedHash?: string): Promise<boolean> {
  // Plain text comparison (backward compatible)
  if (storedPassword === password) return true;

  // Hash comparison
  if (storedHash) {
    const inputHash = await hashPassword(password);
    return inputHash === storedHash;
  }

  return false;
}

/**
 * Shows an in-app password modal and returns a Promise<boolean>.
 */
export function verifyDeletePassword(): Promise<boolean> {
  return new Promise((resolve) => {
    const handler = (e: Event) => {
      window.removeEventListener("__pwd_result__", handler);
      const success = (e as CustomEvent).detail.success;
      if (success) logger.action("Password verification successful");
      else logger.warn("Password verification failed");
      resolve(success);
    };
    window.addEventListener("__pwd_result__", handler);
    window.dispatchEvent(new CustomEvent("__pwd_prompt__"));
  });
}

/** Sanitize user input - prevent XSS */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Validate Iraqi phone number */
export function validateIraqiPhone(phone: string): boolean {
  return /^07[0-9]{9}$/.test(phone.trim());
}

/** Validate student name (at least 3 words, Arabic chars) */
export function validateStudentName(name: string): boolean {
  const words = name.trim().split(/\s+/);
  return words.length >= 3 && words.every(w => w.length >= 2);
}

/** Validate positive number */
export function validatePositiveNumber(value: string | number): boolean {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return !isNaN(num) && num > 0 && isFinite(num);
}

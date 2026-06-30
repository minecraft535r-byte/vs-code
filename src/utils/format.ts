/**
 * utils/format.ts — SINGLE SOURCE OF TRUTH for all formatting
 * 
 * ═══════════════════════════════════════════════════════════════
 * Every component MUST use these functions instead of inline
 * Intl.NumberFormat, padStart, slice, or date formatting.
 * ═══════════════════════════════════════════════════════════════
 */

// ── Money Formatting ─────────────────────────────────────────
// ALWAYS use en-US for consistent English numerals with commas
// NEVER use ar-IQ (Arabic-Indic numerals ١٬٢٬٣) or en-IQ

/** Format money with commas: 1500000 → "1,500,000" */
export function formatIQD(val: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(val));
}

/** Format with commas for input display (accepts string) */
export function formatWithCommas(value: string | number): string {
  const num = typeof value === "string" ? value.replace(/,/g, "") : String(value);
  if (!num || isNaN(Number(num))) return String(value);
  return new Intl.NumberFormat("en-US").format(Number(num));
}

/** Handle money input change - strip commas, allow only digits */
export function handleDirectMoneyChange(
  e: React.ChangeEvent<HTMLInputElement>,
  callback: (cleanValue: string) => void,
): void {
  const raw = e.target.value.replace(/,/g, "");
  if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
    callback(raw);
  }
}


// ── Student Code Formatting ──────────────────────────────────
// Standardized: always show last 6 chars, zero-padded if numeric

/** Format student code for display: "1718000123456" → "123456" */
export function formatStudentCode(id: string | number): string {
  const s = String(id);
  if (/^\d+$/.test(s)) {
    // Pure numeric ID → take last 6, pad if shorter
    return s.length > 6 ? s.slice(-6) : s.padStart(6, "0");
  }
  // Alphanumeric ID → show as-is (max 8 chars)
  return s.length > 8 ? s.slice(-8) : s;
}


// ── Receipt Number Formatting ────────────────────────────────
// CRITICAL: Always use padStart, NEVER use slice(-4)

/** Format receipt number: "1" → "0001", "23" → "0023" */
export function formatReceiptNo(id: string | number): string {
  const s = String(id);
  if (/^\d+$/.test(s)) {
    return s.padStart(4, "0");
  }
  // Non-numeric receipt ID (e.g. "EXP_EMP_SAL_123") → take last 4
  return s.slice(-4);
}

/** Format receipt for display with # prefix */
export function formatReceiptDisplay(id: string | number): string {
  return `#${formatReceiptNo(id)}`;
}


// ── Date Formatting ──────────────────────────────────────────
// Standard: YYYY/MM/DD for display, YYYY-MM-DD for storage

/** Format date for screen display: "2026-05-22" → "2026/05/22" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const clean = dateStr.split("T")[0];
  return clean.replace(/-/g, "/");
}

/** Format date for print (Arabic style): "2026-05-22" → "2026\5\22" */
export function formatDatePrint(dateStr: string): string {
  if (!dateStr) return "";
  const clean = dateStr.split("T")[0];
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    return `${parts[0]}\\${+parts[1]}\\${+parts[2]}`;
  }
  return dateStr.replace(/[-/]/g, "\\");
}

/** Get current date as YYYY-MM-DD */
export function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Get current time as h:mm */
export function getCurrentTime(): string {
  const n = new Date();
  let h = n.getHours();
  const m = String(n.getMinutes()).padStart(2, "0");
  h = h % 12 || 12;
  return `${h}:${m}`;
}

/** Get current month name in Arabic */
export function getCurrentMonthArabic(): string {
  return new Intl.DateTimeFormat("ar-IQ", { month: "long" }).format(new Date());
}

/** Get current year number */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/** Get current month number (1-12) */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}


// ── Total Paid Calculation ───────────────────────────────────
// CRITICAL: Must exclude withdrawn payments everywhere

/** Calculate total paid for a student, excluding withdrawn payments */
export function calculateStudentPaid(payments: any[]): number {
  return (payments || [])
    .filter(p => !p.isWithdrawn)
    .reduce((acc, p) => acc + (p.amount || 0), 0);
}

/** Calculate remaining for a student */
export function calculateStudentRemaining(tuition: number, discount: number, payments: any[]): number {
  return Math.max(0, tuition - (discount || 0) - calculateStudentPaid(payments));
}


/** Generate a unique ID - collision-safe using timestamp + random suffix */
export function generateId(prefix?: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${ts}_${rand}` : `${ts}_${rand}`;
}

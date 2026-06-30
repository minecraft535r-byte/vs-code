/**
 * ═══════════════════════════════════════════════════════════════
 * FIND-AND-REPLACE GUIDE — Apply these across your ENTIRE project
 * ═══════════════════════════════════════════════════════════════
 * 
 * Use your editor's "Find and Replace in Files" (Ctrl+Shift+H)
 * Apply each replacement across ALL .tsx and .ts files
 */

// ═══════════════════════════════════════════════════════════════
// FIX 1: Replace ALL number formatters with unified formatIQD
// ═══════════════════════════════════════════════════════════════

// FIND (Regex): new Intl\.NumberFormat\("(?:en-US|ar-IQ|en-IQ)"\)\.format\(([^)]+)\)
// REPLACE: formatIQD($1)
// 
// This catches ALL three locale variants and replaces with formatIQD()
// Make sure formatIQD is imported: import { formatIQD } from "@/utils/format";
//
// EXCEPTIONS: Keep Intl.NumberFormat in print components where Arabic numerals
// are intentionally used for Arabic print output.


// ═══════════════════════════════════════════════════════════════
// FIX 2: Replace ALL slice(-4) with formatReceiptNo
// ═══════════════════════════════════════════════════════════════

// File: EditStudentModal.tsx (your StudentAccountCard.tsx)
// FIND:    (p as any).receiptNumber||p.id?.slice(-4)||(i+1)
// REPLACE: formatReceiptNo(p.receiptNo || p.id)

// File: InvestorsManagementSubView.tsx (AllStudentsStatement.tsx)
// FIND:    p.receiptNo || p.id.slice(-4)
// REPLACE: formatReceiptNo(p.receiptNo || p.id)


// ═══════════════════════════════════════════════════════════════
// FIX 3: Replace ALL inline receipt ID formatting
// ═══════════════════════════════════════════════════════════════

// FIND (in ALL files):
//   /^\d+$/.test(String(payment.id)) ? String(payment.id).padStart(4, "0") : payment.id
// REPLACE:
//   formatReceiptNo(payment.id)
//
// Also replace similar patterns with different variable names:
//   /^\d+$/.test(String(p.id)) ? String(p.id).padStart(4, "0") : p.id
//   → formatReceiptNo(p.id)


// ═══════════════════════════════════════════════════════════════
// FIX 4: Replace ALL totalPaid calculations to exclude withdrawn
// ═══════════════════════════════════════════════════════════════

// FIND (Regex, ALL files):
//   (s.payments || []).reduce((acc, p) => acc + p.amount, 0)
// REPLACE:
//   calculateStudentPaid(s.payments)
//
// Also catch other variants:
//   (s.payments || []).reduce((a, p) => a + p.amount, 0)
//   → calculateStudentPaid(s.payments)
//
//   (student.payments || []).reduce((s, p) => s + p.amount, 0)
//   → calculateStudentPaid(student.payments)
//
// Import: import { calculateStudentPaid } from "@/utils/format";


// ═══════════════════════════════════════════════════════════════
// FIX 5: Replace hardcoded dates in EmployeeManagement
// ═══════════════════════════════════════════════════════════════

// FIND:    const currentYearNum = 2026;
// REPLACE: const currentYearNum = new Date().getFullYear();

// FIND:    const currentMonthNum = 5;
// REPLACE: const currentMonthNum = new Date().getMonth() + 1;

// FIND:    const paymentDateStr = `2026-05-22`;
// REPLACE: const paymentDateStr = new Date().toISOString().split("T")[0];

// FIND:    setPayDate("2026-05-25");
// REPLACE: setPayDate(new Date().toISOString().split("T")[0]);


// ═══════════════════════════════════════════════════════════════
// FIX 6: Increase minimum text size from 10px to 12px
// ═══════════════════════════════════════════════════════════════

// FIND:    text-[10px]
// REPLACE: text-xs
// (text-xs = 12px in Tailwind — still small but readable)
//
// NOTE: Be careful with print components — 10px is OK for print


// ═══════════════════════════════════════════════════════════════
// FIX 7: Make buttons larger for easier tapping on mobile
// ═══════════════════════════════════════════════════════════════

// For action buttons that use py-1.5, increase to py-2:
// FIND:    py-1.5 
// REPLACE: py-2.5
// (Only in interactive buttons, NOT in badges/tags)
//
// For icon-only buttons, ensure minimum 40x40px touch target:
// FIND:    p-1.5 
// (check if it's an icon button, if so:)
// REPLACE: p-2.5


// ═══════════════════════════════════════════════════════════════
// FILES THAT NEED import UPDATES
// ═══════════════════════════════════════════════════════════════

// After applying the fixes above, update imports in each file:
//
// Add to EVERY file that uses formatIQD:
//   import { formatIQD, formatReceiptNo, calculateStudentPaid } from "@/utils/format";
//
// Files that need this import update:
//   - StudentInvoices.tsx
//   - StudentSearch.tsx (TrendArrow.tsx in your project)
//   - VaultReport.tsx (AnimatedCounter.tsx)
//   - EmployeeManagement.tsx
//   - ExpenseInvoiceList.tsx
//   - StudentAccountCard.tsx (EditStudentModal.tsx)
//   - AdditionalRevenueReceiptPrint.tsx
//   - Desktop.tsx (PrintReport.tsx)
//   - ReceiptPrint.tsx (BulkTransfer.tsx)
//   - StudentAccountStatementModal.tsx (SystemSettingsView.tsx)
//   - AllStudentsStatement.tsx
//   - ProfileView.tsx
//   - InvestorsManagementSubView.tsx

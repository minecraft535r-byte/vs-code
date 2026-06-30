/**
 * constants/index.ts — All application constants
 * 
 * Extracted from App.tsx monolith.
 */

import type { Permission, PaperSpec } from "../types";

// ── Permissions ──────────────────────────────────────────────────

export const PERMISSIONS: Permission[] = [
  { id: "edit-data", label: "تعديل بيانات", description: "" },
  { id: "view-invoices", label: "كشف الفواتير والمصروفات", description: "" },
  { id: "view-vault", label: "كشف الصندوق", description: "" },
  { id: "add-students", label: "اضافة طلاب", description: "" },
  { id: "add-expenses", label: "اضافة مصروفات", description: "" },
  { id: "add-revenue", label: "اضافة ايرادات", description: "" },
  { id: "manage-employees", label: "إدارة الموظفين", description: "" },
  { id: "view-reports", label: "عرض التقارير والجرد", description: "" },
  { id: "manage-grades", label: "إدارة الدرجات والنتائج", description: "" },
  { id: "manage-attendance", label: "إدارة الحضور والغياب", description: "" },
  { id: "settings", label: "اعدادات النظام", description: "" },
  { id: "manage-users", label: "إدارة المستخدمين", description: "" },
];

// ── Job Titles ───────────────────────────────────────────────────

export const JOB_TITLES = [
  "مدير",
  "معاون",
  "كاتب",
  "مساعد",
  "مدرس رياضيات",
  "مدرس فيزياء",
  "مدرس احياء",
  "مدرس كيمياء",
  "مدرس لغة عربية",
  "مدرس انجليزية",
  "مدرس اجتماعيات",
  "مدرس حاسوب",
  "مدرس تربية اسلامية",
  "مدرس فنية",
  "مدرس رياضة",
  "موظف خدمة",
  "حارس",
] as const;

// ── Student Subjects ─────────────────────────────────────────────

export const STUDENT_SUBJECTS = [
  "اللغة العربية",
  "الرياضيات",
  "اللغة الإنجليزية",
  "الفيزياء",
  "الكيمياء",
  "الأحياء",
  "الاجتماعيات",
  "الحاسوب",
  "التربية الإسلامية",
  "الفنية",
  "الرياضة",
] as const;

// ── Paper Sizes ──────────────────────────────────────────────────

export const PAPER_SIZES: Record<string, PaperSpec> = {
  A4: {
    w: 210, h: 297, width: "210mm", padding: "15mm",
    fontSize: "14px", logoSize: 95, titleSize: "22px",
    headerFS: "14px", bodyFS: "17px", tableFS: "14px", tablePad: "10px 6px",
    bannerFS: "22px", bannerPad: "6px 55px", footerFS: "9px",
    compact: false, label: "A4",
  },
  A5: {
    w: 148, h: 210, width: "148mm", padding: "8mm",
    fontSize: "10px", logoSize: 60, titleSize: "15px",
    headerFS: "10px", bodyFS: "12px", tableFS: "10px", tablePad: "5px 4px",
    bannerFS: "15px", bannerPad: "4px 28px", footerFS: "7px",
    compact: false, label: "A5",
  },
  A8: {
    w: 58, h: 297, width: "58mm", padding: "3mm",
    fontSize: "10px", logoSize: 0, titleSize: "12px",
    headerFS: "9px", bodyFS: "10px", tableFS: "9px", tablePad: "2px 2px",
    bannerFS: "11px", bannerPad: "2px 6px", footerFS: "9px",
    compact: true, label: "حراري ٥٨مم", autoHeight: true,
  },
  Thermal80: {
    w: 80, h: 297, width: "80mm", padding: "4mm",
    fontSize: "11px", logoSize: 0, titleSize: "14px",
    headerFS: "10px", bodyFS: "11px", tableFS: "10px", tablePad: "2px 3px",
    bannerFS: "13px", bannerPad: "3px 8px", footerFS: "10px",
    compact: true, label: "حراري ٨٠مم", autoHeight: true,
  },
};

// ── Default Values ───────────────────────────────────────────────

export const DEFAULT_GRADES = [
  "الاول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس",
];

export const DEFAULT_EXPENSE_TYPES = [
  "نثرية", "رواتب", "ايجار", "صيانة", "اخرى",
];

export const DEFAULT_SOURCES = [
  "الصندوق الرئيسي", "صندوق الطوارئ", "حساب البنك",
];

export const DEFAULT_SECTIONS = ["أ", "ب", "ج"];

// ── Navigation Routes ────────────────────────────────────────────

export const VIEW_TO_PATH: Record<string, string> = {
  dashboard: "/",
  vault: "/vault",
  "student-invoices": "/invoices/students",
  employees: "/employees",
  "add-expense": "/expenses/add",
  "add-additional-revenue": "/revenue/add",
  "expense-invoices": "/invoices/expenses",
  "additional-revenue-list": "/revenue/list",
  "add-student": "/students/add",
  "search-students": "/students/search",
  "manage-users": "/users",
  settings: "/settings",
  profile: "/profile",
  "grade-management": "/grades",
  "attendance-management": "/attendance",
  "payment-inventory": "/payments/inventory",
  investors: "/investors",
  "previous-debts": "/debts",
  taxes: "/taxes",
  "sections-management": "/sections",
};

export const PATH_TO_VIEW: Record<string, string> = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([k, v]) => [v, k]),
);

// ── School Image Presets ─────────────────────────────────────────

export const SCHOOL_PRESETS = [
  {
    id: "preset1",
    name: "مبنى كلاسيكي أثري",
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "preset2",
    name: "حرم مدرسي حديث",
    url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "preset3",
    name: "مدرج تقني متطور",
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop",
  },
];

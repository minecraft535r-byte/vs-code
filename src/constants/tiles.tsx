/**
 * constants/tiles.tsx — Dashboard tile definitions
 * 
 * Separated from constants/index.ts because it contains JSX (React icons).
 */

import React from "react";
import {
  Wallet, Receipt, Users, Plus, TrendingUp, FileText,
  ListTree, UserPlus, Search, Settings, GraduationCap,
  CalendarCheck, ClipboardList, History, FileSpreadsheet,
} from "lucide-react";
import type { DashboardTile } from "@/types";

export const TILES: DashboardTile[] = [
  {
    id: "1",
    label: "كشف صندوق",
    icon: <Wallet />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    view: "vault",
  },
  {
    id: "3",
    label: "فواتير الطلاب",
    icon: <Receipt />,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    view: "student-invoices",
  },
  {
    id: "4",
    label: "الموظفين",
    icon: <Users />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    view: "employees",
  },
  {
    id: "5",
    label: "اضافة مصروفات",
    icon: <Plus />,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    view: "add-expense",
  },
  {
    id: "11",
    label: "اضافة ايرادات اضافية",
    icon: <TrendingUp />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    view: "add-additional-revenue",
  },
  {
    id: "9",
    label: "فواتير المصروفات",
    icon: <FileText />,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    view: "expense-invoices",
  },
  {
    id: "10",
    label: "قائمة الواردات الاضافية",
    icon: <ListTree />,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    view: "additional-revenue-list",
  },
  {
    id: "6",
    label: "اضافة طالب جديد",
    icon: <UserPlus />,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    view: "add-student",
  },
  {
    id: "12",
    label: "بحث عن طالب",
    icon: <Search />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    view: "search-students",
  },
  {
    id: "7",
    label: "ادارة المستخدمين",
    icon: <Users />,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    view: "manage-users",
  },
  {
    id: "13",
    label: "اعدادات النظام",
    icon: <Settings />,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    view: "settings",
  },
  {
    id: "15",
    label: "إدارة الدرجات",
    icon: <GraduationCap />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    view: "grade-management",
  },
  {
    id: "16",
    label: "الحضور والغياب",
    icon: <CalendarCheck />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    view: "attendance-management",
  },
  {
    id: "14",
    label: "جرد الدفعات",
    icon: <ClipboardList />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    view: "payment-inventory",
  },
  {
    id: "17",
    label: "المستثمرين ونسب الأرباح",
    icon: <Users />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    view: "investors",
  },
  {
    id: "18",
    label: "الديون السابقة",
    icon: <History />,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    view: "previous-debts",
  },
  {
    id: "19",
    label: "الضرائب",
    icon: <FileSpreadsheet />,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    view: "taxes",
  },
];

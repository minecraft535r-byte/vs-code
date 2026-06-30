/**
 * Desktop.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Bell, Users, Wallet, Receipt, UserPlus, GraduationCap, TrendingDown, TrendingUp, Plus, ClipboardList, LayoutGrid, Check, Search, FileText, CalendarCheck, Settings } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area } from "recharts";
import type { Student, Payment, AcademicYear, Employee, Expense, AdditionalRevenue, AppUser, AppNotification, DashboardTile, SystemSettings } from "@/types";
import { VIEW_TO_PATH, PATH_TO_VIEW } from "@/constants";
import { TILES } from "@/constants/tiles";
import { saveSetting, fetchSetting } from "@/services/data-service";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import TrendArrow from "@/components/ui/TrendArrow";
import DashboardCard from "@/components/ui/DashboardCard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AcademicYearSelector from "@/components/ui/AcademicYearSelector";
import ExportButton from "@/components/ui/ExportButton";
import EmployeeManagement from "@/components/employees/EmployeeManagement";
import ExpenseForm from "@/components/finance/ExpenseForm";
import InvestorsManagementSubView from "@/components/finance/InvestorsManagementSubView";
import PaymentInventory from "@/components/finance/PaymentInventory";
import AdditionalRevenueList from "@/components/finance/AdditionalRevenueList";
import VaultReport from "@/components/finance/VaultReport";
import AdditionalRevenueForm from "@/components/finance/AdditionalRevenueForm";
import AppSidebar from "@/components/layout/AppSidebar";
import UserManagement from "@/components/settings/UserManagement";
import SystemSettingsView from "@/components/settings/SystemSettingsView";
import ProfileView from "@/components/settings/ProfileView";
import PreviousDebtsSubView from "@/components/students/PreviousDebtsSubView";
import TaxesListView from "@/components/students/TaxesListView";
import StudentForm from "@/components/students/StudentForm";
import StudentSearch from "@/components/students/StudentSearch";
import AttendanceManagement from "@/components/students/AttendanceManagement";
import StudentInvoices from "@/components/students/StudentInvoices";
import GradeManagement from "@/components/students/GradeManagement";
import ExpenseInvoiceList from "@/components/print/ExpenseInvoiceList";

const Desktop = ({
  username,
  onLogout,
  isAdminMode,
  onReturnToAdmin,
  onUpdateUser,
  students,
  allStudents,
  onAddStudent,
  onDeleteStudent,
  onTransferStudent,
  onAddPayment,
  receiptCounter,
  expenses,
  onAddExpense,
  onDeleteExpense,
  onEditExpense,
  employees,
  onAddEmployee,
  onDeleteEmployee,
  additionalRevenue,
  onAddAdditionalRevenue,
  onReceiveRevenue,
  schools,
  grades,
  expenseTypes,
  sources,
  onUpdateList,
  onPayExpense,
  users,
  onAddUser,
  onDeleteUser,
  currentUser,
  systemSettings,
  onUpdateSettings,
  incrementReceiptCounter,
  onBulkTransfer,
  activeYear,
  academicYears,
  onSwitchYear,
  onAddAcademicYear,
  onEditAcademicYear,
  onDeleteAcademicYear,
  onUpdateStudents,
  onResetVault,
  theme,
  onToggleTheme,
  notifications,
  onClearNotifications,
  onMarkAllAsRead,
}: {
  username: string;
  onLogout: () => void;
  isAdminMode?: boolean;
  onReturnToAdmin?: () => void;
  onUpdateUser?: (updated: AppUser) => void;
  students: Student[];   // Year-filtered (for financial views)
  allStudents?: Student[];  // All students (for management views)
  onAddStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onTransferStudent: (id: string) => void;
  onAddPayment: (id: string, p: Payment) => void;
  receiptCounter: number;
  expenses: Expense[];
  onAddExpense: (e: Expense) => void;
  onDeleteExpense?: (id: string) => void;
  onEditExpense?: (e: Expense) => void;
  employees: Employee[];
  onAddEmployee: (e: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  additionalRevenue: AdditionalRevenue[];
  onAddAdditionalRevenue: (r: AdditionalRevenue) => void;
  onReceiveRevenue: (id: string) => void;
  schools: string[];
  grades: string[];
  expenseTypes: string[];
  sources: string[];
  onUpdateList: (k: string, l: string[]) => void;
  onPayExpense: (id: string) => void;
  users: AppUser[];
  onAddUser: (u: AppUser) => void | boolean;
  onDeleteUser: (id: string) => void;
  currentUser: AppUser | null;
  systemSettings: SystemSettings;
  onUpdateSettings: (s: SystemSettings, silent?: boolean) => void;
  incrementReceiptCounter: () => number;
  onBulkTransfer: (from: string, to: string) => void;
  activeYear?: string;
  academicYears?: AcademicYear[];
  onSwitchYear?: (year: string) => void;
  onAddAcademicYear?: (year: AcademicYear) => boolean;
  onEditAcademicYear?: (id: string, updates: Partial<AcademicYear>) => void;
  onDeleteAcademicYear?: (id: string) => void;
  onUpdateStudents: (updated: Student[], isCompleteOverwrite?: boolean) => void;
  onResetVault: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  notifications: AppNotification[];
  onClearNotifications: () => void;
  onMarkAllAsRead: () => void;
  key?: string;
}) => {
  const [previousView, setPreviousView] = useState("dashboard");
  const navigateTo = (view: string) => {
    setPreviousView(currentView);
    setCurrentView(view);
  };
  const [currentView, setCurrentView] = useState(() => {
    // Initialize view from URL path on first load
    const path = window.location.pathname;
    return PATH_TO_VIEW[path] || "dashboard";
  });
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // ← MUST be before early returns
  const [settingsInitialTab, setSettingsInitialTab] = useState<string>(""); // for sidebar deep links
  const [tileOrder, setTileOrder] = useState<string[]>(TILES.map((t) => t.id));

  // Load tileOrder from Supabase on mount
  useEffect(() => {
    if (!username) return;
    fetchSetting(username, 'tileOrder').then(saved => {
      if (saved) {
        try { setTileOrder(JSON.parse(saved)); } catch {}
      }
    });
  }, [username]);

  const updateTileOrder = (newOrder: string[]) => {
    setTileOrder(newOrder);
    if (username) saveSetting(username, 'tileOrder', JSON.stringify(newOrder));
  };

  const [draggedTileIndex, setDraggedTileIndex] = useState<number | null>(null);
  const lastTileSwapTimeRef = useRef<number>(0);

  const handleMoveTile = (index: number, direction: "left" | "right") => {
    const nextIndex = direction === "left" ? index + 1 : index - 1;
    if (nextIndex < 0 || nextIndex >= orderedTiles.length) return;

    const updated = [...orderedTiles];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;

    const newOrderIds = updated.map((t) => t.id);
    updateTileOrder(newOrderIds);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  // ── URL Routing ──────────────────────────────────────────────────
  useEffect(() => {
    const handlePop = () => {
      const p = window.location.pathname;
      setCurrentView(PATH_TO_VIEW[p] || "dashboard");
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  useEffect(() => {
    const path = VIEW_TO_PATH[currentView] || "/";
    if (window.location.pathname !== path) {
      window.history.pushState({ view: currentView }, "", path);
    }
  }, [currentView]);
  // ─────────────────────────────────────────────────────────────────


  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Real-time calculations
  const totalRevenue =
    students.reduce(
      (acc, s) =>
        acc + (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((pAcc, p) => pAcc + p.amount, 0),
      0,
    ) +
    additionalRevenue
      .filter((r) => r.status === "received")
      .reduce((acc, r) => acc + r.amount, 0);
  const totalExpenses = expenses
    .filter((e) => e.status === "paid")
    .reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const TILE_PERMISSIONS: Record<string, string> = {
    vault: "view-vault",
    "add-student": "add-students",
    "add-expense": "add-expenses",
    "add-additional-revenue": "add-revenue",
    "student-invoices": "view-invoices",
    "expense-invoices": "view-invoices",
    "additional-revenue-list": "view-invoices",
    "search-students": "view-invoices",  // all users with invoices perm can search
    employees: "manage-employees",
    "payment-inventory": "view-reports",
    "grade-management": "manage-grades",
    "attendance-management": "manage-attendance",
    settings: "settings",
    "manage-users": "manage-users",
    investors: "settings",
    "previous-debts": "view-invoices",
    taxes: "view-invoices",
  };

  const allowedTiles = TILES.filter((tile) => {
    if (username === "Mor" || username === "Methaq") return true;
    if (!tile.view) return true;
    const requiredPermission = TILE_PERMISSIONS[tile.view];
    if (requiredPermission === "admin" || requiredPermission === "settings" || requiredPermission === "manage-users") {
      return (
        currentUser?.permissions.includes("admin") ||
        currentUser?.permissions.includes("settings") ||
        currentUser?.permissions.includes("manage-users") ||
        false
      );
    }
    return currentUser?.permissions.includes(requiredPermission);
  });

  const orderedTiles = useMemo(() => {
    return [...allowedTiles].sort((a, b) => {
      let idxA = tileOrder.indexOf(a.id);
      let idxB = tileOrder.indexOf(b.id);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      return idxA - idxB;
    });
  }, [allowedTiles, tileOrder]);

  const handleTileDragStart = (index: number) => {
    setDraggedTileIndex(index);
  };

  const handleTileDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastTileSwapTimeRef.current < 250) {
      return; // prevent rapid infinite swap loop
    }
    if (draggedTileIndex !== null && draggedTileIndex !== index) {
      lastTileSwapTimeRef.current = now;
      const updated = [...orderedTiles];
      const temp = updated[draggedTileIndex];
      updated[draggedTileIndex] = updated[index];
      updated[index] = temp;

      const newOrderIds = updated.map((t) => t.id);
      updateTileOrder(newOrderIds);
      setDraggedTileIndex(index);
    }
  };

  const handleTileDragEnd = () => {
    setDraggedTileIndex(null);
  };

  // ── activeView holds the JSX for the current view; renders inside <main> next to the persistent sidebar.
  let activeView: React.ReactNode = null;

  if (currentView === "add-student") {
    activeView = (
      <StudentForm
        onBack={() => setCurrentView(previousView === "search-students" ? "search-students" : "dashboard")}
        onSave={onAddStudent}
        schools={schools}
        grades={grades}
        onUpdateList={onUpdateList}
        defaultSchool={currentUser?.linkedSchool || systemSettings.schoolName || ""}
        isSchoolLocked={!!(currentUser?.linkedSchool) && username !== "Mor" && username !== "Methaq" && username !== "SuperAdmin"}
        systemSettings={systemSettings}
      />
    );
  }

  if (currentView === "add-expense") {
    activeView = (
      <ExpenseForm
        onBack={() => setCurrentView(previousView === "expense-invoices" ? "expense-invoices" : "dashboard")}
        onSave={onAddExpense}
        schools={schools}
        expenseTypes={expenseTypes}
        sources={sources}
        onUpdateList={onUpdateList}
        defaultSchool={currentUser?.linkedSchool || systemSettings.schoolName || ""}
        isSchoolLocked={!!(currentUser?.linkedSchool) && username !== "Mor" && username !== "Methaq" && username !== "SuperAdmin"}
      />
    );
  }

  if (currentView === "add-additional-revenue") {
    activeView = (
      <AdditionalRevenueForm
        onBack={() => setCurrentView("dashboard")}
        onSave={onAddAdditionalRevenue}
        schools={schools}
        onUpdateList={onUpdateList}
        isSchoolLocked={!!(currentUser?.linkedSchool) && username !== "Mor" && username !== "Methaq" && username !== "SuperAdmin"}
      />
    );
  }

  if (currentView === "vault") {
    activeView = (
      <VaultReport
        onBack={() => setCurrentView("dashboard")}
        students={students}
        expenses={expenses}
        additionalRevenue={additionalRevenue}
        onReset={onResetVault}
        currentUser={currentUser}
        systemSettings={systemSettings}
      />
    );
  }

  if (currentView === "student-invoices") {
    activeView = (
      <StudentInvoices
        onBack={() => setCurrentView("dashboard")}
        students={students}
        onAddPayment={onAddPayment}
        schools={schools}
        grades={grades}
        receiptCounter={receiptCounter}
        currentUser={currentUser}
        onUpdateStudents={onUpdateStudents}
        systemSettings={systemSettings}
      />
    );
  }

  if (currentView === "expense-invoices") {
    activeView = (
      <ExpenseInvoiceList
        onBack={() => setCurrentView("dashboard")}
        expenses={expenses}
        onPayExpense={onPayExpense}
        schools={schools}
        expenseTypes={expenseTypes}
        onNavigate={(view: string) => navigateTo(view)}
      onDeleteExpense={onDeleteExpense}
        onEditExpense={onEditExpense}
      />
    );
  }

  if (currentView === "additional-revenue-list") {
    activeView = (
      <AdditionalRevenueList
        onBack={() => setCurrentView("dashboard")}
        revenues={additionalRevenue}
        onReceiveRevenue={onReceiveRevenue}
        schools={schools}
      />
    );
  }

  if (currentView === "search-students") {
    activeView = (
      <StudentSearch
        onBack={() => setCurrentView("dashboard")}
        onNavigate={(view: string) => navigateTo(view)}
        students={allStudents || students}
        onDelete={onDeleteStudent}
        onTransfer={onTransferStudent}
        onUpdate={onUpdateStudents}
        schools={schools}
        grades={grades}
        systemSettings={systemSettings}
        onAddPayment={onAddPayment}
        receiptCounter={receiptCounter}
        currentUser={currentUser}
      />
    );
  }

  if (currentView === "payment-inventory") {
    activeView = (
      <PaymentInventory
        onBack={() => setCurrentView("dashboard")}
        students={students}
        schools={schools}
        grades={grades}
      />
    );
  }

  if (currentView === "employees") {
    activeView = (
      <EmployeeManagement
        onBack={() => setCurrentView("dashboard")}
        employees={employees}
        onAddEmployee={onAddEmployee}
        onDeleteEmployee={onDeleteEmployee}
        schools={schools}
        expenses={expenses}
        onAddExpense={onAddExpense}
        systemSettings={systemSettings}
      />
    );
  }

  if (currentView === "manage-users") {
    // Users a school admin sees: ONLY users they created within their own school.
    // SuperAdmin-created top-level accounts (the school's own login account, plus
    // every other school's account) MUST never appear here.
    const visibleUsers = users.filter((u) => {
      // Never show SuperAdmin-created top-level accounts
      if (u.createdBy === "superadmin") return false;
      if (u.notes === "تم الإنشاء بواسطة لوحة تحكم المدير العام") return false;
      // Scope by the current admin's school when one is set
      if (currentUser?.linkedSchool) {
        return u.linkedSchool === currentUser.linkedSchool ||
               u.createdByUsername === username ||
               (!u.linkedSchool && !u.createdByUsername); // legacy users with no scope
      }
      return true;
    });

    // Wrap onAddUser so school admins automatically tag new users with their scope
    const handleAddSchoolUser = (u: AppUser) =>
      onAddUser({
        ...u,
        createdBy: "school",
        createdByUsername: username,
        linkedSchool: u.linkedSchool || currentUser?.linkedSchool,
      });

    activeView = (
      <UserManagement
        onBack={() => setCurrentView("dashboard")}
        users={visibleUsers}
        onAddUser={handleAddSchoolUser}
        onDeleteUser={onDeleteUser}
        onEditUser={onUpdateUser}
        schools={schools}
        isMainAdmin={username === "Mor" || username === "Methaq"}
      />
    );
  }

  if (currentView === "grade-management") {
    activeView = (
      <GradeManagement
        onBack={() => setCurrentView("dashboard")}
        students={allStudents || students}
        onUpdateStudents={(updated) => {
          onUpdateStudents(updated);
        }}
        schools={schools}
        grades={grades}
        currentUser={currentUser}
        systemSettings={systemSettings}
      />
    );
  }

  if (currentView === "attendance-management") {
    activeView = (
      <AttendanceManagement
        onBack={() => setCurrentView("dashboard")}
        students={allStudents || students}
        onUpdateStudents={(updated) => {
          onUpdateStudents(updated);
        }}
        schools={schools}
        grades={grades}
        currentUser={currentUser}
        systemSettings={systemSettings}
      />
    );
  }

  if (currentView === "investors") {
    activeView = (
      <InvestorsManagementSubView
        onBack={() => setCurrentView("dashboard")}
        systemSettings={systemSettings}
        onUpdateSettings={onUpdateSettings}
        netProfit={netProfit}
        incrementReceiptCounter={incrementReceiptCounter}
      />
    );
  }

  if (currentView === "previous-debts") {
    activeView = (
      <PreviousDebtsSubView
        onBack={() => setCurrentView("dashboard")}
        students={students}
        onUpdateStudents={(updated) => {
          onUpdateStudents(updated);
        }}
        currentUser={currentUser}
      />
    );
  }

  if (currentView === "taxes") {
    activeView = (
      <TaxesListView
        onBack={() => setCurrentView("dashboard")}
        students={students}
        schools={schools}
        grades={grades}
        systemSettings={systemSettings}
      />
    );
  }

  if (currentView === "profile") {
    activeView = (
      <ProfileView
        onBack={() => setCurrentView("dashboard")}
        currentUser={currentUser}
        username={username}
        onUpdateUser={onUpdateUser}
      />
    );
  }

  if (currentView === "settings") {
    // Same scoping rule as manage-users: hide SuperAdmin-created accounts
    const settingsVisibleUsers = users.filter((u) => {
      if (u.createdBy === "superadmin") return false;
      if (u.notes === "تم الإنشاء بواسطة لوحة تحكم المدير العام") return false;
      if (currentUser?.linkedSchool) {
        return u.linkedSchool === currentUser.linkedSchool ||
               u.createdByUsername === username ||
               (!u.linkedSchool && !u.createdByUsername);
      }
      return true;
    });
    const settingsAddUser = (u: AppUser) =>
      onAddUser({
        ...u,
        createdBy: "school",
        createdByUsername: username,
        linkedSchool: u.linkedSchool || currentUser?.linkedSchool,
      });
    activeView = (
      <SystemSettingsView
        onBack={() => { setSettingsInitialTab(""); setCurrentView("dashboard"); }}
        settings={systemSettings}
        onUpdateSettings={onUpdateSettings}
        users={settingsVisibleUsers}
        onAddUser={settingsAddUser}
        onDeleteUser={onDeleteUser}
        schools={schools}
        onOpenUserManagement={() => setCurrentView("manage-users")}
        onBulkTransfer={onBulkTransfer}
        grades={grades}
        students={students}
        onUpdateGrades={(newGrades) => onUpdateList("grades", newGrades)}
        onUpdateStudents={onUpdateStudents}
        currentUser={currentUser}
        initialSubView={settingsInitialTab || undefined}
        academicYears={academicYears}
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      dir="rtl"
      className={`relative w-full flex h-screen overflow-hidden transition-all duration-300 ${isDark ? "text-slate-100" : "text-slate-800"}`}
      style={isDark
        ? { background: "radial-gradient(circle at top right, #0f172a, #020617)" }
        : { background: "radial-gradient(circle at top right, #f8fafc, #eff6ff)" }
      }
    >
      {/* ── Persistent Left Sidebar ─────────────────────────────── */}
      <AppSidebar
        currentView={currentView === "settings" && settingsInitialTab ? `settings:${settingsInitialTab}` : currentView}
        onNavigate={(v) => {
          // Support compound IDs like "settings:school" → opens settings to that tab
          if (v.startsWith("settings:")) {
            const tab = v.split(":")[1];
            setSettingsInitialTab(tab);
            setCurrentView("settings");
          } else {
            if (currentView !== "settings") setSettingsInitialTab("");
            setCurrentView(v);
          }
          setSidebarOpen(false);
        }}
        systemSettings={systemSettings}
        currentUser={currentUser}
        username={username}
        onLogout={onLogout}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdminMode={isAdminMode}
        onReturnToAdmin={onReturnToAdmin}
      />

      {/* ── Main Content Area (to the right of sidebar) ─────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* ── Slim Top Header ─────────────────────────────────── */}
        <header
          className={`w-full h-14 md:h-16 flex items-center justify-between px-4 md:px-6 shadow-sm z-40 shrink-0 transition-all duration-300 ${
            isDark
              ? "bg-slate-900/95 border-b border-slate-800 backdrop-blur-md"
              : "bg-white/80 backdrop-blur-md border-b border-slate-100"
          }`}
        >
          {/* Hamburger (mobile) + page title */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(true)}
              className={`md:hidden p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}
            >
              <LayoutGrid size={18} />
            </motion.button>
            <div className="hidden md:flex items-center gap-2 text-sm font-black text-slate-400">
              <span>{systemSettings.schoolName || "مدارس مرتضى"}</span>
              <span>/</span>
              <span className={isDark ? "text-white" : "text-slate-700"}>
                {currentView === "dashboard" ? "لوحة التحكم" :
                 currentView === "student-invoices" ? "فواتير الطلاب" :
                 currentView === "expense-invoices" ? "المصروفات" :
                 currentView === "employees" ? "الموظفون" :
                 currentView === "vault" ? "الصندوق" :
                 currentView === "settings" ? "الإعدادات" :
                 currentView === "search-students" ? "بحث عن طالب" :
                 currentView === "investors" ? "المستثمرون" :
                 currentView === "previous-debts" ? "الديون السابقة" :
                 currentView === "taxes" ? "الضرائب" :
                 currentView === "add-student" ? "إضافة طالب" :
                 currentView === "add-expense" ? "إضافة مصروف" :
                 "لوحة التحكم"}
              </span>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black tabular-nums ${isDark ? "bg-slate-800/80 border-slate-800 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-600"}`}>
              <span>{formattedTime}</span>
            </div>
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDark ? "bg-slate-800/80 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
              <span className="text-slate-400">مرحباً</span>
              <span className="font-black">{username}</span>
            </div>

            {/* Current user + data owner indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black border ${isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>@{username}</span>
              <span className="text-[9px] opacity-50">→ بيانات: {(window as any).__dataOwner || username}</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400" : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-600"}`}
              >
                <Bell size={16} />
                {notifications?.some(n => !n.read) && (
                  <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white" />
                )}
              </motion.button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`absolute top-12 left-0 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
                  >
                    <div className={`p-4 flex items-center justify-between border-b ${isDark ? "border-slate-700" : "border-slate-100"}`}>
                      <h3 className={`font-black text-sm ${isDark ? "text-white" : "text-slate-800"}`}>الإشعارات</h3>
                      {notifications?.length > 0 && (
                        <button onClick={onMarkAllAsRead} className="text-[11px] font-bold text-blue-500 hover:text-blue-600">
                          تعيين الكل كمقروء
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {(!notifications || notifications.length === 0) ? (
                        <div className="py-8 text-center text-sm font-bold text-slate-400">لا توجد إشعارات</div>
                      ) : notifications.slice(0, 8).map((n, i) => (
                        <div key={i} className={`px-4 py-3 border-b last:border-0 ${isDark ? "border-slate-700/50 hover:bg-slate-700/30" : "border-slate-50 hover:bg-slate-50"} ${!n.read ? (isDark ? "bg-blue-500/10" : "bg-blue-50/60") : ""} transition-colors`}>
                          <p className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{n.message}</p>
                          <p className={`text-[10px] font-bold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{n.timestamp}</p>
                        </div>
                      ))}
                    </div>
                    {notifications?.length > 0 && (
                      <div className={`p-3 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
                        <button onClick={onClearNotifications} className="w-full text-xs font-black text-rose-500 hover:text-rose-600 py-1">
                          مسح جميع الإشعارات
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export */}
            <ExportButton
              username={username}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${isDark ? "bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700" : "bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50"}`}
            />
          </div>
        </header>

        {/* ── Page content (views render here as absolute inset-0) ── */}


      {/* ═══════════════════════════════════════════════════════
          لوحة التحكم الرئيسية — تصميم احترافي مع انيميشنات
          ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-hidden relative" dir="rtl">

        {/* ── If a sub-view is active, render it absolute inset-0 inside main.
            The sidebar stays visible to the right at all times. ───────── */}
        {activeView}

        {/* ── Dashboard content (shown only when no sub-view is active) ── */}
        {!activeView && (
        <div className="absolute inset-0 overflow-y-auto scroll-smooth">

        {/* ── شريط الترحيب ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`px-4 sm:px-8 md:px-12 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isDark ? "border-b border-slate-800" : "border-b border-slate-100"}`}
        >
          <div>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"
              >
                <GraduationCap size={20} className="text-white" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className={`text-xl sm:text-2xl md:text-3xl font-black leading-tight ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  {systemSettings?.schoolName || "مدارس مرتضى"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-400"}`}
                >
                  مرحباً {username} — {new Date().toLocaleDateString("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </motion.p>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black border ${isDark ? "bg-slate-800 border-slate-700 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <AcademicYearSelector
                activeYear={activeYear || systemSettings?.academicYear || "2025-2026"}
                academicYears={academicYears || []}
                onSwitch={onSwitchYear || (() => {})}
                onAdd={onAddAcademicYear || (() => false)}
                onEdit={onEditAcademicYear || (() => {})}
                onDelete={onDeleteAcademicYear || (() => {})}
              />
          </motion.div>
        </motion.div>

        {/* ── شريط الاختصارات الرئيسي ──────────────────────────── */}
        <div className={`px-4 sm:px-8 md:px-12 py-4 ${isDark ? "border-b border-slate-800" : "border-b border-slate-100/80"}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs font-black ${isDark ? "text-slate-400" : "text-slate-500"}`}>⚡ الاختصارات</span>
            <div className={`flex-1 h-px ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {[
              { label: "إضافة طالب", view: "add-student", icon: <UserPlus size={15}/>, bg: isDark ? "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:shadow-md hover:shadow-blue-500/10" },
              { label: "بحث", view: "search-students", icon: <Search size={15}/>, bg: isDark ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25" : "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 hover:shadow-md hover:shadow-cyan-500/10" },
              { label: "دفع قسط", view: "student-invoices", icon: <Receipt size={15}/>, bg: isDark ? "bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25" : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:shadow-md hover:shadow-orange-500/10" },
              { label: "الصندوق", view: "vault", icon: <Wallet size={15}/>, bg: isDark ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/25" : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:shadow-md hover:shadow-indigo-500/10" },
              { label: "مصروف", view: "add-expense", icon: <Plus size={15}/>, bg: isDark ? "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:shadow-md hover:shadow-rose-500/10" },
              { label: "المصروفات", view: "expense-invoices", icon: <FileText size={15}/>, bg: isDark ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:shadow-md hover:shadow-amber-500/10" },
              { label: "إيراد", view: "add-additional-revenue", icon: <TrendingUp size={15}/>, bg: isDark ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-md hover:shadow-emerald-500/10" },
              { label: "الموظفين", view: "employees", icon: <Users size={15}/>, bg: isDark ? "bg-teal-500/15 text-teal-400 border-teal-500/30 hover:bg-teal-500/25" : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:shadow-md hover:shadow-teal-500/10" },
              { label: "الحضور", view: "attendance", icon: <CalendarCheck size={15}/>, bg: isDark ? "bg-violet-500/15 text-violet-400 border-violet-500/30 hover:bg-violet-500/25" : "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 hover:shadow-md hover:shadow-violet-500/10" },
              { label: "الإعدادات", view: "settings", icon: <Settings size={15}/>, bg: isDark ? "bg-slate-500/15 text-slate-400 border-slate-500/30 hover:bg-slate-500/25" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:shadow-md hover:shadow-slate-500/10" },
            ].map((s, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                onClick={() => setCurrentView(s.view)}
                style={{ willChange: "transform" }}
                title={s.label}
                className={`flex items-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-xl text-xs font-black border whitespace-nowrap transition-all duration-200 ${s.bg}`}
              >
                {s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-8 md:px-12 py-6 space-y-6">

          {/* ── بطاقات الإحصاءات ──────────────────────────────── */}
          {(() => {
            const totalStudents = students.length;
            const paidStudents = students.filter(s =>
              (s.payments || []).filter(p => !(p as any).isWithdrawn).reduce((a, p) => a + p.amount, 0) > 0).length;
            const totalDebt = students.reduce((sum, s) => {
              const remaining = Math.max(0, s.tuition - (s.discount || 0) - (s.payments || []).filter(p => !(p as any).isWithdrawn).reduce((a, p) => a + p.amount, 0));
              return sum + remaining;
            }, 0);

            const statCards = [
              {
                label: "إجمالي الطلاب", value: totalStudents, suffix: "طالب",
                icon: <GraduationCap size={22} />, from: "from-blue-500", to: "to-blue-700",
                shadow: "shadow-blue-500/25", ring: "ring-blue-100",
                sub: `${paidStudents} طالب يسدد`,
                trend: "neutral" as const,
                view: "search-students",
              },
              {
                label: "إجمالي الإيرادات", value: totalRevenue, isMoney: true,
                icon: <Wallet size={22} />, from: "from-emerald-500", to: "to-teal-600",
                shadow: "shadow-emerald-500/25", ring: "ring-emerald-100",
                sub: "إجمالي المقبوضات",
                trend: "up" as const,
                view: "vault",
              },
              {
                label: "إجمالي المصروفات", value: totalExpenses, isMoney: true,
                icon: <Receipt size={22} />, from: "from-rose-500", to: "to-red-600",
                shadow: "shadow-rose-500/25", ring: "ring-rose-100",
                sub: `${expenses.length} مصروف مسجل`,
                trend: "down" as const,
                view: "expense-invoices",
              },
              {
                label: "صافي الربح", value: netProfit, isMoney: true,
                icon: netProfit >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />,
                from: netProfit >= 0 ? "from-indigo-500" : "from-rose-500",
                to: netProfit >= 0 ? "to-purple-600" : "to-red-700",
                shadow: "shadow-indigo-500/25", ring: "ring-indigo-100",
                sub: netProfit >= 0 ? "ربح صافي" : "خسارة",
                trend: (netProfit >= 0 ? "up" : "down") as "up" | "down",
                view: "vault",
              },
              {
                label: "الديون المتبقية", value: totalDebt, isMoney: true,
                icon: <ClipboardList size={22} />, from: "from-amber-500", to: "to-orange-600",
                shadow: "shadow-amber-500/25", ring: "ring-amber-100",
                sub: `${students.filter(s => Math.max(0, s.tuition - (s.discount || 0) - (s.payments || []).filter(p => !(p as any).isWithdrawn).reduce((a, p) => a + p.amount, 0)) > 0).length} طالب متبقي`,
                trend: "down" as const,
                view: "student-invoices",
              },
              {
                label: "الموظفون", value: employees.length, suffix: "موظف",
                icon: <Users size={22} />, from: "from-teal-500", to: "to-cyan-600",
                shadow: "shadow-teal-500/25", ring: "ring-teal-100",
                sub: `رواتب: ${new Intl.NumberFormat("en-US").format(employees.reduce((s, e) => s + (e.salary || 0), 0))}`,
                trend: "neutral" as const,
                view: "employees",
              },
            ];

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {statCards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ y: -8, scale: 1.07, zIndex: 10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentView(card.view)}
                    style={{ willChange: "transform" }}
                    className={`cursor-pointer rounded-2xl p-4 relative overflow-hidden border-2 ${isDark ? "bg-slate-800/80 border-slate-700/50" : "bg-white border-slate-50"} shadow-lg hover:shadow-2xl ${card.shadow} hover:ring-4 ${card.ring} transition-shadow duration-300`}
                  >
                    {/* Gradient blob in background */}
                    <div className={`absolute -top-4 -left-4 w-20 h-20 rounded-full bg-gradient-to-br ${card.from} ${card.to} opacity-10`} />
                    {/* Animated trend arrow indicator (top-left corner) */}
                    <TrendArrow trend={card.trend} delay={i * 0.07 + 0.3} />
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.from} ${card.to} flex items-center justify-center text-white shadow-md mb-3 relative z-10`}>
                      {card.icon}
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-wide mb-1 relative z-10 ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                      {card.label}
                    </p>
                    <AnimatedCounter
                      value={card.value}
                      isMoney={card.isMoney}
                      suffix={card.suffix}
                      isDark={isDark}
                    />
                    <p className={`text-[9px] font-bold mt-1.5 flex items-center gap-1 relative z-10 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      <span className="truncate">{card.sub}</span>
                    </p>
                  </motion.div>
                ))}
              </div>
            );
          })()}

          {/* ── الرسم البياني + آخر الطلاب ──────────────────── */}
          {(() => {
            const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
            const arabicDigits = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩","١٠","١١","١٢"];
            const currentYear = new Date().getFullYear();
            const chartData = months.map((m, mi) => {
              const income = students.reduce((sum, s) =>
                sum + (s.payments || []).filter(p => {
                  const d = new Date(p.date || "");
                  return d.getFullYear() === currentYear && d.getMonth() === mi;
                }).reduce((a, p) => a + p.amount, 0), 0);
              const expense = expenses.filter(e => {
                const d = new Date(e.paymentDate || e.date || "");
                return d.getFullYear() === currentYear && d.getMonth() === mi;
              }).reduce((sum, e) => sum + e.amount, 0);
              return { name: `شهر ${arabicDigits[mi + 1]}`, fullName: m, monthIndex: mi, income, expense };
            });

            const recentStudents = [...students]
              .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
              .slice(0, 5);

            const topStudents = [...students]
              .sort((a, b) => {
                const paidA = (a.payments || []).filter((p: any) => !p.isWithdrawn).reduce((s, p) => s + p.amount, 0);
                const paidB = (b.payments || []).filter((p: any) => !p.isWithdrawn).reduce((s, p) => s + p.amount, 0);
                return paidB - paidA;
              })
              .slice(0, 5);

            // Number formatter: full numbers with commas (no abbreviations)
            const fmtFull = (v: number) => new Intl.NumberFormat("en-US").format(v);
            // Y-axis: keep clean — show full numbers using commas
            const yFormatter = (v: number) => fmtFull(v);

            return (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`xl:col-span-2 rounded-2xl p-5 border ${isDark ? "bg-slate-800/80 border-slate-700/50" : "bg-white border-slate-100"} shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-800"}`}>الإيرادات والمصروفات الشهرية</h3>
                      <p className={`text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-400"}`}>السنة {currentYear}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
                          <TrendingUp size={11} className="text-emerald-500"/>
                        </span>
                        <span className={isDark ? "text-slate-300" : "text-slate-600"}>إيرادات</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-rose-500/20 flex items-center justify-center">
                          <TrendingDown size={11} className="text-rose-500"/>
                        </span>
                        <span className={isDark ? "text-slate-300" : "text-slate-600"}>مصروفات</span>
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} barGap={6} barSize={14} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#f1f5f9"} vertical={false}/>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "Cairo", fill: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }} axisLine={false} tickLine={false} interval={0}/>
                      <YAxis tick={{ fontSize: 9, fontFamily: "Cairo", fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} tickFormatter={yFormatter} width={70}/>
                      <Tooltip
                        cursor={{ fill: isDark ? "#33415540" : "#f1f5f940" }}
                        contentStyle={{ background: isDark ? "#1e293b" : "#fff", border: "1px solid " + (isDark ? "#334155" : "#e2e8f0"), borderRadius: "12px", fontFamily: "Cairo", fontSize: "12px", direction: "rtl", padding: "10px 14px" }}
                        formatter={(v: any, n: any) => [fmtFull(v) + " د.ع", n]}
                        labelFormatter={(label: any, payload: any) => {
                          const item = payload?.[0]?.payload;
                          return item?.fullName ? `${item.fullName} ${currentYear}` : label;
                        }}
                        labelStyle={{ color: isDark ? "#f1f5f9" : "#334155", fontWeight: 900, marginBottom: "4px" }}
                      />
                      <Bar dataKey="income" fill="url(#incomeGradient)" radius={[8, 8, 0, 0]} name="إيرادات" animationDuration={1200} animationBegin={200}/>
                      <Bar dataKey="expense" fill="url(#expenseGradient)" radius={[8, 8, 0, 0]} name="مصروفات" animationDuration={1200} animationBegin={400}/>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Top students */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  className={`rounded-2xl p-5 border ${isDark ? "bg-slate-800/80 border-slate-700/50" : "bg-white border-slate-100"} shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-800"}`}>أعلى المسددين</h3>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentView("search-students")}
                      className={`text-[11px] font-black px-3 py-1.5 rounded-xl ${isDark ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100"} transition-colors`}
                    >
                      عرض الكل
                    </motion.button>
                  </div>
                  <div className="space-y-2">
                    {topStudents.length === 0 ? (
                      <div className={`text-center py-8 text-sm font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>لا يوجد طلاب بعد</div>
                    ) : topStudents.map((s, i) => {
                      const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
                      const pct = s.tuition > 0 ? Math.min(100, Math.round((paid / (s.tuition - (s.discount || 0))) * 100)) : 0;
                      const colors = ["bg-blue-500","bg-emerald-500","bg-amber-500","bg-purple-500","bg-rose-500"];
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.06 }}
                          className={`flex items-center gap-3 p-2 rounded-xl transition-all hover:scale-[1.01] cursor-pointer ${isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                          onClick={() => setCurrentView("students")}
                        >
                          <div className={`w-8 h-8 rounded-xl ${colors[i]} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>{s.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`flex-1 h-1.5 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-100"} overflow-hidden`}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ delay: 0.7 + i * 0.06, duration: 0.8, ease: "easeOut" }}
                                  className={`h-full rounded-full ${colors[i]}`}
                                />
                              </div>
                              <span className={`text-[10px] font-bold shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{pct}%</span>
                            </div>
                          </div>
                          <div className={`text-[10px] font-black shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                            {new Intl.NumberFormat("en-US").format(paid)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            );
          })()}

          {/* ── آخر الطلاب المضافين + ملخص سريع ──────────────── */}
          {(() => {
            const recentStudents = [...students]
              .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
              .slice(0, 5);

            const unpaidCount = students.filter(s => (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0) === 0).length;
            const fullyPaidCount = students.filter(s => {
              const rem = s.tuition - (s.discount || 0) - (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
              return rem <= 0 && s.tuition > 0;
            }).length;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent students */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className={`lg:col-span-2 rounded-2xl border ${isDark ? "bg-slate-800/80 border-slate-700/50" : "bg-white border-slate-100"} shadow-lg overflow-hidden`}
                >
                  <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-slate-700/50" : "border-slate-50"}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-blue-500 rounded-full"/>
                      <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-800"}`}>آخر الطلاب المضافين</h3>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentView("students")}
                      className={`text-[11px] font-black px-3 py-1.5 rounded-xl ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"} transition-colors`}
                    >
                      إدارة الطلاب
                    </motion.button>
                  </div>
                  {recentStudents.length === 0 ? (
                    <div className={`text-center py-12 text-sm font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>لم يتم إضافة طلاب بعد</div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                      {recentStudents.map((s, i) => {
                        const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
                        const remaining = Math.max(0, s.tuition - (s.discount || 0) - paid);
                        return (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.05 }}
                            className={`flex items-center gap-3 px-5 py-3 transition-all ${isDark ? "hover:bg-slate-700/30" : "hover:bg-slate-50/80"}`}
                          >
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md`}>
                              {s.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-black truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{s.name}</p>
                              <p className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-400"}`}>{s.grade} • {s.school}</p>
                            </div>
                            <div className="text-left shrink-0">
                              {remaining > 0 ? (
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-50 text-rose-600"}`}>
                                  متبقي {new Intl.NumberFormat("en-US").format(remaining)}
                                </span>
                              ) : (
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                                  مسدد بالكامل ✓
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>

                {/* Quick summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  {/* Payment status */}
                  <div className={`rounded-2xl p-4 border ${isDark ? "bg-slate-800/80 border-slate-700/50" : "bg-white border-slate-100"} shadow-lg`}>
                    <h4 className={`text-[11px] font-black mb-3 flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><Check size={9} className="text-white"/></div>
                      حالة السداد
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: "مسدد بالكامل", count: fullyPaidCount, color: "bg-emerald-500", pct: students.length > 0 ? (fullyPaidCount / students.length) * 100 : 0 },
                        { label: "لم يسدد بعد", count: unpaidCount, color: "bg-rose-400", pct: students.length > 0 ? (unpaidCount / students.length) * 100 : 0 },
                        { label: "سداد جزئي", count: Math.max(0, students.length - fullyPaidCount - unpaidCount), color: "bg-amber-400", pct: students.length > 0 ? (Math.max(0, students.length - fullyPaidCount - unpaidCount) / students.length) * 100 : 0 },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.label}</span>
                            <span className={`text-[10px] font-black ${isDark ? "text-slate-300" : "text-slate-700"}`}>{item.count}</span>
                          </div>
                          <div className={`h-1.5 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-100"} overflow-hidden`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.pct}%` }}
                              transition={{ delay: 0.7 + i * 0.1, duration: 0.9, ease: "easeOut" }}
                              className={`h-full rounded-full ${item.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick actions — Primary shortcuts */}
                  <div className={`rounded-2xl p-5 border ${isDark ? "bg-slate-800/80 border-slate-700/50" : "bg-white border-slate-100"} shadow-lg`}>
                    <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      اختصارات سريعة
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: "إضافة طالب جديد", view: "add-student", icon: <UserPlus size={16}/>, color: "from-blue-500 to-blue-600" },
                        { label: "بحث عن طالب", view: "search-students", icon: <Search size={16}/>, color: "from-cyan-500 to-blue-600" },
                        { label: "فواتير الطلاب", view: "student-invoices", icon: <Receipt size={16}/>, color: "from-orange-500 to-orange-600" },
                        { label: "كشف الصندوق", view: "vault", icon: <Wallet size={16}/>, color: "from-indigo-500 to-purple-600" },
                        { label: "مصروف جديد", view: "add-expense", icon: <Plus size={16}/>, color: "from-rose-500 to-pink-600" },
                        { label: "كشف المصروفات", view: "expense-invoices", icon: <FileText size={16}/>, color: "from-amber-500 to-orange-600" },
                        { label: "إيراد إضافي", view: "add-additional-revenue", icon: <TrendingUp size={16}/>, color: "from-emerald-500 to-green-600" },
                        { label: "إدارة الموظفين", view: "employees", icon: <Users size={16}/>, color: "from-teal-500 to-teal-600" },
                        { label: "الحضور والغياب", view: "attendance", icon: <CalendarCheck size={16}/>, color: "from-violet-500 to-purple-600" },
                        { label: "إعدادات النظام", view: "settings", icon: <Settings size={16}/>, color: "from-slate-500 to-slate-700" },
                      ].map((action, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentView(action.view)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br ${action.color} text-white text-xs font-black shadow-md transition-all`}
                        >
                          {action.icon}
                          <span className="leading-tight">{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()}

          {/* ── قسم الخدمات والأقسام ──────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-800"}`}>الخدمات والأقسام</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}>{orderedTiles.length} قسم</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsArrangeMode(!isArrangeMode)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black flex items-center gap-2 transition-all shadow-sm border ${
                  isArrangeMode
                    ? "bg-amber-500 text-white border-amber-400 shadow-amber-500/20"
                    : isDark ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <LayoutGrid size={13} />
                <span>{isArrangeMode ? "حفظ الترتيب ✓" : "ترتيب الأقسام"}</span>
              </motion.button>
            </div>

            <motion.div
              layout
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3"
            >
              {orderedTiles.map((tile, index) => (
                <DashboardCard
                  key={tile.id}
                  tile={tile}
                  isDark={isDark}
                  isArrangeMode={isArrangeMode}
                  draggable={isArrangeMode}
                  onDragStart={() => handleTileDragStart(index)}
                  onDragOver={(e: any) => handleTileDragOver(e, index)}
                  onDragEnd={handleTileDragEnd}
                  isDragging={draggedTileIndex === index}
                  canMoveLeft={index < orderedTiles.length - 1}
                  canMoveRight={index > 0}
                  onMoveLeft={() => handleMoveTile(index, "left")}
                  onMoveRight={() => handleMoveTile(index, "right")}
                  onClick={() => {
                    if (!isArrangeMode && tile.view) {
                      setCurrentView(tile.view);
                    }
                  }}
                />
              ))}
            </motion.div>
          </div>

        </div>
        </div>
        )}
        {/* end !activeView dashboard wrapper */}
      </main>
      </div>{/* end content area */}
    </motion.div>
  );
};

const DashboardCard = ({
  tile, isDark, onClick, isArrangeMode = false, isDragging = false,
  onMoveLeft, onMoveRight, canMoveLeft = false, canMoveRight = false, ...dragProps
}: {
  tile: DashboardTile; isDark?: boolean; onClick?: () => void;
  isArrangeMode?: boolean; isDragging?: boolean;
  onMoveLeft?: () => void; onMoveRight?: () => void;
  canMoveLeft?: boolean; canMoveRight?: boolean; [key: string]: any;
}) => (
  <motion.div layout
    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
    whileHover={isArrangeMode ? { scale: 1.03 } : { y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: "spring", stiffness: 380, damping: 28 }}
    onClick={onClick}
    className={`group ${isArrangeMode ? "cursor-grab active:cursor-grabbing select-none" : "cursor-pointer"}`}
    {...dragProps}
  >
    <div className={`rounded-2xl p-4 flex flex-col items-center justify-center gap-3 border transition-all duration-300 min-h-[110px] md:min-h-[120px] relative overflow-hidden ${
      isDragging ? "opacity-40 border-dashed border-sky-400"
      : isArrangeMode ? "border-amber-300 bg-amber-50/30"
      : isDark ? "bg-slate-800/70 border-slate-700/60 hover:border-blue-500/40 hover:bg-slate-800"
      : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5"
    }`}>
      {!isArrangeMode && !isDragging && (
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? "from-blue-500/0 group-hover:from-blue-500/5" : "from-blue-50/0 group-hover:from-blue-50/60"} to-transparent transition-all duration-500`} />
      )}
      {isArrangeMode && (
        <div className="absolute top-2 left-2 bg-amber-500/20 text-amber-600 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
          <LayoutGrid size={9} />
        </div>
      )}
      <div className={`p-2.5 rounded-xl ${tile.bgColor} ${tile.color} relative z-10 group-hover:scale-110 transition-transform duration-300`}>
        {React.cloneElement(tile.icon as React.ReactElement, { size: 22, strokeWidth: 2 })}
      </div>
      <span className={`text-[11px] md:text-xs font-bold text-center leading-snug px-1 relative z-10 transition-colors ${isDark ? "text-slate-300 group-hover:text-blue-300" : "text-slate-600 group-hover:text-blue-700"}`}>
        {tile.label}
      </span>
      {isArrangeMode && (
        <div className="flex items-center gap-1.5 relative z-20">
          <button type="button" disabled={!canMoveRight} onClick={(e) => { e.stopPropagation(); if (onMoveRight) onMoveRight(); }}
            className={`p-1 bg-white border rounded-lg transition-all ${!canMoveRight ? "opacity-30 cursor-not-allowed" : "hover:bg-amber-50 border-amber-200 text-amber-600"}`}>
            <ChevronRight size={12} />
          </button>
          <button type="button" disabled={!canMoveLeft} onClick={(e) => { e.stopPropagation(); if (onMoveLeft) onMoveLeft(); }}
            className={`p-1 bg-white border rounded-lg transition-all ${!canMoveLeft ? "opacity-30 cursor-not-allowed" : "hover:bg-amber-50 border-amber-200 text-amber-600"}`}>
            <ChevronLeft size={12} />
          </button>
        </div>
      )}
    </div>
  </motion.div>
);

const SCHOOL_PRESETS = [
  {
    id: "preset1",
    name: "مبنى كلاسيكي أثري",
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "preset2",
    name: "حرم مدرسي حديث",
    url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "preset3",
    name: "مدرج تقني متطور",
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop"
  },
]

export default Desktop;

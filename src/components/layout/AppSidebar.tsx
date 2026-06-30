/**
 * AppSidebar.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Search, DollarSign, Layout, Settings, LogOut, Users, Wallet, Receipt, FileText, UserPlus, GraduationCap, History, TrendingDown, TrendingUp, Home, X, RefreshCw, ListTree, Info, School, MapPin, CalendarCheck, Sun, Moon, Printer, FileSpreadsheet, ArrowLeft } from "lucide-react";
import type { AppUser, SystemSettings } from "@/types";

const AppSidebar = ({
  currentView,
  onNavigate,
  systemSettings,
  currentUser,
  username,
  onLogout,
  isDark,
  onToggleTheme,
  isOpen,
  onClose,
  isAdminMode,
  onReturnToAdmin,
}: {
  currentView: string;
  onNavigate: (v: string) => void;
  systemSettings: SystemSettings;
  currentUser: AppUser | null;
  username: string;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isOpen: boolean;
  onClose: () => void;
  isAdminMode?: boolean;
  onReturnToAdmin?: () => void;
}) => {
  const nav: { label: string | null; items: { view: string; label: string; icon: React.ReactNode; badge?: string }[] }[] = [
    {
      label: null,
      items: [
        { view: "dashboard", label: "لوحة التحكم", icon: <Home size={16} /> },
      ],
    },
    {
      label: "الطلاب",
      items: [
        { view: "student-invoices", label: "فواتير الطلاب", icon: <GraduationCap size={16} /> },
        { view: "add-student", label: "إضافة طالب", icon: <UserPlus size={16} /> },
        { view: "search-students", label: "بحث عن طالب", icon: <Search size={16} /> },
        { view: "previous-debts", label: "الديون السابقة", icon: <History size={16} /> },
        { view: "taxes", label: "الضرائب", icon: <FileSpreadsheet size={16} /> },
      ],
    },
    {
      label: "المالية",
      items: [
        { view: "vault", label: "الصندوق", icon: <Wallet size={16} /> },
        { view: "expense-invoices", label: "قائمة المصروفات", icon: <Receipt size={16} /> },
        { view: "add-expense", label: "إضافة مصروف", icon: <TrendingDown size={16} /> },
        { view: "additional-revenue-list", label: "الإيرادات الإضافية", icon: <DollarSign size={16} /> },
        { view: "investors", label: "المستثمرون", icon: <TrendingUp size={16} /> },
      ],
    },
    {
      label: "الموارد البشرية",
      items: [
        { view: "employees", label: "الموظفون", icon: <Users size={16} /> },
        { view: "payment-inventory", label: "كشف المدفوعات", icon: <FileText size={16} /> },
      ],
    },
    {
      label: "الإدارة",
      items: [
        { view: "settings", label: "إعدادات النظام", icon: <Settings size={16} /> },
        { view: "manage-users", label: "إدارة المستخدمين", icon: <User size={16} /> },
        { view: "grade-management", label: "المراحل الدراسية", icon: <School size={16} /> },
        { view: "attendance-management", label: "الحضور والغياب", icon: <CalendarCheck size={16} /> },
      ],
    },
    {
      label: "إعدادات النظام",
      items: [
        { view: "settings:school", label: "اسم وشعار المدرسة", icon: <School size={16} /> },
        { view: "settings:address", label: "العنوان والموقع", icon: <MapPin size={16} /> },
        { view: "settings:sections", label: "إدارة الشُّعب", icon: <ListTree size={16} /> },
        { view: "settings:print-settings", label: "إعدادات الطباعة", icon: <Printer size={16} /> },
        { view: "settings:rows", label: "إدارة المراحل والأسعار", icon: <Layout size={16} /> },
        { view: "settings:transfer", label: "تحويل جماعي للطلاب", icon: <RefreshCw size={16} /> },
        { view: "settings:about", label: "حول النظام", icon: <Info size={16} /> },
      ],
    },
  ];

  const isAdmin = username === "Mor" || username === "Methaq" ||
    currentUser?.permissions?.includes("admin") ||
    currentUser?.permissions?.includes("settings");

  // NOTE: Defined as a JSX value (not a nested component function) so that
  // React doesn't see a new component type on every render of AppSidebar,
  // which would unmount/remount the sidebar — resetting its internal scroll
  // position and replaying animations every time a parent re-renders.
  const sidebarInner = (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#0f172a" }}>
      {/* Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40 shrink-0 overflow-hidden">
            {systemSettings.schoolLogo
              ? <img src={systemSettings.schoolLogo} alt="logo" className="w-full h-full object-contain" />
              : <GraduationCap size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white font-black text-sm leading-tight truncate">{systemSettings.schoolName || "مدارس مرتضى"}</div>
            <div className="text-slate-500 text-[9px] font-bold">نظام إدارة المدارس</div>
          </div>
          {isAdminMode && onReturnToAdmin && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: -8 }} whileTap={{ scale: 0.92 }}
              onClick={onReturnToAdmin}
              title="الرجوع إلى لوحة الإدارة الرئيسية"
              className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 ring-2 ring-rose-500/20 relative"
            >
              <ArrowLeft size={14} strokeWidth={3} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
            </motion.button>
          )}
        </div>
        <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" style={{ scrollbarWidth: "none" }}>
        {nav.map((group, gi) => {
          if (group.label === "الإدارة" && !isAdmin) return null;
          return (
            <div key={gi} className={gi > 0 ? "mt-3" : ""}>
              {group.label && (
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-3 py-1.5">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <motion.button
                    key={item.view}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { onNavigate(item.view); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all mb-0.5 ${
                      isActive
                        ? "bg-white text-slate-900 shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? "text-blue-600" : ""}`}>{item.icon}</span>
                    <span className="flex-1 text-right leading-tight">{item.label}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-1.5 shrink-0">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onToggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[12px] font-bold"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          <span>{isDark ? "الوضع النهاري" : "الوضع الليلي"}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => { onNavigate("profile"); onClose(); }}
          className="w-full flex items-center gap-2 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl transition-all text-right"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[12px] font-black shrink-0 overflow-hidden ring-2 ring-white/10">
            {currentUser?.profilePicture
              ? <img src={currentUser.profilePicture} alt="avatar" className="w-full h-full object-cover" />
              : (currentUser?.displayName || username).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[11px] font-black truncate">
              {currentUser?.displayName || username}
            </div>
            <div className="text-slate-500 text-[9px] truncate">@{username} • انقر للملف الشخصي</div>
          </div>
          <motion.div
            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onLogout(); }}
            className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut size={14} />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[190] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar — always visible */}
      <div
        className="hidden md:flex flex-col shrink-0"
        style={{ width: "256px", height: "100%", position: "relative", zIndex: 50 }}
      >
        {sidebarInner}
      </div>

      {/* Mobile sidebar — drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed left-0 top-0 h-full z-[195] md:hidden"
            style={{ width: "256px" }}
          >
            {sidebarInner}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Desktop Component ---

export default AppSidebar;

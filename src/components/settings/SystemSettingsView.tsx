/**
 * SystemSettingsView.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Monitor, Search, Settings, Users, Wallet, Receipt, FileText, GraduationCap, TrendingUp, Building, ArrowRight, RefreshCw, ListTree, Info, School, MapPin, CalendarCheck, RotateCcw, Check, Image as ImageIcon, Printer } from "lucide-react";
import type { Student, AppUser, SystemSettings } from "@/types";
import { notify } from "@/utils/notify";
import { PAPER_SIZES } from "@/constants";
import { loadAllUserData } from "@/services/data-service";
import GradesManagementSubView from "@/components/finance/GradesManagementSubView";
import SectionsManagementSubView from "@/components/settings/SectionsManagementSubView";
import PreviousDebtsSubView from "@/components/students/PreviousDebtsSubView";
import BulkTransfer from "@/components/students/BulkTransfer";
import { testConnection } from "@/services/supabase-client";

const SystemSettingsView = ({
  onBack,
  settings,
  onUpdateSettings,
  users,
  onAddUser,
  onDeleteUser,
  schools,
  onOpenUserManagement,
  onBulkTransfer,
  grades,
  students,
  onUpdateGrades,
  onUpdateStudents,
  currentUser,
  initialSubView,
  academicYears,
}: {
  onBack: () => void;
  settings: SystemSettings;
  onUpdateSettings: (s: SystemSettings, silent?: boolean) => void;
  users: AppUser[];
  onAddUser: (u: AppUser) => void | boolean;
  onDeleteUser: (id: string) => void;
  schools: string[];
  onOpenUserManagement: () => void;
  onBulkTransfer: (from: string, to: string) => void;
  grades: string[];
  students: Student[];
  onUpdateGrades: (newGrades: string[]) => void;
  onUpdateStudents?: (s: Student[], isCompleteOverwrite?: boolean) => void;
  currentUser: AppUser | null;
  initialSubView?: string;
  academicYears?: { id: string; name: string }[];
}) => {
  const [activeSubView, setActiveSubView] = useState<
    | "menu"
    | "school"
    | "address"
    | "transfer"
    | "about"
    | "rows"
    | "investors"
    | "sections"
    | "debts"
    | "print-settings"
  >((initialSubView as any) || "menu");
  const [tempSettings, setTempSettings] = useState<SystemSettings>(settings);

  // Sync activeSubView when initialSubView prop changes (sidebar deep-linking)
  useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView as any);
    }
  }, [initialSubView]);

  const handleSave = () => {
    onUpdateSettings(tempSettings);
    setActiveSubView("menu");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("الرجاء اختيار ملف صورة صالح.", "warning");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify("الصورة كبيرة جداً. الحد الأقصى 5MB.", "warning");
      return;
    }
    // Auto-resize to max 512×512 PNG (keeps transparency)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 512;
        const ratio = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setTempSettings((prev) => ({ ...prev, schoolLogo: dataUrl }));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/png");
        setTempSettings((prev) => ({ ...prev, schoolLogo: compressed }));
      };
      img.onerror = () => {
        setTempSettings((prev) => ({ ...prev, schoolLogo: dataUrl }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  if (activeSubView === "debts") {
    return (
      <PreviousDebtsSubView
        onBack={() => setActiveSubView("menu")}
        students={students}
        onUpdateStudents={(newStudents) => {
          if (onUpdateStudents) {
            onUpdateStudents(newStudents);
          }
        }}
        currentUser={currentUser}
      />
    );
  }

  if (activeSubView === "print-settings") {
    const currentPrintSettings = settings.printSettings || { receiptSize: "A4", statementSize: "A4" };
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[70] bg-slate-50 flex flex-col"
        dir="rtl"
      >
        <header className="h-16 bg-violet-500 text-white flex items-center justify-between px-6 shadow-lg shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveSubView("menu")}>
              <ArrowRight size={20} />
            </button>
            <h1 className="font-black text-sm flex items-center gap-2">
              <Printer size={18} />
              إعدادات الطباعة
            </h1>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-3xl bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-10 space-y-10">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-violet-50 text-violet-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Printer size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-800">إعدادات أحجام الطباعة</h2>
                <p className="text-sm font-bold text-slate-400">حدد حجم الورق المناسب لكل نوع من أنواع المطبوعات</p>
              </div>

              {/* Receipt Size */}
              <div className="space-y-4 border border-slate-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <Receipt size={20} className="text-blue-500" />
                  <div>
                    <h3 className="font-black text-slate-700">حجم الوصولات (الإيصالات)</h3>
                    <p className="text-xs font-bold text-slate-400">وصل القبض، وصل المصروفات، وصل صرف أرباح المستثمر</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(["A4", "A5", "A8", "Thermal80"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          printSettings: { ...currentPrintSettings, receiptSize: size },
                        }, true);
                      }}
                      className={`relative p-5 rounded-2xl border-2 font-black transition-all text-center cursor-pointer ${
                        currentPrintSettings.receiptSize === size
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-100"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {currentPrintSettings.receiptSize === size && (
                        <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                      <div className={`mb-1 font-black ${size === "A8" || size === "Thermal80" ? "text-base leading-tight" : "text-2xl"}`}>
                        {PAPER_SIZES[size]?.label || size}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        {size === "A4" ? "210 × 297 ملم" : size === "A5" ? "148 × 210 ملم" : size === "A8" ? "58 ملم × طول مفتوح" : "80 ملم × طول مفتوح"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Statement Size */}
              <div className="space-y-4 border border-slate-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <FileText size={20} className="text-emerald-500" />
                  <div>
                    <h3 className="font-black text-slate-700">حجم كشوفات الحسابات</h3>
                    <p className="text-xs font-bold text-slate-400">كشف حساب الطالب، كشف حساب المستثمر</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(["A4", "A5", "A8", "Thermal80"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          printSettings: { ...currentPrintSettings, statementSize: size },
                        }, true);
                      }}
                      className={`relative p-5 rounded-2xl border-2 font-black transition-all text-center cursor-pointer ${
                        currentPrintSettings.statementSize === size
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {currentPrintSettings.statementSize === size && (
                        <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                      <div className={`mb-1 font-black ${size === "A8" || size === "Thermal80" ? "text-base leading-tight" : "text-2xl"}`}>
                        {PAPER_SIZES[size]?.label || size}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        {size === "A4" ? "210 × 297 ملم" : size === "A5" ? "148 × 210 ملم" : size === "A8" ? "58 ملم × طول مفتوح" : "80 ملم × طول مفتوح"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Info */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h4 className="text-xs font-black text-slate-500 mb-3">الإعدادات الحالية :</h4>
                <div className="grid grid-cols-2 gap-3 text-sm font-bold">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-500">حجم الوصولات</span>
                    <span className="text-blue-600 font-black bg-blue-50 px-3 py-1 rounded-lg">{PAPER_SIZES[currentPrintSettings.receiptSize]?.label || currentPrintSettings.receiptSize}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-500">حجم الكشوفات</span>
                    <span className="text-emerald-600 font-black bg-emerald-50 px-3 py-1 rounded-lg">{PAPER_SIZES[currentPrintSettings.statementSize]?.label || currentPrintSettings.statementSize}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (activeSubView === "system-check") {
    const [checkResult, setCheckResult] = React.useState<{status: string; error: string; testing: boolean}>({status: "idle", error: "", testing: false});
    const [localCounts, setLocalCounts] = React.useState<Record<string, number>>({});
    const [queueLen, setQueueLen] = React.useState(0);

    const runCheck = async () => {
      setCheckResult({status: "testing", error: "", testing: true});
      try {
        const { testSupabaseConnection } = await import("@/services/data-service");
        const result = await testSupabaseConnection();
        setCheckResult({status: result.ok ? "ok" : "error", error: result.error, testing: false});
      } catch (e: any) {
        setCheckResult({status: "error", error: e?.message || "Unknown error", testing: false});
      }
    };

    const countLocal = () => {
      // No longer using localStorage for business data
      setLocalCounts({});
      setQueueLen(0);
    };

    const forceSync = async () => {
      try {
        const { loadAllUserData } = await import("@/services/data-service");
        const username = localStorage.getItem("username") || "";
        if (username) {
          await loadAllUserData(username);
          notify("تمت المزامنة مع السيرفر بنجاح", "success");
        }
      } catch (e: any) {
        notify("فشلت المزامنة: " + (e?.message || ""), "error");
      }
    };

    React.useEffect(() => { runCheck(); countLocal(); }, []);

    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
        style={{background: "radial-gradient(circle at top right, #ecfdf5, #f0fdfa)"}} dir="rtl">
        <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center gap-3">
          <motion.button whileHover={{x:4}} whileTap={{scale:0.95}} onClick={() => setActiveSubView("menu")}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
            <ArrowRight size={16} />
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:300,damping:20}}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Monitor size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800">فحص النظام والاتصال</h1>
              <p className="text-[10px] font-bold text-slate-400">اختبار الاتصال بـ Supabase وحالة البيانات المحلية</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-4">

            {/* Connection Test */}
            <div className={`p-5 rounded-3xl border shadow-sm ${
              checkResult.status === "ok" ? "bg-emerald-50 border-emerald-200" :
              checkResult.status === "error" ? "bg-rose-50 border-rose-200" :
              checkResult.testing ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-800">اتصال Supabase</h3>
                <button onClick={runCheck} disabled={checkResult.testing}
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[11px] font-black transition-all disabled:opacity-50">
                  {checkResult.testing ? "جارٍ الاختبار..." : "إعادة الاختبار"}
                </button>
              </div>
              {checkResult.status === "ok" && (
                <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                  <span className="text-lg">✅</span> الاتصال ناجح — القراءة والكتابة يعملان
                </div>
              )}
              {checkResult.status === "error" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                    <span className="text-lg">❌</span> فشل الاتصال
                  </div>
                  <p className="text-xs font-bold text-rose-600 bg-rose-100 p-3 rounded-xl">{checkResult.error}</p>
                </div>
              )}
              {checkResult.status === "idle" && (
                <p className="text-xs text-slate-500 font-bold">اضغط "إعادة الاختبار" لفحص الاتصال</p>
              )}
            </div>

            {/* Local Data */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-800">البيانات المحلية</h3>
                <button onClick={countLocal}
                  className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-[11px] font-black transition-all">
                  تحديث
                </button>
              </div>
              {Object.keys(localCounts).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(localCounts).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-[10px] font-black text-slate-400 truncate">{k}</p>
                      <p className="text-lg font-black text-slate-800">{v} <span className="text-[10px] text-slate-400">عنصر</span></p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-bold">لا توجد بيانات محلية بعد</p>
              )}
            </div>

            {/* Sync Queue */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 mb-2">طابور المزامنة</h3>
              <p className={`text-sm font-black ${queueLen > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {queueLen > 0 ? `⏳ ${queueLen} عملية بانتظار الإرسال` : "✅ لا توجد عمليات معلّقة"}
              </p>
            </div>

            {/* Manual Sync */}
            <div className="flex gap-3">
              <motion.button whileTap={{scale:0.97}} onClick={forceSync}
                className="flex-1 py-4 rounded-2xl text-white font-black shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all"
                style={{background: "linear-gradient(135deg, #10b981, #0d9488)"}}>
                <RotateCcw size={16} /> مزامنة الآن
              </motion.button>
              <motion.button whileTap={{scale:0.97}} onClick={countLocal}
                className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center gap-2 transition-all">
                <Search size={16} /> تحديث الأعداد
              </motion.button>
            </div>

            {/* Platform info */}
            <div className="bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-500 space-y-1">
              <p>المنصة: {typeof (window as any).electronAPI !== 'undefined' ? 'تطبيق سطح المكتب (Electron)' : 'متصفح ويب'}</p>
              <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'افتراضي'}</p>
              <p>البيانات: محفوظة في Supabase</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (activeSubView === "sections") {
    return (
      <SectionsManagementSubView
        onBack={() => setActiveSubView("menu")}
        systemSettings={settings}
        onUpdateSettings={onUpdateSettings}
        students={students}
      />
    );
  }

  if (activeSubView === "rows") {
    return (
      <GradesManagementSubView
        onBack={() => setActiveSubView("menu")}
        grades={grades}
        onUpdateGrades={onUpdateGrades}
        systemSettings={settings}
        onUpdateSettings={onUpdateSettings}
        students={students}
        onUpdateStudents={onUpdateStudents}
      />
    );
  }

  if (activeSubView === "school") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(circle at top right, #fff1f2, #ffe4e6)" }}
        dir="rtl"
      >
        <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ x: 4 }} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSubView("menu")}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowRight size={16} />
            </motion.button>
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30"
              >
                <School size={18} />
              </motion.div>
              <div>
                <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">اسم وشعار المدرسة</h1>
                <p className="text-[10px] font-bold text-slate-400">البيانات الأساسية اللي تظهر على الإيصالات والتقارير</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 pr-1"
            >
              <div className="w-1.5 h-5 bg-rose-500 rounded-full" />
              <h2 className="text-sm font-black text-slate-700">معاينة وتعديل البيانات</h2>
            </motion.div>

            {/* Preview card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Top — preview banner */}
              <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-6 overflow-hidden">
                <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl"/>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"/>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="w-28 h-28 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-white/30"
                  >
                    {tempSettings.schoolLogo ? (
                      <img src={tempSettings.schoolLogo} alt="Logo" className="w-full h-full object-contain"/>
                    ) : (
                      <ImageIcon size={40} className="text-slate-300" />
                    )}
                  </motion.div>
                  <div className="text-center sm:text-right text-white">
                    <p className="text-[11px] font-black opacity-80 uppercase tracking-widest">معاينة مباشرة</p>
                    <h3 className="text-2xl md:text-3xl font-black mt-1">{tempSettings.schoolName || "اسم المدرسة"}</h3>
                    <p className="text-[11px] font-bold opacity-90 mt-1">السنة الدراسية {tempSettings.academicYear}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-5 md:p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 pr-1">
                    <School size={11}/> اسم المدرسة
                  </label>
                  <input
                    type="text"
                    value={tempSettings.schoolName}
                    onChange={(e) =>
                      setTempSettings((prev) => ({
                        ...prev,
                        schoolName: e.target.value,
                      }))
                    }
                    placeholder="مثال: مدارس مرتضى الأهلية"
                    className="w-full bg-slate-50 py-3 px-4 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-300 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-200 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 pr-1">
                    <ImageIcon size={11}/> شعار المدرسة
                  </label>
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <div className="w-full bg-rose-50 hover:bg-rose-100 border-2 border-dashed border-rose-200 hover:border-rose-300 transition-all p-5 rounded-xl flex items-center justify-center gap-3 text-rose-600">
                      <ImageIcon size={18}/>
                      <span className="text-xs font-black">
                        {tempSettings.schoolLogo ? "تغيير الشعار" : "ارفع شعار المدرسة"}
                      </span>
                    </div>
                  </label>
                  <p className="text-[10px] font-bold text-slate-400 mr-1">يفضّل صورة مربعة بحجم 512×512 أو أكبر بصيغة PNG شفافة</p>
                </div>
              </div>
            </motion.div>

            {/* Save button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="w-full text-white font-black py-4 rounded-2xl shadow-2xl shadow-rose-500/30 flex items-center justify-center gap-3 transition-all relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #db2777 100%)" }}
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="inline-flex"
              >
                <Check size={18} strokeWidth={3} />
              </motion.span>
              <span>حفظ بيانات المدرسة</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (activeSubView === "transfer") {
    return (
      <BulkTransfer
        onBack={() => setActiveSubView("menu")}
        grades={grades}
        students={students}
        onBulkTransfer={onBulkTransfer}
      />
    );
  }

  if (activeSubView === "address") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(circle at top right, #f0f9ff, #e0f2fe)" }}
        dir="rtl"
      >
        <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ x: 4 }} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSubView("menu")}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowRight size={16} />
            </motion.button>
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30"
              >
                <MapPin size={18} />
              </motion.div>
              <div>
                <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">عنوان المدرسة</h1>
                <p className="text-[10px] font-bold text-slate-400">يظهر العنوان على الإيصالات والتقارير الرسمية</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 pr-1"
            >
              <div className="w-1.5 h-5 bg-sky-500 rounded-full" />
              <h2 className="text-sm font-black text-slate-700">العنوان الكامل للمدرسة</h2>
            </motion.div>

            {/* Address card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Top banner */}
              <div className="relative bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600 p-5 overflow-hidden">
                <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"/>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"/>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white ring-2 ring-white/30">
                    <Building size={22} />
                  </div>
                  <div className="text-white">
                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">المدرسة</p>
                    <h3 className="text-lg font-black">{tempSettings.schoolName || "اسم المدرسة"}</h3>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-5 md:p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 pr-1">
                    <MapPin size={11}/> العنوان الكامل
                  </label>
                  <textarea
                    value={tempSettings.address}
                    onChange={(e) =>
                      setTempSettings((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="مثال: البصرة - الزبير - شارع الإمام علي - مقابل مدرسة الأمل الابتدائية"
                    className="w-full bg-slate-50 p-4 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 border border-slate-100 font-bold focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-200 focus:bg-white min-h-[140px] text-right resize-none transition-all leading-relaxed"
                  />
                  <p className="text-[10px] font-bold text-slate-400 mr-1">
                    اذكر المحافظة والقضاء والشارع وأقرب نقطة دالة. كلما كان العنوان أوضح، كانت مراجعة المدرسة أسهل لأولياء الأمور.
                  </p>
                </div>

                {/* Preview chip */}
                {tempSettings.address && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex items-start gap-2"
                  >
                    <Info size={14} className="text-sky-600 mt-0.5 shrink-0"/>
                    <p className="text-[11px] font-bold text-sky-700 leading-relaxed">
                      <span className="text-sky-900">معاينة الإيصال:</span> {tempSettings.address}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Save button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="w-full text-white font-black py-4 rounded-2xl shadow-2xl shadow-sky-500/30 flex items-center justify-center gap-3 transition-all relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0891b2 100%)" }}
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="inline-flex"
              >
                <MapPin size={18} strokeWidth={3} />
              </motion.span>
              <span>حفظ العنوان</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (activeSubView === "about") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(circle at top right, #fffbeb, #fef3c7)" }}
        dir="rtl"
      >
        <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ x: 4 }} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSubView("menu")}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowRight size={16} />
            </motion.button>
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30"
              >
                <Info size={18} />
              </motion.div>
              <div>
                <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">حول النظام</h1>
                <p className="text-[10px] font-bold text-slate-400">معلومات عن نظام المدارس الذكية والمطوّر</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-5 pb-12">

            {/* Hero card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #c2410c 100%)" }}
            >
              <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl"/>
              <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-2xl"/>

              <div className="relative z-10 text-center text-white space-y-4">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.2 }}
                  className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-md rounded-3xl ring-4 ring-white/30 flex items-center justify-center"
                >
                  <GraduationCap size={42} className="text-white" strokeWidth={2}/>
                </motion.div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black">نظام المدارس الذكية</h2>
                  <p className="text-[11px] font-black opacity-90 tracking-widest uppercase mt-1">
                    Integrated Smart School Management
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black border border-white/20">
                    الإصدار 1.0.0
                  </span>
                  <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black border border-white/20">
                    © 2026 جميع الحقوق محفوظة
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Description card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white p-6 md:p-7 rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 bg-amber-500 rounded-full"/>
                <h3 className="text-sm font-black text-slate-700">عن النظام</h3>
              </div>
              <p className="text-sm font-bold text-slate-600 leading-loose">
                نظام المدارس الذكية هو نظام إداري متكامل تم تطويره بواسطة <span className="text-amber-600 font-black">أحمد الغزي</span> لخدمة المدارس الأهلية وتسهيل إدارة أعمالها اليومية. يهدف النظام إلى تنظيم المعاملات المالية وإدارة الوصولات والسجلات الإدارية بكفاءة عالية، مما يساعد إدارات المدارس على توفير الوقت وتقليل الجهد والأخطاء الناتجة عن المعاملات الورقية. كما يوفر النظام أدوات تساعد على متابعة مختلف العمليات الإدارية والمالية بشكل سهل ومنظم، بما يسهم في تحسين سير العمل داخل المدرسة ورفع مستوى الإدارة والتنظيم.
              </p>
            </motion.div>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {[
                { icon: <Wallet size={18}/>, label: "إدارة مالية", from: "from-emerald-500", to: "to-teal-600", shadow: "shadow-emerald-500/25" },
                { icon: <FileText size={18}/>, label: "وصولات ذكية", from: "from-blue-500", to: "to-indigo-600", shadow: "shadow-blue-500/25" },
                { icon: <Users size={18}/>, label: "سجلات الطلاب", from: "from-violet-500", to: "to-purple-600", shadow: "shadow-violet-500/25" },
                { icon: <TrendingUp size={18}/>, label: "تقارير دقيقة", from: "from-rose-500", to: "to-pink-600", shadow: "shadow-rose-500/25" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-lg ${f.shadow} text-center relative overflow-hidden`}
                >
                  <div className={`absolute -top-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-br ${f.from} ${f.to} opacity-10`}/>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.from} ${f.to} flex items-center justify-center text-white shadow-md mx-auto mb-2 relative z-10`}>
                    {f.icon}
                  </div>
                  <p className="text-xs font-black text-slate-700 relative z-10">{f.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Developer credit card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-lg shrink-0">
                <User size={22} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المطوّر</p>
                <h4 className="text-base font-black text-slate-800">أحمد الغزي</h4>
                <p className="text-[11px] font-bold text-slate-400">مطوّر ومصمم النظام</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #f8fafc, #eff6ff)" }}
      dir="rtl"
    >
      {/* ── Modern light header ─────────────────────────────── */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ x: 4 }} whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowRight size={16} />
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white shadow-lg shadow-slate-500/30"
            >
              <Settings size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">إعدادات النظام</h1>
              <p className="text-[10px] font-bold text-slate-400">إدارة شاملة لمدرستك ـ {tempSettings.schoolName || "المدرسة"} • السنة {tempSettings.academicYear}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Academic year card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <CalendarCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">السنة الدراسية الحالية</h3>
                <p className="text-[10px] font-bold text-slate-400">تُستخدم في الإيصالات والتقارير</p>
              </div>
            </div>
            <select
              value={tempSettings.academicYear}
              onChange={(e) =>
                setTempSettings((prev) => ({
                  ...prev,
                  academicYear: e.target.value,
                }))
              }
              className="h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 font-bold text-sm text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-200 focus:bg-white transition-all"
            >
              {(academicYears || [
                { id: "y2026", name: "2026-2027" },
                { id: "y2025", name: "2025-2026" },
                { id: "y2024", name: "2024-2025" },
              ]).map(y => (
                <option key={y.id} value={y.name}>{y.name}</option>
              ))}
            </select>
          </motion.div>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-2 pr-1"
          >
            <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
            <h2 className="text-sm font-black text-slate-700">إعدادات وتخصيصات النظام</h2>
            <span className="text-[10px] font-bold text-slate-400">— اختر الإعداد المطلوب لتعديله</span>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              {
                id: "about",
                label: "حول التطبيق",
                icon: <Info size={22} />,
                from: "from-amber-500", to: "to-orange-600",
                shadow: "shadow-amber-500/25",
                desc: "معلومات النسخة",
              },
              {
                id: "school",
                label: "اسم وشعار المدرسة",
                icon: <School size={22} />,
                from: "from-rose-500", to: "to-pink-600",
                shadow: "shadow-rose-500/25",
                desc: "البيانات الأساسية",
              },
              {
                id: "transfer",
                label: "ترحيل ونقل الطلاب",
                icon: <RefreshCw size={22} />,
                from: "from-emerald-500", to: "to-teal-600",
                shadow: "shadow-emerald-500/25",
                desc: "ترقية جماعية",
              },
              {
                id: "address",
                label: "العنوان والموقع",
                icon: <MapPin size={22} />,
                from: "from-sky-500", to: "to-blue-600",
                shadow: "shadow-sky-500/25",
                desc: "خريطة الموقع",
              },
              {
                id: "rows",
                label: "إدارة المراحل والأسعار",
                icon: <ListTree size={22} />,
                from: "from-indigo-500", to: "to-purple-600",
                shadow: "shadow-indigo-500/25",
                desc: "أسماء المراحل وأقساطها",
              },
              {
                id: "sections",
                label: "إدارة الشُّعب",
                icon: <Users size={22} />,
                from: "from-cyan-500", to: "to-teal-600",
                shadow: "shadow-cyan-500/25",
                desc: "أ، ب، ج...",
              },
              {
                id: "print-settings",
                label: "إعدادات الطباعة",
                icon: <Printer size={22} />,
                from: "from-violet-500", to: "to-purple-600",
                shadow: "shadow-violet-500/25",
                desc: "A4، A5، حراري",
              },
              {
                id: "system-check",
                label: "فحص النظام والاتصال",
                icon: <Monitor size={22} />,
                from: "from-emerald-500", to: "to-teal-600",
                shadow: "shadow-emerald-500/25",
                desc: "اختبار Supabase + البيانات المحلية",
              },
            ].map((tile, i) => (
              <motion.button
                key={tile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveSubView(tile.id as any)}
                className={`cursor-pointer rounded-2xl p-4 relative overflow-hidden border border-slate-100 bg-white shadow-lg ${tile.shadow} hover:ring-4 hover:ring-slate-100 transition-all text-right`}
              >
                <div className={`absolute -top-4 -left-4 w-20 h-20 rounded-full bg-gradient-to-br ${tile.from} ${tile.to} opacity-10`}/>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tile.from} ${tile.to} flex items-center justify-center text-white shadow-md mb-3 relative z-10`}>
                  {tile.icon}
                </div>
                <p className="text-sm font-black text-slate-800 mb-0.5 relative z-10">{tile.label}</p>
                <p className="text-[10px] font-bold text-slate-400 relative z-10">{tile.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- School Map View ---

export default SystemSettingsView;

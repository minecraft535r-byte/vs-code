/**
 * VaultReport.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Search, DollarSign, Users, Wallet, Receipt, GraduationCap, TrendingDown, TrendingUp, ArrowRight, ClipboardList, Download, RotateCcw, AlertTriangle, Filter, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Student, Expense, AdditionalRevenue, AppUser, SystemSettings } from "@/types";
import { notify } from "@/utils/notify";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import TrendArrow from "@/components/ui/TrendArrow";
import PrintReport from "@/components/print/PrintReport";

const VaultReport = ({
  onBack,
  students,
  expenses,
  additionalRevenue: revenues,
  onReset,
  currentUser,
  systemSettings,
}: {
  onBack: () => void;
  students: Student[];
  expenses: Expense[];
  additionalRevenue: AdditionalRevenue[];
  onReset: () => void;
  currentUser: AppUser | null;
  systemSettings?: SystemSettings;
}) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showPrint, setShowPrint] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPasscode, setResetPasscode] = useState("");
  const [isReseting, setIsReseting] = useState(false);
  const [vaultSearch, setVaultSearch] = useState("");
  const [vaultCategory, setVaultCategory] = useState<"all" | "students" | "expenses" | "revenue">("all");

  const handleReset = () => {
    if (resetPasscode === currentUser?.password) {
      onReset();
      setShowResetConfirm(false);
      setResetPasscode("");
    } else {
      notify("كلمة المرور غير صحيحة", "warning");
    }
  };

  // Filter logic — date range + search + category
  const q = vaultSearch.toLowerCase();
  const filteredStudents = students.filter(
    (s) => s.date >= startDate && s.date <= endDate && (!q || s.name.toLowerCase().includes(q)),
  );
  const filteredExpenses = expenses.filter((e) => {
    const d = e.paymentDate || e.date;
    return d >= startDate && d <= endDate && (!q || e.title.toLowerCase().includes(q) || e.receiver.toLowerCase().includes(q));
  });
  const filteredRevenues = revenues.filter((r) => {
    const d = r.receivedDate || r.date;
    return d >= startDate && d <= endDate && (!q || r.title.toLowerCase().includes(q) || r.payer.toLowerCase().includes(q));
  });

  // Calculate actual revenue from payments in the range
  const studentRevenue = (vaultCategory === "expenses" || vaultCategory === "revenue") ? 0 : students.reduce((acc, s) => {
    const rangePayments = (s.payments || []).filter(
      (p) => p.date >= startDate && p.date <= endDate,
    );
    if (q && !s.name.toLowerCase().includes(q)) return acc;
    return acc + rangePayments.reduce((pAcc, p) => pAcc + p.amount, 0);
  }, 0);

  const totalExpenses = (vaultCategory === "students" || vaultCategory === "revenue") ? 0 : filteredExpenses
    .filter((e) => e.status === "paid")
    .reduce((acc, e) => acc + e.amount, 0);
  const additionalRevenueSum = (vaultCategory === "students" || vaultCategory === "expenses") ? 0 : filteredRevenues
    .filter((r) => r.status === "received")
    .reduce((acc, r) => acc + r.amount, 0);
  const salaries = (vaultCategory === "students" || vaultCategory === "revenue") ? 0 : filteredExpenses
    .filter((e) => e.type === "رواتب" && e.status === "paid")
    .reduce((acc, e) => acc + e.amount, 0);

  const netVault = studentRevenue + additionalRevenueSum - totalExpenses;

  // For remaining sums, let's calculate from current students
  const remainingSums = students.reduce((acc, s) => {
    const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((pAcc, p) => pAcc + p.amount, 0);
    return acc + (s.tuition - s.discount - paid);
  }, 0);

  const collectionPercentage =
    studentRevenue + remainingSums > 0
      ? ((studentRevenue / (studentRevenue + remainingSums)) * 100).toFixed(1)
      : "0";

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const StatLine = ({
    label,
    value,
    color,
    bg,
  }: {
    label: string;
    value: string;
    color: string;
    bg: string;
  }) => (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${bg} ${color} shadow-sm font-black text-lg`}
    >
      <span className="w-1/3 text-left tabular-nums">{value}</span>
      <span className="flex-1 text-right">{label}</span>
    </div>
  );

  return (
    <>
      {/* Vault Print Report */}
      {showPrint && (() => {
        const vaultRows = [
          { بند:"إيرادات الطلاب (المدفوعات)", المبلغ:new Intl.NumberFormat("en-US").format(studentRevenue), الملاحظة:"خلال الفترة المحددة", __colors:{ المبلغ:"#16a34a" } },
          { بند:"الإيرادات الإضافية", المبلغ:new Intl.NumberFormat("en-US").format(additionalRevenueSum), الملاحظة:"خلال الفترة المحددة", __colors:{ المبلغ:"#16a34a" } },
          { بند:"إجمالي الإيرادات", المبلغ:new Intl.NumberFormat("en-US").format(studentRevenue+additionalRevenueSum), الملاحظة:"", __bold:{ المبلغ:true }, __colors:{ المبلغ:"#16a34a" } },
          { بند:"إجمالي المصروفات", المبلغ:new Intl.NumberFormat("en-US").format(totalExpenses), الملاحظة:"خلال الفترة المحددة", __colors:{ المبلغ:"#dc2626" } },
          { بند:"الرواتب", المبلغ:new Intl.NumberFormat("en-US").format(salaries), الملاحظة:"ضمن المصروفات", __colors:{ المبلغ:"#d97706" } },
          { بند:"صافي الصندوق", المبلغ:new Intl.NumberFormat("en-US").format(netVault), الملاحظة:netVault>=0?"ربح":"خسارة", __bold:{ المبلغ:true }, __colors:{ المبلغ:netVault>=0?"#16a34a":"#dc2626" } },
          { بند:"متبقي على الطلاب", المبلغ:new Intl.NumberFormat("en-US").format(Math.max(0,remainingSums)), الملاحظة:"غير محصّل", __colors:{ المبلغ:"#7c3aed" } },
          { بند:"نسبة التحصيل", المبلغ:collectionPercentage+"%", الملاحظة:"من إجمالي الأقساط", __colors:{ المبلغ:"#0369a1" } },
        ];
        return (
          <PrintReport
            title="كشف الصندوق"
            filterInfo={`من ${startDate} إلى ${endDate}`}
            columns={[
              { label:"البند", key:"بند", width:"40%", align:"right" },
              { label:"المبلغ (د.ع)", key:"المبلغ", width:"30%", align:"center" },
              { label:"ملاحظة", key:"الملاحظة", width:"30%", align:"right" },
            ]}
            rows={vaultRows}
            systemSettings={systemSettings}
            onClose={()=>setShowPrint(false)}
          />
        );
      })()}
      {/* ═══════════════════════════════════════════════════════════
          كشف الصندوق — تصميم حديث متناسق مع الداشبورد
          ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(circle at top right, #f8fafc, #eff6ff)" }}
        dir="rtl"
      >
        {/* Top header bar */}
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Wallet size={18} />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">كشف الصندوق</h1>
                <p className="text-[10px] font-bold text-slate-400">الإيرادات والمصروفات وصافي الرصيد</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPrint(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-black transition-all"
            >
              <Download size={14} /><span>طباعة الكشف</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-xs font-black transition-all"
            >
              <RotateCcw size={13} /><span className="hidden sm:inline">تصفير الحسابات</span>
            </motion.button>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-5">

          {/* Date range filter */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <h3 className="text-sm font-black text-slate-700">فلتر الفترة</h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const d = new Date(); d.setDate(1);
                  setStartDate(d.toISOString().split("T")[0]);
                  setEndDate(new Date().toISOString().split("T")[0]);
                }}
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                هذا الشهر
              </motion.button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 mb-1 block">من تاريخ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 py-2.5 px-3 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 mb-1 block">إلى تاريخ</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 py-2.5 px-3 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
            </div>
          </motion.div>

          {/* Search + Category filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.03 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Search size={14} className="text-slate-400" />
              <h3 className="text-sm font-black text-slate-700">بحث وتصفية</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="ابحث باسم طالب أو مصروف أو وارد..."
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  className="w-full bg-slate-50 py-2.5 pr-10 pl-3 rounded-xl border border-slate-100 text-xs font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                />
              </div>
              <select
                value={vaultCategory}
                onChange={(e) => setVaultCategory(e.target.value as any)}
                className="bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              >
                <option value="all">جميع الفئات</option>
                <option value="students">مدفوعات الطلاب</option>
                <option value="expenses">المصروفات</option>
                <option value="revenue">الإيرادات الإضافية</option>
              </select>
            </div>
            {vaultSearch && (
              <p className="text-[10px] text-blue-600 font-bold mt-2">
                🔍 نتائج البحث عن "{vaultSearch}" — الأرقام أدناه تعكس نتائج البحث فقط
              </p>
            )}
          </motion.div>

          {/* Hero summary card — Net Vault */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl"
            style={{
              background: netVault >= 0
                ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)"
                : "linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%)",
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-20 -right-10 w-60 h-60 rounded-full bg-white/5 blur-2xl" />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="text-white/70 text-[11px] font-black uppercase tracking-widest mb-2">صافي الصندوق</p>
                <div className="flex items-baseline gap-3">
                  <motion.h2
                    key={netVault}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-5xl font-black text-white tabular-nums"
                  >
                    {formatIQD(Math.abs(netVault))}
                  </motion.h2>
                  <span className="text-white/80 text-lg md:text-xl font-black">د.ع</span>
                </div>
                <p className="text-white/60 text-xs font-bold mt-2">
                  {netVault >= 0 ? "ربح إجمالي خلال الفترة" : "خسارة إجمالية خلال الفترة"}
                  {" • "}من {startDate} إلى {endDate}
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="hidden md:flex w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md items-center justify-center shrink-0 border border-white/20"
              >
                {netVault >= 0 ? <TrendingUp size={36} className="text-white"/> : <TrendingDown size={36} className="text-white"/>}
              </motion.div>
            </div>

            {/* Mini stats inside hero */}
            <div className="relative z-10 mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "إيرادات", value: studentRevenue + additionalRevenueSum, icon: <TrendingUp size={14}/> },
                { label: "مصروفات", value: totalExpenses, icon: <TrendingDown size={14}/> },
                { label: "نسبة التحصيل", value: collectionPercentage + "%", isText: true, icon: <BarChart3 size={14}/> },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/10"
                >
                  <div className="flex items-center gap-1.5 text-white/70 text-[9px] font-black mb-1">
                    {stat.icon} <span>{stat.label}</span>
                  </div>
                  <p className="text-white text-sm md:text-base font-black tabular-nums leading-none">
                    {stat.isText ? stat.value : formatIQD(stat.value as number)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Detailed breakdown cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {([
              {
                label: "إيرادات الطلاب", value: studentRevenue, sub: "من مدفوعات الطلاب",
                from: "from-emerald-500", to: "to-teal-600", shadow: "shadow-emerald-500/25",
                ring: "ring-emerald-100", icon: <GraduationCap size={18}/>, trend: "up",
              },
              {
                label: "إيرادات إضافية", value: additionalRevenueSum, sub: "من مصادر أخرى",
                from: "from-sky-500", to: "to-blue-600", shadow: "shadow-sky-500/25",
                ring: "ring-sky-100", icon: <DollarSign size={18}/>, trend: "up",
              },
              {
                label: "إجمالي المصروفات", value: totalExpenses, sub: "خلال الفترة المحددة",
                from: "from-rose-500", to: "to-red-600", shadow: "shadow-rose-500/25",
                ring: "ring-rose-100", icon: <Receipt size={18}/>, trend: "down",
              },
              {
                label: "الرواتب", value: salaries, sub: "ضمن إجمالي المصروفات",
                from: "from-amber-500", to: "to-orange-600", shadow: "shadow-amber-500/25",
                ring: "ring-amber-100", icon: <Users size={18}/>, trend: "down",
              },
            ] as const).map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ y: -4 }}
                className={`relative overflow-hidden rounded-2xl p-4 bg-white border border-slate-100 shadow-lg ${card.shadow} hover:ring-4 ${card.ring} transition-all`}
              >
                <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.from} ${card.to} opacity-10`}/>
                <TrendArrow trend={card.trend as "up" | "down"} delay={0.3 + i * 0.06}/>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.from} ${card.to} flex items-center justify-center text-white shadow-md mb-3 relative z-10`}>
                  {card.icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1 relative z-10">{card.label}</p>
                <AnimatedCounter value={card.value} isMoney isDark={false}/>
                <p className="text-[9px] font-bold text-slate-400 mt-1.5 relative z-10 truncate">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart + outstanding debts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-lg p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-800">توزيع الصندوق</h3>
                  <p className="text-[11px] font-bold text-slate-400">إيرادات مقابل مصروفات خلال الفترة</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={[
                    { name: "إيرادات الطلاب", value: studentRevenue, fill: "#10b981" },
                    { name: "إيرادات إضافية", value: additionalRevenueSum, fill: "#0ea5e9" },
                    { name: "مصروفات", value: totalExpenses, fill: "#f43f5e" },
                    { name: "رواتب", value: salaries, fill: "#f59e0b" },
                  ]}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "Cairo", fill: "#64748b", fontWeight: 700 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 9, fontFamily: "Cairo", fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => new Intl.NumberFormat("en-US").format(v)} width={70}/>
                  <Tooltip
                    cursor={{ fill: "#f1f5f940" }}
                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", fontFamily: "Cairo", fontSize: "12px", direction: "rtl" }}
                    formatter={(v: any) => [formatIQD(v) + " د.ع", "المبلغ"]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1100}/>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Outstanding debts panel */}
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl border border-slate-100 bg-white shadow-lg p-5 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-violet-500 rounded-full"/>
                <h3 className="text-sm font-black text-slate-800">المتبقي على الطلاب</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.5, stiffness: 200 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 mb-3"
                >
                  <ClipboardList size={28}/>
                </motion.div>
                <p className="text-2xl md:text-3xl font-black text-slate-800 tabular-nums leading-none">
                  {formatIQD(Math.max(0, remainingSums))}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-1">د.ع غير محصّل</p>
                <div className="w-full mt-4 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: collectionPercentage + "%" }}
                    transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>
                <p className="text-[10px] font-black text-slate-600 mt-2">
                  نسبة التحصيل: <span className="text-emerald-600">{collectionPercentage}%</span>
                </p>
              </div>
            </motion.div>
          </div>

          {/* Detailed line-by-line summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-slate-100 bg-white shadow-lg overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-1.5 h-5 bg-indigo-500 rounded-full"/>
              <h3 className="text-sm font-black text-slate-800">الملخص التفصيلي</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { label: "إيرادات الطلاب (المدفوعات)", value: studentRevenue, color: "text-emerald-600", note: "خلال الفترة المحددة" },
                { label: "الإيرادات الإضافية", value: additionalRevenueSum, color: "text-emerald-600", note: "خلال الفترة المحددة" },
                { label: "إجمالي الإيرادات", value: studentRevenue + additionalRevenueSum, color: "text-emerald-700", note: "المجموع", bold: true },
                { label: "إجمالي المصروفات", value: totalExpenses, color: "text-rose-600", note: "خلال الفترة المحددة" },
                { label: "الرواتب", value: salaries, color: "text-amber-600", note: "ضمن المصروفات" },
                { label: "صافي الصندوق", value: netVault, color: netVault >= 0 ? "text-emerald-700" : "text-rose-700", note: netVault >= 0 ? "ربح" : "خسارة", bold: true },
                { label: "متبقي على الطلاب", value: Math.max(0, remainingSums), color: "text-violet-600", note: "غير محصّل" },
              ].map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.04 }}
                  className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition-colors ${row.bold ? "bg-slate-50/40" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${row.bold ? "font-black" : "font-bold"} text-slate-700`}>{row.label}</span>
                    <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">{row.note}</span>
                  </div>
                  <span className={`text-base ${row.bold ? "font-black" : "font-black"} ${row.color} tabular-nums`}>
                    {formatIQD(row.value)} <span className="text-[10px] font-bold text-slate-400">د.ع</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
              dir="rtl"
            >
              {!isReseting ? (
                <div className="p-8 space-y-6">
                  <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={40} />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">
                      تنبيه هام جداً!
                    </h2>
                    <p className="text-slate-500 font-bold">
                      هل أنت متأكد من رغبتك في تصفير كافة الحسابات؟ هذا الإجراء
                      سيقوم بحذف كافة سجلات الإيرادات والمصروفات ودفعات الطلاب
                      بشكل نهائي.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setIsReseting(true)}
                      className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-200"
                    >
                      نعم، أنا متأكد
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-lg hover:bg-slate-200 active:scale-95 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 space-y-6">
                  <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Lock size={40} />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">
                      تأكيد كلمة المرور
                    </h2>
                    <p className="text-slate-500 font-bold">
                      يرجى إدخال كلمة مرور الحساب لإتمام عملية تصفير الصندوق
                    </p>
                  </div>
                  <input
                    type="password"
                    value={resetPasscode}
                    onChange={(e) => setResetPasscode(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl text-center font-black text-2xl focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all"
                    autoFocus
                  />
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleReset}
                      className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-200"
                    >
                      تأكيد المسح النهائي
                    </button>
                    <button
                      onClick={() => setIsReseting(false)}
                      className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      عودة
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}

export default VaultReport;

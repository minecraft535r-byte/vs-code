/**
 * EmployeeManagement.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Users, Wallet, Receipt, History, CreditCard, Plus, ArrowRight, X, Trash2, AlertCircle, Eye, Download, School, Check, Clock } from "lucide-react";
import type { Payment, Employee, Expense } from "@/types";
import { formatStudentCode, formatWithCommas } from "@/utils/format";
import { notify } from "@/utils/notify";
import { printDocument, saveElementAsImage, getStoredReceiptSize } from "@/utils/print";
import { JOB_TITLES } from "@/constants";
import ExpenseReceiptPrint from "@/components/print/ExpenseReceiptPrint";
import PrintReport from "@/components/print/PrintReport";

const EmployeeManagement = ({
  onBack,
  employees,
  onAddEmployee,
  onDeleteEmployee,
  schools,
  expenses = [],
  onAddExpense,
  systemSettings,
}: {
  onBack: () => void;
  employees: Employee[];
  onAddEmployee: (e: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  schools: string[];
  expenses?: Expense[];
  onAddExpense?: (e: Expense) => Expense | void;
  systemSettings?: any;
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("جميع المدارس");
  const [showPrint, setShowPrint] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    school: schools[0] || "",
    subject: JOB_TITLES[0],
    salary: "",
    dateJoined: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.salary) {
      notify("يرجى ملء جميع الحقول المطلوبة", "warning");
      return;
    }
    const newEmp: Employee = {
      ...formData,
      id: Date.now().toString(),
      salary: parseFloat(formData.salary) || 0,
    };
    onAddEmployee(newEmp);
    setShowAddForm(false);
    setFormData({
      name: "",
      school: schools[0] || "",
      subject: JOB_TITLES[0],
      salary: "",
      dateJoined: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  // Modern Date states
  const currentYearNum = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  const ARABIC_MONTHS = [
    "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
    "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"
  ];
  const currentMonthName = ARABIC_MONTHS[currentMonthNum - 1]; // "أيار"

  // Salary Payment states
  const [payEmp, setPayEmp] = useState<Employee | null>(null);
  const [payMonth, setPayMonth] = useState(currentMonthName);
  const [payYear, setPayYear] = useState(String(new Date().getFullYear()));
  const [payAmount, setPayAmount] = useState("");
  const [paySource, setPaySource] = useState("نقداً");
  const [payNotes, setPayNotes] = useState("");

  // Salary history states
  const [historyEmp, setHistoryEmp] = useState<Employee | null>(null);

  // Salary Advance/Loan states
  const [advanceEmp, setAdvanceEmp] = useState<Employee | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split("T")[0]);

  // Edit expense states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpAmount, setEditExpAmount] = useState("");
  const [editExpNotes, setEditExpNotes] = useState("");
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Employee statement states
  const [statementEmp, setStatementEmp] = useState<Employee | null>(null);
  const [showAllEmpStatements, setShowAllEmpStatements] = useState(false);

  // Active print receipt state
  const [printReceipt, setPrintReceipt] = useState<Expense | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const saveAsImage = async () => {
    await saveElementAsImage("expense-receipt-to-print", `مستند_صرف_راتب_${printReceipt.receiver}_شهر_${payMonth}`);
  };

  const handleInitiatePayment = (emp: Employee) => {
    setPayEmp(emp);
    setPayMonth(currentMonthName);
    setPayYear(String(new Date().getFullYear()));
    setPayAmount(String(emp.salary));
    setPaySource("نقداً");
    setPayNotes(`راتب شهر ${currentMonthName} ${currentYearNum}`);
  };

  const handleConfirmPayment = () => {
    if (!payEmp) return;

    // Calculate outstanding advances for this employee
    const empAdvances = expenses.filter(e => e.type === "سلفة" && e.receiver === payEmp.name);
    const totalAdvances = empAdvances.reduce((s, e) => s + e.amount, 0);

    // Calculate how much of the advances have already been deducted in previous salary payments
    const empSalaryPayments = expenses.filter(e => e.type === "رواتب" && e.receiver === payEmp.name);
    const totalDeducted = empSalaryPayments.reduce((s, e) => {
      // Check if notes mention advance deduction
      const match = (e.notes || "").match(/خصم سلفة[:\s]*([0-9,]+)/);
      return s + (match ? parseInt(match[1].replace(/,/g, "")) || 0 : 0);
    }, 0);

    const remainingAdvance = Math.max(0, totalAdvances - totalDeducted);
    const baseSalary = parseFloat(payAmount) || payEmp.salary;

    // Deduct outstanding advance from salary
    const deduction = Math.min(remainingAdvance, baseSalary);
    const finalAmount = baseSalary - deduction;
    const paymentDateStr = new Date().toISOString().split("T")[0];

    const advanceNote = deduction > 0
      ? ` | خصم سلفة: ${new Intl.NumberFormat("en-US").format(deduction)} د.ع`
      : "";

    const rawExpense: Expense = {
      id: "EXP_EMP_SAL_" + Date.now().toString(),
      title: `صرف راتب الموظف: ${payEmp.name}`,
      school: payEmp.school,
      type: "رواتب",
      source: paySource || "نقداً",
      date: paymentDateStr,
      amount: finalAmount,
      receiver: payEmp.name,
      notes: (payNotes || `صرف راتب شهر ${payMonth} ${payYear}`) + advanceNote,
      status: "paid",
    };

    if (onAddExpense) {
      const saved = onAddExpense(rawExpense);
      if (saved) {
        setPrintReceipt(saved);
      }
    }

    if (deduction > 0) {
      notify(`تم صرف ${new Intl.NumberFormat("en-US").format(finalAmount)} د.ع (بعد خصم سلفة ${new Intl.NumberFormat("en-US").format(deduction)} د.ع)`, "success");
    }

    setPayEmp(null);
  };

  // ── Salary Advance Handler ──────────────────────────────────
  const handleConfirmAdvance = () => {
    if (!advanceEmp || !advanceAmount || parseFloat(advanceAmount) <= 0) {
      notify("يرجى إدخال مبلغ السلفة", "warning");
      return;
    }
    const finalAmount = parseFloat(advanceAmount);
    const rawExpense: Expense = {
      id: "EXP_ADV_" + Date.now().toString(),
      title: `سلفة للموظف: ${advanceEmp.name}`,
      school: advanceEmp.school,
      type: "سلفة",
      source: "نقداً",
      date: advanceDate,
      amount: finalAmount,
      receiver: advanceEmp.name,
      notes: advanceNotes || `سلفة مالية — ${advanceEmp.name}`,
      status: "paid",
    };
    if (onAddExpense) {
      const saved = onAddExpense(rawExpense);
      if (saved) setPrintReceipt(saved);
    }
    setAdvanceEmp(null);
    setAdvanceAmount("");
    setAdvanceNotes("");
    notify(`تم صرف سلفة ${formatIQD(finalAmount)} د.ع للموظف ${advanceEmp.name}`, "success");
  };

  const filtered = employees.filter((emp) => {
    const matchesSearch = emp.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSchool =
      selectedSchool === "جميع المدارس" || emp.school === selectedSchool;
    return matchesSearch && matchesSchool;
  });

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  return (
    <>
      {showPrint && (() => {
        const empFiltered = employees.filter(e =>
          (selectedSchool==="جميع المدارس"||e.school===selectedSchool) &&
          e.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
          <PrintReport title="قائمة الموظفين"
            filterInfo={selectedSchool!=="جميع المدارس"?selectedSchool:"جميع المدارس"}
            columns={[
              {label:"الاسم",key:"name",width:"25%",align:"right"},
              {label:"المدرسة",key:"school",width:"20%",align:"right"},
              {label:"الوظيفة",key:"subject",width:"15%",align:"center"},
              {label:"الراتب (د.ع)",key:"salaryFmt",width:"15%",align:"center"},
              {label:"تاريخ الانضمام",key:"dateJoined",width:"13%",align:"center"},
              {label:"ملاحظات",key:"notes",width:"12%",align:"right"},
            ]}
            rows={empFiltered.map(e=>({name:e.name,school:e.school,subject:e.subject,
              salaryFmt:new Intl.NumberFormat("en-US").format(e.salary),
              dateJoined:e.dateJoined,notes:e.notes||"—",
              __colors:{salaryFmt:"#16a34a"}}))}
            totals={{salaryFmt:"الإجمالي: "+new Intl.NumberFormat("en-US").format(empFiltered.reduce((a,e)=>a+e.salary,0))}}
            onClose={()=>setShowPrint(false)}
          />
        );
      })()}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #f8fafc, #eff6ff)" }}
      dir="rtl"
    >
      {/* ── Modern light header with gradient icon ──────────────── */}
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30"
            >
              <Users size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">إدارة الموظفين والرواتب</h1>
              <p className="text-[10px] font-bold text-slate-400">
                {filtered.length} موظف • إجمالي الرواتب: {formatIQD(filtered.reduce((s, e) => s + (e.salary || 0), 0))} د.ع
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPrint(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-black transition-all"
          >
            <Download size={14} /><span>طباعة</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAllEmpStatements(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-500/30 transition-all"
          >
            <Eye size={14} /><span className="hidden sm:inline">كشف حسابات الموظفين</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-white text-xs font-black shadow-lg shadow-teal-500/30 transition-all"
            style={{ background: "linear-gradient(135deg, #14b8a6 0%, #10b981 100%)" }}
          >
            <Plus size={14} strokeWidth={3} /><span className="hidden sm:inline">إضافة موظف</span>
          </motion.button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Quick stats row */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { label: "إجمالي الموظفين", value: employees.length.toString(), icon: <Users size={18}/>, from: "from-teal-500", to: "to-emerald-600", shadow: "shadow-teal-500/25" },
              { label: "إجمالي الرواتب", value: formatIQD(employees.reduce((s, e) => s + (e.salary || 0), 0)), icon: <Wallet size={18}/>, from: "from-blue-500", to: "to-indigo-600", shadow: "shadow-blue-500/25" },
              { label: "مدفوع هذا الشهر", value: employees.filter(emp => expenses.some(e => e.type === "رواتب" && e.receiver === emp.name && (e.paymentDate || e.date || "").startsWith(`${currentYearNum}-${String(currentMonthNum).padStart(2,"0")}`))).length + " موظف", icon: <Check size={18}/>, from: "from-emerald-500", to: "to-green-600", shadow: "shadow-emerald-500/25" },
              { label: "غير مدفوع", value: (employees.length - employees.filter(emp => expenses.some(e => e.type === "رواتب" && e.receiver === emp.name && (e.paymentDate || e.date || "").startsWith(`${currentYearNum}-${String(currentMonthNum).padStart(2,"0")}`))).length) + " موظف", icon: <Clock size={18}/>, from: "from-amber-500", to: "to-orange-600", shadow: "shadow-amber-500/25" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl p-3 bg-white border border-slate-100 shadow-lg ${stat.shadow} relative overflow-hidden`}
              >
                <div className={`absolute -top-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-br ${stat.from} ${stat.to} opacity-10`}/>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.from} ${stat.to} flex items-center justify-center text-white shadow-sm mb-2 relative z-10`}>
                  {stat.icon}
                </div>
                <p className="text-[9px] font-black uppercase tracking-wide text-slate-400 relative z-10">{stat.label}</p>
                <p className="text-base font-black text-slate-800 mt-0.5 tabular-nums relative z-10">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Search bar — simpler, no duplicate add button (it's now in the header) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="relative">
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="ابحث عن موظف بالاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 py-3 pr-12 pl-4 rounded-xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-teal-100 focus:bg-white border border-transparent focus:border-teal-200 transition-all"
              />
            </div>
          </motion.div>

          {/* Employees List Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden pb-10">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 text-xs font-black border-b-2 border-slate-200">
                    <th className="py-4 px-4 text-center w-12">#</th>
                    <th className="py-4 px-4">اسم الموظف</th>
                    <th className="py-4 px-4">العنوان الوظيفي</th>
                    <th className="py-4 px-4 text-left">الراتب الشهري</th>
                    <th className="py-4 px-4 text-center">حالة راتب شهر ({currentMonthName})</th>
                    <th className="py-4 px-4 text-left">الإجراءات والخيارات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((emp, idx) => {
                    const empExpenses = expenses.filter(
                      (e) => e.type === "رواتب" && e.receiver === emp.name
                    );
                    const isPaidThisMonth = empExpenses.some((e) => {
                      const datePart = e.paymentDate || e.date || "";
                      const currentMonthSlash = `2026/05`;
                      const currentMonthDash = `${currentYearNum}-${String(currentMonthNum).padStart(2,"0")}`;
                      return datePart.startsWith(currentMonthDash) || datePart.includes(currentMonthSlash) || e.notes?.includes(currentMonthName);
                    });

                    return (
                      <tr 
                        key={emp.id} 
                        className="hover:bg-slate-50/80 transition-colors text-xs font-bold text-slate-700"
                      >
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-extrabold text-slate-900 text-sm">
                          {emp.name}
                        </td>
                        {/* School column cell removed */}
                        <td className="py-2.5 px-4 text-indigo-600">
                          {emp.subject}
                        </td>
                        <td className="py-2.5 px-4 text-left font-mono text-emerald-600 tabular-nums">
                          {formatIQD(emp.salary)} د.ع
                          {(() => {
                            const advances = expenses.filter(e => e.type === "سلفة" && e.receiver === emp.name);
                            const totalAdv = advances.reduce((s, e) => s + e.amount, 0);
                            const deducted = expenses.filter(e => e.type === "رواتب" && e.receiver === emp.name)
                              .reduce((s, e) => { const m = (e.notes || "").match(/خصم سلفة[:\s]*([0-9,]+)/); return s + (m ? parseInt(m[1].replace(/,/g, "")) || 0 : 0); }, 0);
                            const remainingAdv = Math.max(0, totalAdv - deducted);
                            return remainingAdv > 0 ? (
                              <div className="text-[10px] text-orange-500 font-bold mt-0.5">
                                سلفة متبقية: {formatIQD(remainingAdv)} د.ع
                              </div>
                            ) : null;
                          })()}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isPaidThisMonth ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100/50">
                              <Check size={11} />
                              <span>تم الصرف</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black border border-amber-100/50 animate-pulse">
                              <AlertCircle size={11} />
                              <span>بانتظار الصرف</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPaidThisMonth ? (
                              <button
                                onClick={() => handleInitiatePayment(emp)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                              >
                                <CreditCard size={13} />
                                <span>صرف الراتب</span>
                              </button>
                            ) : (
                              <span className="px-2.5 py-1.5 bg-slate-50 text-slate-400 font-bold text-xs rounded-xl flex items-center gap-1 border border-dashed border-slate-200">
                                <Check size={12} className="text-emerald-500" />
                                <span>تم الدفع</span>
                              </span>
                            )}

                            {empExpenses.length > 0 && (
                              <button
                                onClick={() => setHistoryEmp(emp)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95 border border-slate-100 cursor-pointer"
                                title="عرض سجل رواتب الموظف"
                              >
                                <History size={13} />
                                <span>السجل ({empExpenses.length})</span>
                              </button>
                            )}

                            <button
                              onClick={() => setStatementEmp(emp)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95 border border-indigo-100 cursor-pointer"
                              title="كشف حساب الموظف"
                            >
                              <Eye size={13} />
                              <span>كشف حساب</span>
                            </button>

                            <button
                              onClick={() => {
                                setAdvanceEmp(emp);
                                setAdvanceAmount("");
                                setAdvanceNotes("");
                                setAdvanceDate(new Date().toISOString().split("T")[0]);
                              }}
                              className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95 border border-orange-100 cursor-pointer"
                              title="صرف سلفة/قرض"
                            >
                              <Wallet size={13} />
                              <span>سلفة</span>
                            </button>

                            <div className="w-px h-5 bg-slate-200/80 mx-1" />

                            <button
                              onClick={() => onDeleteEmployee(emp.id)}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              title="حذف الموظف"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <Users size={64} className="mx-auto text-slate-200" />
                  <p className="text-slate-400 font-bold">لا يوجد موظفين حالياً.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      <AnimatePresence>
        {/* Add Employee Form */}
        {showAddForm && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl relative"
            >
              <div className="bg-slate-800 p-8 text-white flex items-center justify-between">
                <h2 className="text-2xl font-black">إضافة موظف جديد</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-white/10 p-2 rounded-full hover:bg-white/20"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">
                      الاسم الكامل للموظف
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="أدخل اسم الموظف..."
                      className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-bold border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500">
                        المدرسة
                      </label>
                      <select
                        value={formData.school}
                        onChange={(e) =>
                          handleInputChange("school", e.target.value)
                        }
                        className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-bold border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      >
                        {schools.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500">
                        العنوان الوظيفي
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) =>
                          handleInputChange("subject", e.target.value)
                        }
                        className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-bold border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      >
                        {JOB_TITLES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">
                      الراتب الشهري (د.ع)
                    </label>
                    <input
                      type="text"
                      value={formatWithCommas(formData.salary)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                          handleInputChange("salary", raw);
                        }
                      }}
                      placeholder="أدخل قيمة راتب الموظف..."
                      className="w-full bg-slate-50 py-4 px-8 rounded-2xl text-2xl font-black text-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all border border-slate-100 placeholder:text-slate-200 tabular-nums text-right font-mono"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  إضافة الموظف الآن
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Salary Payment Modal */}
        {payEmp && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl relative border border-slate-100"
            >
              <div className="bg-emerald-600 p-8 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">صرف الراتب الشهري</h2>
                  <p className="text-xs text-emerald-100 font-bold mt-1">الموظف: {payEmp.name}</p>
                </div>
                <button
                  onClick={() => setPayEmp(null)}
                  className="bg-white/10 p-2 rounded-full hover:bg-white/20"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">اسم الشهر</label>
                    <select
                      value={payMonth}
                      onChange={(e) => {
                        setPayMonth(e.target.value);
                        setPayNotes(`راتب شهر ${e.target.value} ${payYear}`);
                      }}
                      className="w-full bg-slate-50 py-3.5 px-4 rounded-xl font-bold border border-slate-100 focus:outline-none text-slate-800"
                    >
                      {ARABIC_MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">السنة</label>
                    <select
                      value={payYear}
                      onChange={(e) => {
                        setPayYear(e.target.value);
                        setPayNotes(`راتب شهر ${payMonth} ${e.target.value}`);
                      }}
                      className="w-full bg-slate-50 py-3.5 px-4 rounded-xl font-bold border border-slate-100 focus:outline-none text-slate-800"
                    >
                      {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (<option key={y} value={String(y)}>{y}</option>))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">القيمة والراتب الصافي (د.ع)</label>
                  <input
                    type="text"
                    value={formatWithCommas(payAmount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                        setPayAmount(raw);
                      }
                    }}
                    placeholder="مبلغ الراتب المطلوب صرفه..."
                    className="w-full bg-slate-50 py-4 px-6 rounded-2xl text-2xl font-black text-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all border border-slate-100 placeholder:text-slate-300 tabular-nums text-right font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">طريقة الدفع الصرف</label>
                  <select
                    value={paySource}
                    onChange={(e) => setPaySource(e.target.value)}
                    className="w-full bg-slate-50 py-3.5 px-4 rounded-xl font-bold border border-slate-100 focus:outline-none text-slate-800"
                  >
                    <option value="نقداً">نقداً (من الخزنة الرئيسية)</option>
                    <option value="الحساب الجاري">الحساب الجاري / المصرف</option>
                    <option value="صندوق المدرسة">صندوق المدرسة اليدوي</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">ملاحظات / تفاصيل</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="أدخل أي ملاحظات على الراتب..."
                    className="w-full bg-slate-50 py-3.5 px-4 rounded-xl font-bold border border-slate-100 focus:outline-none text-slate-800"
                  />
                </div>

                {/* ── Advance deduction info ── */}
                {(() => {
                  const empAdv = expenses.filter(e => e.type === "سلفة" && e.receiver === payEmp.name);
                  const totalAdv = empAdv.reduce((s, e) => s + e.amount, 0);
                  const prevDed = expenses.filter(e => e.type === "رواتب" && e.receiver === payEmp.name)
                    .reduce((s, e) => { const m = (e.notes || "").match(/خصم سلفة[:\s]*([0-9,]+)/); return s + (m ? parseInt(m[1].replace(/,/g, "")) || 0 : 0); }, 0);
                  const remainingAdv = Math.max(0, totalAdv - prevDed);
                  const base = parseFloat(payAmount) || payEmp.salary;
                  const deduction = Math.min(remainingAdv, base);
                  if (remainingAdv > 0) {
                    return (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4 space-y-2">
                        <div className="flex items-center gap-2 text-orange-700 text-xs font-black">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          سيتم خصم السلفة تلقائياً
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-slate-400">الراتب</div>
                            <div className="font-black text-slate-700">{formatIQD(base)}</div>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-orange-500">خصم السلفة</div>
                            <div className="font-black text-orange-600">-{formatIQD(deduction)}</div>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-emerald-500">الصافي</div>
                            <div className="font-black text-emerald-700">{formatIQD(base - deduction)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={handleConfirmPayment}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/10 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard size={20} />
                    <span>تأكيد وصرف الراتب الآن</span>
                  </button>
                  <button
                    onClick={() => setPayEmp(null)}
                    className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Salary History Modal */}
        {historyEmp && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl relative border border-slate-100 flex flex-col max-h-[85vh]"
            >
              <div className="bg-slate-800 p-8 text-white flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-black">سجل الموظف المالي الكامل</h2>
                  <p className="text-xs text-slate-300 font-bold mt-1">جميع الرواتب والسلف والمصروفات للموظف: {historyEmp.name}</p>
                </div>
                <button
                  onClick={() => setHistoryEmp(null)}
                  className="bg-white/10 p-2 rounded-full hover:bg-white/20"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 scrollbar-hide">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase">
                    <tr>
                      <th className="py-4 px-4 font-black">المستند والبيان</th>
                      <th className="py-4 px-4 font-black">النوع</th>
                      <th className="py-4 px-4 font-black text-center">القيمة د.ع</th>
                      <th className="py-4 px-4 text-center font-black">تاريخ الصرف</th>
                      <th className="py-4 px-4 text-left font-black">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses
                      .filter((e) => (e.type === "رواتب" || e.type === "سلفة") && e.receiver === historyEmp.name)
                      .map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800">{exp.notes || exp.title}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">مستند رقم: {exp.receiptNo || formatStudentCode(exp.id)}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              exp.type === "سلفة" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {exp.type}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-black text-slate-700 tabular-nums">
                            {formatIQD(exp.amount)} د.ع
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-slate-500 tabular-nums text-xs">
                            {exp.paymentDate || exp.date}
                          </td>
                          <td className="py-4 px-4 text-left">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => setPrintReceipt(exp)}
                                className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center gap-1"
                              >
                                <Eye size={13} />
                                <span>عرض</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {(() => {
                  const empAll = expenses.filter(e => (e.type === "رواتب" || e.type === "سلفة") && e.receiver === historyEmp.name);
                  const totalSalaries = empAll.filter(e => e.type === "رواتب").reduce((s, e) => s + e.amount, 0);
                  const totalAdvances = empAll.filter(e => e.type === "سلفة").reduce((s, e) => s + e.amount, 0);
                  const deductedFromSalary = empAll.filter(e => e.type === "رواتب")
                    .reduce((s, e) => { const m = (e.notes || "").match(/خصم سلفة[:\s]*([0-9,]+)/); return s + (m ? parseInt(m[1].replace(/,/g, "")) || 0 : 0); }, 0);
                  const remainingAdvance = Math.max(0, totalAdvances - deductedFromSalary);
                  return (
                    <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
                      <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">إجمالي الرواتب</p>
                        <p className="text-lg font-black text-emerald-700 mt-1">{formatIQD(totalSalaries)} د.ع</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">إجمالي السلف</p>
                        <p className="text-lg font-black text-orange-700 mt-1">{formatIQD(totalAdvances)} د.ع</p>
                        {deductedFromSalary > 0 && (
                          <p className="text-[10px] font-bold text-orange-400 mt-1">
                            مخصوم: {formatIQD(deductedFromSalary)} | متبقي: {formatIQD(remainingAdvance)}
                          </p>
                        )}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">الإجمالي الكلي</p>
                        <p className="text-lg font-black text-slate-800 mt-1">{formatIQD(totalSalaries + totalAdvances)} د.ع</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Salary Advance Modal ──────────────────────────────── */}
        {advanceEmp && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl relative border border-slate-100"
            >
              <div className="bg-orange-500 p-8 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">صرف سلفة / قرض</h2>
                  <p className="text-xs text-orange-100 font-bold mt-1">الموظف: {advanceEmp.name} — الراتب: {formatIQD(advanceEmp.salary)} د.ع</p>
                </div>
                <button onClick={() => setAdvanceEmp(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-sm text-orange-700 font-bold">
                  سيتم تسجيل المبلغ كسلفة وسيظهر في سجل الموظف المالي. يمكن خصمه لاحقاً من الراتب.
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">مبلغ السلفة (د.ع)</label>
                  <input
                    type="number"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="أدخل مبلغ السلفة..."
                    className="w-full bg-slate-50 py-4 px-8 rounded-2xl text-2xl font-black text-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all border border-slate-100 placeholder:text-slate-200 tabular-nums text-right font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">التاريخ</label>
                  <input
                    type="date"
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    className="w-full bg-slate-50 py-3.5 px-4 rounded-xl font-bold border border-slate-100 focus:outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">ملاحظات (اختياري)</label>
                  <textarea
                    value={advanceNotes}
                    onChange={(e) => setAdvanceNotes(e.target.value)}
                    placeholder="مثال: سلفة لظرف طارئ..."
                    rows={2}
                    className="w-full bg-slate-50 py-3 px-4 rounded-xl font-bold border border-slate-100 focus:outline-none text-slate-800 resize-none"
                  />
                </div>
                <button
                  onClick={handleConfirmAdvance}
                  className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
                >
                  <Wallet size={22} />
                  <span>تأكيد وصرف السلفة</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Print & Image Receipt Modal Overlay */}
        {printReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-xl flex flex-col items-center overflow-y-auto"
          >
            <div className="sticky top-0 w-full bg-slate-900/90 border-b border-white/10 p-6 z-[120] no-print">
              <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => printDocument("expense-receipt-to-print", getStoredReceiptSize())}
                  className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-white"
                >
                  <Receipt size={20} className="text-rose-600" />
                  <span>طباعة المستند</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveAsImage}
                  className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-rose-500 shadow-rose-600/40"
                >
                  <Download size={20} />
                  <span>حفظ كصورة</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPrintReceipt(null)}
                  className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-slate-700"
                >
                  <ArrowRight size={20} />
                  <span>رجوع</span>
                </motion.button>
              </div>
            </div>

            <div className="w-full max-w-[210mm] py-12 px-4">
              <div
                className="print-area w-full bg-white shadow-2xl rounded-3xl"
                ref={receiptRef}
              >
                <ExpenseReceiptPrint expense={printReceipt} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Employee Individual Statement (Simple B&W) ──────── */}
      {statementEmp && (() => {
        const empExps = expenses.filter(e => (e.type === "رواتب" || e.type === "سلفة") && e.receiver === statementEmp.name);
        const totalSalaries = empExps.filter(e => e.type === "رواتب").reduce((s, e) => s + e.amount, 0);
        const totalAdvances = empExps.filter(e => e.type === "سلفة").reduce((s, e) => s + e.amount, 0);
        return (
          <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-slate-800 p-4 text-white flex justify-between items-center shrink-0">
                <h2 className="font-black">كشف حساب الموظف: {statementEmp.name}</h2>
                <div className="flex gap-2">
                  <button onClick={() => printDocument("emp-statement-print")} className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-bold hover:bg-white/30">طباعة</button>
                  <button onClick={() => setStatementEmp(null)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20"><X size={18}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div id="emp-statement-print" style={{ fontFamily: "Cairo, sans-serif", direction: "rtl", padding: "20px", color: "#000" }}>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>{systemSettings?.schoolName || "مدارس المرتضى"}</h2>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "4px 0", borderBottom: "2px solid #000", display: "inline-block", paddingBottom: "4px" }}>كشف حساب الموظف: {statementEmp.name}</h3>
                    <p style={{ fontSize: "11px", color: "#666", margin: "4px 0" }}>الوظيفة: {statementEmp.jobTitle || statementEmp.subject} | الراتب: {formatIQD(statementEmp.salary)} د.ع</p>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #000" }}>
                    <thead>
                      <tr style={{ background: "#f0f0f0" }}>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>ت</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>البيان</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>النوع</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>المبلغ</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empExps.map((exp, idx) => (
                        <tr key={exp.id}>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{idx + 1}</td>
                          <td style={{ border: "1px solid #000", padding: "5px" }}>{exp.notes || exp.title}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{exp.type}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{formatIQD(exp.amount)}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{exp.paymentDate || exp.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: "16px", fontSize: "12px", borderTop: "2px solid #000", paddingTop: "8px" }}>
                    <table style={{ width: "60%", margin: "0 auto", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr><td style={{ padding: "4px 8px", fontWeight: 700 }}>إجمالي الرواتب:</td><td style={{ padding: "4px 8px", fontWeight: 900 }}>{formatIQD(totalSalaries)} د.ع</td></tr>
                        <tr><td style={{ padding: "4px 8px", fontWeight: 700 }}>إجمالي السلف:</td><td style={{ padding: "4px 8px", fontWeight: 900 }}>{formatIQD(totalAdvances)} د.ع</td></tr>
                        <tr style={{ borderTop: "1px solid #000" }}><td style={{ padding: "4px 8px", fontWeight: 900 }}>الإجمالي الكلي:</td><td style={{ padding: "4px 8px", fontWeight: 900 }}>{formatIQD(totalSalaries + totalAdvances)} د.ع</td></tr>
                        <tr><td style={{ padding: "4px 8px", fontWeight: 700 }}>عدد العمليات:</td><td style={{ padding: "4px 8px", fontWeight: 900 }}>{empExps.length} عملية</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── All Employees Statement (Simple B&W) ──────── */}
      {showAllEmpStatements && (() => {
        const allEmpData = employees.map(emp => {
          const empExps = expenses.filter(e => (e.type === "رواتب" || e.type === "سلفة") && e.receiver === emp.name);
          const totalSalaries = empExps.filter(e => e.type === "رواتب").reduce((s, e) => s + e.amount, 0);
          const totalAdvances = empExps.filter(e => e.type === "سلفة").reduce((s, e) => s + e.amount, 0);
          return { emp, totalSalaries, totalAdvances, total: totalSalaries + totalAdvances, count: empExps.length };
        });
        const grandSalaries = allEmpData.reduce((s, d) => s + d.totalSalaries, 0);
        const grandAdvances = allEmpData.reduce((s, d) => s + d.totalAdvances, 0);
        return (
          <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-slate-800 p-4 text-white flex justify-between items-center shrink-0">
                <h2 className="font-black">كشف حسابات جميع الموظفين</h2>
                <div className="flex gap-2">
                  <button onClick={() => printDocument("all-emp-statement-print")} className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-bold hover:bg-white/30">طباعة</button>
                  <button onClick={() => setShowAllEmpStatements(false)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20"><X size={18}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div id="all-emp-statement-print" style={{ fontFamily: "Cairo, sans-serif", direction: "rtl", padding: "20px", color: "#000" }}>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>{systemSettings?.schoolName || "مدارس المرتضى"}</h2>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "4px 0", borderBottom: "2px solid #000", display: "inline-block", paddingBottom: "4px" }}>كشف حسابات الموظفين</h3>
                    <p style={{ fontSize: "11px", color: "#666" }}>عدد الموظفين: {employees.length}</p>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #000" }}>
                    <thead>
                      <tr style={{ background: "#f0f0f0" }}>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>ت</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>اسم الموظف</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>الوظيفة</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>الراتب</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>الرواتب المصروفة</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>السلف</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>الإجمالي</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>العمليات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allEmpData.map((d, idx) => (
                        <tr key={d.emp.id}>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{idx + 1}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", fontWeight: 700 }}>{d.emp.name}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{d.emp.jobTitle || d.emp.subject}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{formatIQD(d.emp.salary)}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{formatIQD(d.totalSalaries)}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{formatIQD(d.totalAdvances)}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center", fontWeight: 700 }}>{formatIQD(d.total)}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{d.count}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#f0f0f0", fontWeight: 900 }}>
                        <td colSpan={4} style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>المجموع الكلي</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{formatIQD(grandSalaries)}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{formatIQD(grandAdvances)}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{formatIQD(grandSalaries + grandAdvances)}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{allEmpData.reduce((s, d) => s + d.count, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </motion.div>
    </>
  );
}

export default EmployeeManagement;

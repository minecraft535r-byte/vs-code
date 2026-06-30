/**
 * StudentInvoices.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Edit2, Trash2, DollarSign, Settings, Users, Wallet, Receipt, FileText, UserPlus, GraduationCap, History, TrendingUp, CreditCard, Plus, ArrowRight, X, Eye, ClipboardList, Download, ListTree, CalendarCheck, RotateCcw, Check, AlertTriangle, FileSpreadsheet } from "lucide-react";
import type { Student, Payment, Expense, AdditionalRevenue, AppUser, DashboardTile, SystemSettings, PrintSettings, Grade } from "@/types";
import { formatStudentCode, formatReceiptNo, formatWithCommas, handleDirectMoneyChange } from "@/utils/format";
import { notify } from "@/utils/notify";
import { sendWhatsAppReceipt } from "@/utils/whatsapp";
import { verifyDeletePassword } from "@/utils/security";
import { printDocument, saveElementAsImage } from "@/utils/print";
import { PERMISSIONS } from "@/constants";
import StudentAccountCard from "@/components/print/StudentAccountCard";
import StudentAccountStatementModal from "@/components/print/StudentAccountStatementModal";
import AllStudentsStatement from "@/components/print/AllStudentsStatement";
import ReceiptPrint from "@/components/print/ReceiptPrint";
import { processTransferStudent } from "@/utils/transfer";

const StudentInvoices = ({
  onBack,
  students,
  onAddPayment,
  schools,
  grades,
  receiptCounter,
  currentUser,
  onUpdateStudents,
  systemSettings,
}: {
  onBack: () => void;
  students: Student[];
  onAddPayment: (studentId: string, payment: Payment) => void;
  schools: string[];
  grades: string[];
  receiptCounter: number;
  currentUser: AppUser | null;
  onUpdateStudents: (updated: Student[]) => void;
  systemSettings: SystemSettings;
}) => {
  const isOwner =
    currentUser?.username === "Mor" ||
    currentUser?.username === "Methaq" ||
    currentUser?.permissions.includes("admin") ||
    currentUser?.permissions.includes("settings");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("جميع المدارس");
  const [selectedGrade, setSelectedGrade] = useState("جميع المراحل");
  const [selectedSection, setSelectedSection] = useState("جميع الشعب");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "paid" | "unpaid" | "partial">("all");
  const [showUnpaidReport, setShowUnpaidReport] = useState(false);
  const [whatsappSummary, setWhatsappSummary] = useState<{ total: number; valid: number; invalid: number; sent: number } | null>(null);
  const [paymentModal, setPaymentModal] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [receipt, setReceipt] = useState<{
    student: Student;
    payment: Payment;
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [viewingReceiptsStudent, setViewingReceiptsStudent] =
    useState<Student | null>(null);
  // Receipt Edit/Delete states
  const [editingPayment, setEditingPayment] = useState<{studentId: string; payment: Payment; index: number} | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [deletingPayment, setDeletingPayment] = useState<{studentId: string; paymentId: string; amount: number} | null>(null);
  // ── Receipt Withdrawal states ──────────────────────────────
  const [withdrawingPayment, setWithdrawingPayment] = useState<{studentId: string; payment: Payment; index: number} | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("ترك المدرسة");
  const [withdrawNote, setWithdrawNote] = useState("");
  const WITHDRAW_REASONS = ["ترك المدرسة", "نقل إلى مدرسة أخرى", "خطأ في الوصل", "استرجاع مبلغ", "تغيير الشعبة", "سبب آخر"];
  const [showAllStatements, setShowAllStatements] = useState(false);
  const [selectedStudentCard, setSelectedStudentCard] = useState<Student | null>(null);
  const [viewingStatementStudent, setViewingStatementStudent] =
    useState<Student | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [printSelected, setPrintSelected] = useState(false);

  // Bulk-statement selection
  const [selectedForStatements, setSelectedForStatements] = useState<Set<string>>(new Set());
  const [showSelectedStatements, setShowSelectedStatements] = useState(false);

  const toggleStudentSelection = (id: string) => {
    setSelectedForStatements((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showBulkPayConfirm, setShowBulkPayConfirm] = useState(false);
  const [bulkStep, setBulkStep] = useState(1);
  const [bulkPasscode, setBulkPasscode] = useState("");
  const [bulkPayPasscode, setBulkPayPasscode] = useState("");

  // ── Receipt Edit Handler ──────────────────────────────────
  const handleEditPayment = () => {
    if (!editingPayment) return;
    const newAmount = parseFloat(editAmount) || editingPayment.payment.amount;
    const updatedStudents = students.map(s => {
      if (s.id !== editingPayment.studentId) return s;
      const updatedPayments = (s.payments || []).map((p, i) =>
        i === editingPayment.index ? { ...p, amount: newAmount, notes: editNotes || p.notes } : p
      );
      return { ...s, payments: updatedPayments };
    });
    if (onUpdateStudents) onUpdateStudents(updatedStudents);
    // Update viewing student
    if (viewingReceiptsStudent && viewingReceiptsStudent.id === editingPayment.studentId) {
      const updated = updatedStudents.find(s => s.id === editingPayment.studentId);
      if (updated) setViewingReceiptsStudent(updated);
    }
    setEditingPayment(null);
  };

  // ── Receipt Delete Handler ──────────────────────────────────
  const handleDeletePayment = () => {
    if (!deletingPayment) return;
    const updatedStudents = students.map(s => {
      if (s.id !== deletingPayment.studentId) return s;
      const updatedPayments = (s.payments || []).filter(p => p.id !== deletingPayment.paymentId);
      return { ...s, payments: updatedPayments };
    });
    if (onUpdateStudents) onUpdateStudents(updatedStudents);
    // Update viewing student
    if (viewingReceiptsStudent && viewingReceiptsStudent.id === deletingPayment.studentId) {
      const updated = updatedStudents.find(s => s.id === deletingPayment.studentId);
      if (updated) setViewingReceiptsStudent(updated);
    }
    setDeletingPayment(null);
  };

  // ── Receipt Withdrawal Handler ──────────────────────────────
  const handleWithdrawPayment = async () => {
    if (!withdrawingPayment) return;
    const __ok = await verifyDeletePassword(); if (!__ok) return;
    const fullNote = `[مسحوب] ${withdrawReason}${withdrawNote ? ` — ${withdrawNote}` : ""}`;
    const updatedStudents = students.map(s => {
      if (s.id !== withdrawingPayment.studentId) return s;
      const updatedPayments = (s.payments || []).map((p, i) =>
        i === withdrawingPayment.index ? { 
          ...p, 
          isWithdrawn: true, 
          withdrawDate: new Date().toISOString().split("T")[0],
          withdrawReason: withdrawReason,
          withdrawNote: withdrawNote,
          notes: fullNote,
        } : p
      );
      return { ...s, payments: updatedPayments };
    });
    if (onUpdateStudents) onUpdateStudents(updatedStudents);
    if (viewingReceiptsStudent && viewingReceiptsStudent.id === withdrawingPayment.studentId) {
      const updated = updatedStudents.find(s => s.id === withdrawingPayment.studentId);
      if (updated) setViewingReceiptsStudent(updated);
    }
    setWithdrawingPayment(null);
    setWithdrawReason("ترك المدرسة");
    setWithdrawNote("");
    notify(`تم سحب الوصل بنجاح — سيتم إعادة ${formatIQD(withdrawingPayment.payment.amount)} د.ع`, "success");
  };

  const handleBulkResetPayments = () => {
    if (bulkPasscode === currentUser?.password) {
      const filteredIds = filtered.map((s) => s.id);

      const updatedStudentsList = students.map((s) => {
        if (filteredIds.includes(s.id)) {
          return { ...s, payments: [] };
        }
        return s;
      });

      if (filteredIds.length === 0) {
        notify("لم يتم العثور على طلاب مطابقين لمعايير البحث الحالية.", "warning");
        return;
      }

      onUpdateStudents(updatedStudentsList);
      setShowBulkConfirm(false);
      setBulkPasscode("");
      setBulkStep(1);
      notify(
        `تم إعادة تعيين دفعات ${filteredIds.length} طالباً بنجاح (بناءً على الفلترة الحالية)`
  , "success");
    } else {
      notify("كلمة المرور غير صحيحة", "warning");
    }
  };

  const handleBulkPay = () => {
    if (bulkPayPasscode === currentUser?.password) {
      const filteredIds = filtered.map((s) => s.id);

      const currentYear = new Date().getFullYear();
      const academicYear =
        new Date().getMonth() < 8
          ? `${currentYear - 1}-${currentYear}`
          : `${currentYear}-${currentYear + 1}`;
      const date = new Date().toISOString().split("T")[0];

      let affectedCount = 0;
      const updatedStudentsList = students.map((s) => {
        if (filteredIds.includes(s.id)) {
          const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((acc, p) => acc + p.amount, 0);
          const totalRequired = s.tuition - (s.discount || 0);
          const remaining = totalRequired - paid;

          if (remaining > 0) {
            affectedCount++;
            const newPayment: Payment = {
              id: `bulk-${Date.now()}-${affectedCount}`,
              amount: remaining,
              date: date,
              schoolYear: academicYear,
              notes: "تسديد قسط (دفع جماعي)",
            };
            return { ...s, payments: [...(s.payments || []), newPayment] };
          }
        }
        return s;
      });

      if (affectedCount === 0) {
        notify("لا يوجد مبالغ متبقية للتسديد للطلاب المختارين.", "warning");
        setShowBulkPayConfirm(false);
        setBulkPayPasscode("");
        return;
      }

      onUpdateStudents(updatedStudentsList);
      setShowBulkPayConfirm(false);
      setBulkPayPasscode("");
      notify(`تم تسديد أقساط ${affectedCount} طالباً بنجاح.`, "success");
    } else {
      notify("كلمة المرور غير صحيحة", "warning");
    }
  };

  const resetStudentPayments = async (student: Student) => {
    if (
      window.confirm(
        `هل أنت متأكد من مسح دفعات الطالب (${student.name}) بالكامل؟`,
      )
    ) {
      const __ok = await verifyDeletePassword(); if (!__ok) return;
      const updatedList = students.map((s) =>
        s.id === student.id ? { ...s, payments: [] } : s,
      );
      onUpdateStudents(updatedList);
    }
  };

  const saveAsImage = async () => {
    const rid = receipt?.payment.id ? formatReceiptNo(receipt.payment.id) : "";
    await saveElementAsImage("receipt-to-print", `وصل_دفع_${receipt?.student.name}_${rid}`);
  };

  const sections = [...(systemSettings?.sections || ["أ", "ب", "ج"])].sort();

  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = selectedSchool === "جميع المدارس" || s.school === selectedSchool;
    const matchesGrade = selectedGrade === "جميع المراحل" || s.grade === selectedGrade;
    const matchesSection = selectedSection === "جميع الشعب" || s.section === selectedSection;
    let matchesPayStatus = true;
    if (paymentStatusFilter !== "all") {
      const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
      const net = s.tuition - (s.discount || 0);
      const rem = Math.max(0, net - paid);
      if (paymentStatusFilter === "paid") matchesPayStatus = rem === 0 && paid > 0;
      else if (paymentStatusFilter === "unpaid") matchesPayStatus = paid === 0;
      else if (paymentStatusFilter === "partial") matchesPayStatus = paid > 0 && rem > 0;
    }
    return matchesSearch && matchesSchool && matchesGrade && matchesSection && matchesPayStatus;
  });

  const handlePay = () => {
    if (!paymentModal || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      notify("يرجى إدخال مبلغ دفع صحيح", "warning");
      return;
    }

    const currentYear = new Date().getFullYear();
    const academicYear =
      new Date().getMonth() < 8
        ? `${currentYear - 1}-${currentYear}`
        : `${currentYear}-${currentYear + 1}`;

    const newPayment: Payment = {
      id: receiptCounter.toString().padStart(4, "0"),
      amount: parseFloat(paymentAmount),
      date: new Date().toISOString().split("T")[0],
      schoolYear: academicYear,
      notes: paymentNotes,
    };

    onAddPayment(paymentModal.id, newPayment);
    setReceipt({ student: paymentModal, payment: newPayment });
    if (paymentModal.guardianPhone) {
      sendWhatsAppReceipt(paymentModal.guardianPhone, paymentModal.name, newPayment.amount);
    }
    setPaymentModal(null);
    setPaymentAmount("");
    setPaymentNotes("");
  };

  const prepareQuickPayment = (s: Student) => {
    const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((acc, p) => acc + p.amount, 0);
    const totalRequired = s.tuition - (s.discount || 0);
    const remaining = totalRequired - paid;

    setPaymentModal(s);
    setPaymentAmount(remaining > 0 ? remaining.toString() : "");
    setPaymentNotes("تسديد قسط");
  };

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const currentMonthName = new Intl.DateTimeFormat("ar-IQ", {
    month: "long",
  }).format(new Date());

  const getPaymentStatus = (s: Student) => {
    const now = new Date();
    const currM = now.getMonth();
    const currY = now.getFullYear();

    const activePayments = (s.payments || []).filter(p => !(p as any).isWithdrawn);

    const paidThisMonth = activePayments
      .filter((p) => {
        const d = new Date(p.date);
        return d.getMonth() === currM && d.getFullYear() === currY;
      })
      .reduce((acc, p) => acc + p.amount, 0);

    const totalPaid = activePayments.reduce((acc, p) => acc + p.amount, 0);
    const totalRequired = s.tuition - (s.discount || 0);

    if (totalPaid >= totalRequired && totalRequired > 0) {
      return {
        label: "تم التسديد (كلي)",
        color: "bg-emerald-100 text-emerald-600",
        isPaid: true,
      };
    }
    if (paidThisMonth > 0) {
      return {
        label: `سدد في ${currentMonthName}`,
        color: "bg-blue-100 text-blue-600",
        isPaid: true,
      };
    }
    return {
      label: `غير مسدد لـ ${currentMonthName}`,
      color: "bg-rose-100 text-rose-600",
      isPaid: false,
    };
  };

  const calculatePaid = (s: Student) =>
    (s.payments || []).filter(p => !(p as any).isWithdrawn).reduce((acc, p) => acc + p.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #f8fafc, #eff6ff)" }}
    >
      {/* ── Modern light header ─────────────────────────────── */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between" dir="rtl">
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30"
            >
              <FileText size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">فواتير الطلاب</h1>
              <p className="text-[10px] font-bold text-slate-400">{filtered.length} طالب من إجمالي {students.length}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedForStatements.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSelectedStatements(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-black shadow-lg shadow-indigo-500/30 transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
            >
              <FileText size={13} strokeWidth={3} />
              <span className="hidden sm:inline">إصدار كشوف ({selectedForStatements.size})</span>
              <span className="sm:hidden">{selectedForStatements.size}</span>
            </motion.button>
          )}
          {isOwner && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBulkPayConfirm(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-black shadow-lg shadow-emerald-500/30 transition-all"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)" }}
              >
                <DollarSign size={13} strokeWidth={3} />
                <span>
                  {filtered.length === students.length
                    ? "تسديد الجميع"
                    : "تسديد المختارين"}
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBulkConfirm(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-xs font-black transition-all"
              >
                <RotateCcw size={13} />
                <span>
                  {filtered.length === students.length
                    ? "تصفير الجميع"
                    : "تصفير المختارين"}
                </span>
              </motion.button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 scrollbar-hide" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── Quick stats row ───────────────────────────────── */}
          {(() => {
            const totalTuition = filtered.reduce((s, st) => s + st.tuition, 0);
            const totalPaid = filtered.reduce((s, st) => s + (st.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0), 0);
            const totalRemaining = filtered.reduce((s, st) => s + Math.max(0, st.tuition - (st.discount || 0) - (st.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0)), 0);
            const fullyPaidCount = filtered.filter(st => {
              const paid = (st.payments || []).filter(p => !(p as any).isWithdrawn).reduce((a, p) => a + p.amount, 0);
              return paid >= (st.tuition - (st.discount || 0));
            }).length;
            const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);
            return (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                {[
                  { label: "إجمالي الأقساط", value: fmtNum(totalTuition), icon: <Wallet size={18}/>, from: "from-blue-500", to: "to-indigo-600", shadow: "shadow-blue-500/25" },
                  { label: "إجمالي المدفوع", value: fmtNum(totalPaid), icon: <Check size={18}/>, from: "from-emerald-500", to: "to-teal-600", shadow: "shadow-emerald-500/25" },
                  { label: "إجمالي المتبقي", value: fmtNum(totalRemaining), icon: <ClipboardList size={18}/>, from: "from-amber-500", to: "to-orange-600", shadow: "shadow-amber-500/25" },
                  { label: "مسددون كاملاً", value: fullyPaidCount.toString() + " طالب", icon: <Users size={18}/>, from: "from-violet-500", to: "to-purple-600", shadow: "shadow-violet-500/25" },
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
            );
          })()}

          {/* Mobile-only bulk action buttons (the header buttons are hidden on mobile) */}
          {isOwner && (
            <div className="md:hidden flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBulkPayConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white text-xs font-black shadow-lg shadow-emerald-500/30"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)" }}
              >
                <DollarSign size={13} strokeWidth={3} />
                <span>تسديد {filtered.length === students.length ? "الجميع" : "المختارين"}</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBulkConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black"
              >
                <RotateCcw size={13} />
                <span>تصفير {filtered.length === students.length ? "الجميع" : "المختارين"}</span>
              </motion.button>
            </div>
          )}

          {/* ── Search + filter ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="ابحث باسم الطالب لدفع الأقساط..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 py-3 pr-12 pl-4 rounded-xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white border border-transparent focus:border-blue-200 transition-all"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="flex-1 sm:flex-initial bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all min-w-[130px]"
              >
                <option>جميع المراحل</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="flex-1 sm:flex-initial bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all min-w-[110px]"
              >
                <option>جميع الشعب</option>
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                className="flex-1 sm:flex-initial bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all min-w-[110px]"
              >
                <option value="all">الكل</option>
                <option value="paid">مسدَّد بالكامل</option>
                <option value="partial">مسدَّد جزئياً</option>
                <option value="unpaid">غير مسدَّد</option>
              </select>
            </div>

            {/* Unpaid Actions Bar */}
            {(paymentStatusFilter === "unpaid" || paymentStatusFilter === "partial") && filtered.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 items-center mt-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-black text-rose-500 ml-2">⚠️ {filtered.length} طالب غير مسدد:</span>
                <button onClick={() => setShowUnpaidReport(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 active:scale-95 transition-all">
                  <FileText size={13}/>طباعة كشف
                </button>
                <button onClick={() => {
                  const unpaidStudents = filtered.filter(s => {
                    const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
                    return paid < (s.tuition - (s.discount || 0));
                  });
                  let validCount = 0, invalidCount = 0, sentCount = 0;
                  unpaidStudents.forEach(s => {
                    const phone = (s as any).guardianPhone || s.phone;
                    if (phone && /^07[0-9]{9}$/.test(phone)) {
                      validCount++;
                      const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
                      const rem = Math.max(0, s.tuition - (s.discount || 0) - paid);
                      const msg = `السلام عليكم ولي أمر الطالب: ${s.name}\nنود تذكيركم بوجود رصيد مستحق بقيمة: ${new Intl.NumberFormat("en-US").format(rem)} د.ع\nنرجو التكرم بتسديد المبلغ في أقرب وقت.\nشكراً لتعاونكم.`;
                      const normalized = phone.replace(/^0/, "964");
                      window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`, "_blank");
                      sentCount++;
                    } else { invalidCount++; }
                  });
                  setWhatsappSummary({ total: unpaidStudents.length, valid: validCount, invalid: invalidCount, sent: sentCount });
                  setTimeout(() => setWhatsappSummary(null), 8000);
                }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.616l4.533-1.477A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.724-5.994-1.953l-.418-.312-2.688.877.858-2.632-.342-.433A9.955 9.955 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  تذكير الكل بواتساب
                </button>
                {whatsappSummary && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                    ✅ تم: {whatsappSummary.sent} | ❌ أرقام خاطئة: {whatsappSummary.invalid}
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border-b-2 border-slate-200">
                <tr>
                  <th className="py-4 px-3 text-center font-black text-xs w-10">
                    <input
                      type="checkbox"
                      title="تحديد كل الطلاب الظاهرين"
                      className="w-4 h-4 cursor-pointer accent-indigo-600"
                      checked={filtered.length > 0 && filtered.every((s) => selectedForStatements.has(s.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForStatements(new Set(filtered.map((s) => s.id)));
                        } else {
                          setSelectedForStatements(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="py-4 px-6 text-right font-black text-xs">
                    اسم الطالب
                  </th>
                  <th className="py-4 px-3 text-center font-black text-xs">المرحلة</th>
                  <th className="py-4 px-3 text-center font-black text-xs">
                    الديون السابقة
                  </th>
                  <th className="py-4 px-3 text-center font-black text-xs">
                    القسط الكلي
                  </th>
                  <th className="py-4 px-3 text-center font-black text-xs">المدفوع</th>
                  <th className="py-4 px-3 text-center font-black text-xs">المتبقي</th>
                  <th className="py-4 px-3 text-center font-black text-xs">الحالة</th>
                  <th className="py-4 px-6 text-left font-black text-xs">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const { label, color, isPaid } = getPaymentStatus(s);
                  const paid = calculatePaid(s);
                  const remaining = s.tuition - s.discount - paid;
                  const prevDebtsTotal = s.previousDebts ? s.previousDebts.reduce((sum, d) => sum + d.amount, 0) : 0;
                  const prevDebtsRemaining = s.previousDebts ? s.previousDebts.reduce((sum, d) => sum + (d.amount - (d.paid || 0)), 0) : 0;

                  return (
                    <motion.tr
                      layout
                      key={s.id}
                      className={`hover:bg-blue-50/30 transition-colors group ${selectedForStatements.has(s.id) ? "bg-indigo-50/50" : ""}`}
                    >
                      <td className="py-6 px-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer accent-indigo-600"
                          checked={selectedForStatements.has(s.id)}
                          onChange={() => toggleStudentSelection(s.id)}
                          title="تحديد لإصدار كشف حساب"
                        />
                      </td>
                      <td className="py-6 px-8">
                        <div className="font-bold text-slate-800">{s.name}</div>
                        <div className="flex flex-col gap-0.5 mt-1 font-bold">
                          <span className="text-[10px] text-slate-400 group-hover:text-blue-400 transition-colors uppercase tracking-widest">
                            كود الطالب: #{formatStudentCode(s.id)}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-black text-slate-600">
                          {s.grade}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center font-bold text-slate-700 tabular-nums">
                        {prevDebtsTotal > 0 ? (
                          <div className="flex flex-col text-xs font-bold justify-center items-center">
                            <span className="text-rose-600 font-extrabold">{formatIQD(prevDebtsTotal)} د.ع</span>
                            {prevDebtsRemaining > 0 ? (
                              <span className="text-[10px] text-slate-400 font-bold">(المتبقي: {formatIQD(prevDebtsRemaining)} د.ع)</span>
                            ) : (
                              <span className="text-emerald-600 text-[10px] font-extrabold">(مسدد ✓)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-6 px-4 text-center font-bold text-slate-700 tabular-nums">
                        {formatIQD(s.tuition - s.discount)}
                      </td>
                      <td className="py-6 px-4 text-center font-bold text-emerald-600 tabular-nums">
                        {formatIQD(paid)}
                      </td>
                      <td className="py-6 px-4 text-center font-bold text-rose-500 tabular-nums">
                        {formatIQD(Math.max(0, remaining))}
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span
                          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${color} shadow-sm shadow-blue-500/10`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-6 px-8 text-left flex items-center gap-2">
                        <button
                          disabled={isPaid && remaining <= 0}
                          onClick={() => prepareQuickPayment(s)}
                          className={`px-4 py-2.5 rounded-xl font-black text-[10px] transition-all flex items-center gap-2 ${
                            isPaid && remaining <= 0
                              ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95"
                          }`}
                        >
                          <DollarSign size={14} />
                          <span>تسديد القسط</span>
                        </button>
                        <button
                          disabled={isPaid && remaining <= 0}
                          onClick={() => setPaymentModal(s)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isPaid
                              ? "bg-slate-100 text-slate-300"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95"
                          }`}
                          title="دفع قسط مخصص"
                        >
                          <CreditCard size={18} />
                        </button>
                        <button
                          onClick={() => setSelectedStudentCard(s)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-lg shadow-indigo-500/10 active:scale-95 transition-all"
                          title="كشف حساب الطالب"
                        >
                          <FileText size={18} />
                        </button>
                        {s.payments && s.payments.length > 0 && (
                          <button
                            onClick={() => setViewingReceiptsStudent(s)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-50 text-cyan-600 hover:bg-cyan-100 shadow-lg shadow-cyan-500/10 active:scale-95 transition-all"
                            title="عرض الوصولات"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {(() => {
                          const _paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
                          const _rem = Math.max(0, s.tuition - (s.discount || 0) - _paid);
                          const _ph = (s as any).guardianPhone || s.phone;
                          if (_rem > 0 && _ph && /^07/.test(_ph)) return (
                            <button onClick={() => {
                              const msg = `السلام عليكم ولي أمر الطالب: ${s.name}\nرصيد مستحق: ${new Intl.NumberFormat("en-US").format(_rem)} د.ع\nنرجو التسديد. شكراً`;
                              window.open(`https://wa.me/${_ph.replace(/^0/,"964")}?text=${encodeURIComponent(msg)}`, "_blank");
                            }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95" title="تذكير واتساب">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                            </button>
                          );
                          return null;
                        })()}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {/* All Students Statement */}
      {showAllStatements && (
        <AllStudentsStatement
          onClose={() => setShowAllStatements(false)}
          students={filtered.length > 0 ? filtered : students}
          schools={schools}
          grades={grades}
          systemSettings={systemSettings}
        />
      )}

      {/* Multi-student statements (from bulk selection) */}
      {showSelectedStatements && selectedForStatements.size > 0 && (
        <StudentAccountStatementModal
          students={students.filter((s) => selectedForStatements.has(s.id))}
          onClose={() => setShowSelectedStatements(false)}
          systemSettings={systemSettings}
        />
      )}

      {/* Individual Student Account Card */}
      {selectedStudentCard && (
        <StudentAccountCard
          student={selectedStudentCard}
          onClose={() => setSelectedStudentCard(null)}
          systemSettings={systemSettings}
        />
      )}

      {/* Viewing Receipts Modal */}
      <AnimatePresence>
        {viewingReceiptsStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative"
              dir="rtl"
            >
              <div className="bg-slate-800 p-8 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                    <Eye size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">وصل دفع الأقساط</h2>
                    <p className="text-slate-400 font-bold text-xs">
                      عرض واستعراض جميع الوصولات المدفوعة للطالب:{" "}
                      {viewingReceiptsStudent.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingReceiptsStudent(null)}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                {!viewingReceiptsStudent.payments ||
                viewingReceiptsStudent.payments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold">
                    لا توجد وصولات مدفوعة لهذا الطالب بعد.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viewingReceiptsStudent.payments.map((payment, index) => {
                      const isWithdrawn = (payment as any).isWithdrawn;
                      return (
                      <div
                        key={payment.id || index}
                        className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
                          isWithdrawn 
                            ? "bg-rose-50/50 border-rose-200 opacity-70" 
                            : "bg-slate-50 hover:bg-slate-100/50 border-slate-100"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-400">
                              رقم الوصل:
                            </span>
                            <span className={`text-sm font-black font-mono ${isWithdrawn ? "text-rose-400 line-through" : "text-blue-600"}`}>
                              #{/^\d+$/.test(String(payment.id)) ? String(payment.id).padStart(4, "0") : payment.id}
                            </span>
                            {isWithdrawn && (
                              <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
                                مسحوب
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-bold">
                            تاريخ الدفع: {payment.date}{" "}
                            {payment.notes && `| ${payment.notes}`}
                          </div>
                          {isWithdrawn && (payment as any).withdrawDate && (
                            <div className="text-[10px] text-rose-500 font-bold">
                              تاريخ السحب: {(payment as any).withdrawDate} — {(payment as any).withdrawReason}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <span className="text-xs font-black text-slate-400 block">
                              المبلغ المدفوع
                            </span>
                            <span className={`text-lg font-black font-mono ${isWithdrawn ? "text-rose-400 line-through" : "text-emerald-600"}`}>
                              {formatIQD(payment.amount)} د.ع
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setReceipt({
                                  student: viewingReceiptsStudent,
                                  payment: payment,
                                });
                                setViewingReceiptsStudent(null);
                              }}
                              className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/10 active:scale-95"
                            >
                              <Eye size={14} />
                              <span>عرض</span>
                            </button>
                            {!isWithdrawn && (
                              <>
                                <button
                                  onClick={() => {
                                    setWithdrawingPayment({ studentId: viewingReceiptsStudent.id, payment, index });
                                    setWithdrawReason("ترك المدرسة");
                                    setWithdrawNote("");
                                  }}
                                  className="bg-orange-500 text-white hover:bg-orange-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                                  title="سحب الوصل واسترجاع المبلغ"
                                >
                                  <RotateCcw size={14} />
                                  <span>سحب</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPayment({ studentId: viewingReceiptsStudent.id, payment, index });
                                    setEditAmount(String(payment.amount));
                                    setEditNotes(payment.notes || "");
                                  }}
                                  className="bg-amber-500 text-white hover:bg-amber-600 p-2 rounded-xl text-xs font-bold transition-colors active:scale-95"
                                  title="تعديل الوصل"
                                >
                                  <Edit2 size={14} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setDeletingPayment({ studentId: viewingReceiptsStudent.id, paymentId: payment.id, amount: payment.amount })}
                              className="bg-rose-500 text-white hover:bg-rose-600 p-2 rounded-xl text-xs font-bold transition-colors active:scale-95"
                              title="حذف الوصل"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setViewingReceiptsStudent(null)}
                  className="bg-white text-slate-500 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Receipt Modal ──────────────────────────────── */}
      <AnimatePresence>
        {editingPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Edit2 size={20} className="text-amber-500" /> تعديل الوصل
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">المبلغ (د.ع)</label>
                  <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">الملاحظات</label>
                  <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingPayment(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
                <button onClick={handleEditPayment}
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20">حفظ التعديل</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Receipt Confirmation ───────────────────────── */}
      <AnimatePresence>
        {deletingPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-800">تأكيد حذف الوصل</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                هل أنت متأكد من حذف هذا الوصل بمبلغ <span className="font-black text-rose-600">{new Intl.NumberFormat("en-US").format(deletingPayment.amount)} د.ع</span>؟
                <br/>سيتم إعادة حساب الأرصدة تلقائياً.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingPayment(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
                <button onClick={handleDeletePayment}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20">حذف الوصل</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Withdraw Receipt Modal ──────────────────────────────── */}
      <AnimatePresence>
        {withdrawingPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-orange-500 p-6 text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black">سحب الوصل واسترجاع المبلغ</h3>
                  <p className="text-orange-100 text-xs font-bold">المبلغ: {formatIQD(withdrawingPayment.payment.amount)} د.ع</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-sm text-orange-700 font-bold">
                  عند سحب الوصل سيتم إرجاع المبلغ للطالب وسيظهر الوصل كـ "مسحوب" في السجلات.
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 block mb-2">سبب السحب</label>
                  <select value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400">
                    {WITHDRAW_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 block mb-2">ملاحظات إضافية (اختياري)</label>
                  <textarea value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)}
                    placeholder="أدخل أي ملاحظات إضافية عن سبب السحب..."
                    rows={3}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 resize-none" />
                </div>
              </div>
              <div className="p-6 pt-0 flex gap-3">
                <button onClick={() => setWithdrawingPayment(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
                <button onClick={handleWithdrawPayment}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                  <RotateCcw size={16} />
                  تأكيد السحب
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative"
              dir="rtl"
            >
              <div className="bg-slate-800 p-8 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                    <CreditCard size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">تسديد قسط</h2>
                    <p className="text-slate-400 font-bold text-xs">
                      {paymentModal.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPaymentModal(null)}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex justify-between items-center text-emerald-700">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">
                      المبلغ المتبقي
                    </p>
                    <p className="text-2xl font-black tabular-nums">
                      {formatIQD(
                        paymentModal.tuition -
                          paymentModal.discount -
                          calculatePaid(paymentModal),
                      )}{" "}
                      د.ع
                    </p>
                  </div>
                  <Receipt size={32} />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 mr-2">
                      المبلغ المستلم (د.ع)
                    </label>
                    <input
                      type="text"
                      value={formatWithCommas(paymentAmount)}
                      onChange={(e) =>
                        handleDirectMoneyChange(e, setPaymentAmount)
                      }
                      placeholder="أدخل المبلغ المراد تسديده..."
                      className="w-full bg-slate-50 py-5 px-8 rounded-2xl text-2xl font-black text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all border border-slate-100 placeholder:text-slate-200 tabular-nums text-right font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 mr-2">
                      ملاحظات الوصل
                    </label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="أدخل ملاحظات اختيارية للوصل..."
                      className="w-full bg-slate-50 py-4 px-8 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all border border-slate-100 h-24 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
                >
                  تأكيد الدفع وإصدار وصل
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Pay Confirmation */}
      <AnimatePresence>
        {showBulkPayConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative p-10 space-y-8"
              dir="rtl"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <DollarSign size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800">
                    تسديد أقساط جماعي
                  </h2>
                  <p className="text-slate-500 font-bold">
                    أنت على وشك القيام بتسديد كامل الأقساط لـ
                    <span className="text-emerald-600 px-1 font-black underline">
                      {filtered.length}
                    </span>
                    طالباً. يرجى إدخال كلمة المرور للتأكيد.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="كلمة المرور الخاصة بك..."
                  value={bulkPayPasscode}
                  onChange={(e) => setBulkPayPasscode(e.target.value)}
                  className="w-full bg-slate-50 py-4 px-6 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-emerald-100 font-bold transition-all text-center text-lg"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleBulkPay}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                  >
                    تأكيد التسديد
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkPayConfirm(false);
                      setBulkPayPasscode("");
                    }}
                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal (Printable) */}
      <AnimatePresence>
        {receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex flex-col items-center overflow-y-auto"
          >
            {/* Fixed Controls Header */}
            <div className="sticky top-0 w-full bg-slate-900/90 border-b border-white/10 p-6 z-[110] no-print">
              <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    printDocument("receipt-to-print", systemSettings?.printSettings?.receiptSize || "A4");
                  }}
                  className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-white"
                >
                  <Receipt size={20} className="text-blue-600" />
                  <span>طباعة الوصل</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveAsImage}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-blue-500 shadow-blue-600/40"
                >
                  <Download size={20} />
                  <span>حفظ كصورة</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setReceipt(null)}
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
                <ReceiptPrint
                  student={receipt.student}
                  payment={receipt.payment}
                  systemSettings={systemSettings}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingStatementStudent && (
          <StudentAccountStatementModal
            student={viewingStatementStudent}
            onClose={() => setViewingStatementStudent(null)}
            systemSettings={systemSettings}
          />
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <AnimatePresence>
        {showBulkConfirm && (
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
              <div className="p-8 space-y-6">
                <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={40} />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-slate-800">
                    تنبيه تصفير الدفعات
                  </h2>
                  <p className="text-slate-500 font-bold">
                    هل أنت موافق على مسح كافة السجلات المالية لـ
                    <span className="text-rose-600 px-1 font-black underline">
                      {filtered.length}
                    </span>
                    طالباً المختارين حالياً؟ هذا الإجراء سيعيدهم إلى حالة "غير
                    مسدد".
                  </p>
                </div>
                <input
                  type="password"
                  value={bulkPasscode}
                  onChange={(e) => setBulkPasscode(e.target.value)}
                  placeholder="أدخل كلمة المرور للتأكيد"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl text-center font-black text-2xl focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all outline-none"
                  autoFocus
                />
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={handleBulkResetPayments}
                    className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-200"
                  >
                    تأكيد المسح الجماعي
                  </button>
                  <button
                    onClick={() => setShowBulkConfirm(false)}
                    className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Unpaid Students Report (Print) ── */}
      {showUnpaidReport && (() => {
        const unpaid = filtered.filter(s => {
          const pd = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
          return pd < (s.tuition - (s.discount || 0));
        });
        const totalDue = unpaid.reduce((s, st) => s + Math.max(0, st.tuition - (st.discount || 0) - (st.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0)), 0);
        return (
          <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-rose-600 p-4 text-white flex justify-between items-center shrink-0">
                <h2 className="font-black text-lg">كشف الطلاب غير المسددين ({unpaid.length} طالب)</h2>
                <div className="flex gap-2">
                  <button onClick={() => { const el = document.getElementById("unpaid-report-print"); if(el){const w=window.open("","_blank"); if(w){w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><style>*{font-family:Cairo,sans-serif;box-sizing:border-box}body{margin:0;padding:20px}@page{size:A4;margin:10mm}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;font-size:11px}th{background:#f0f0f0;font-weight:900}</style></head><body>'+el.innerHTML+'</body></html>'); w.document.close(); setTimeout(()=>{w.print();w.close()},500);}}}}
                    className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-bold hover:bg-white/30">طباعة A4</button>
                  <button onClick={() => setShowUnpaidReport(false)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20">✕</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div id="unpaid-report-print" style={{ fontFamily: "Cairo, sans-serif", direction: "rtl", color: "#000" }}>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>كشف الطلاب غير المسددين</h2>
                    <p style={{ fontSize: "11px", color: "#666" }}>العدد: {unpaid.length} طالب | إجمالي المتبقي: {new Intl.NumberFormat("en-US").format(totalDue)} د.ع</p>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: "30px" }}>ت</th>
                        <th>اسم الطالب</th>
                        <th>المرحلة</th>
                        <th>رقم ولي الأمر</th>
                        <th>القسط الكلي</th>
                        <th>المدفوع</th>
                        <th>المتبقي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaid.map((s, idx) => {
                        const pd = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
                        const rm = Math.max(0, s.tuition - (s.discount || 0) - pd);
                        return (
                          <tr key={s.id}>
                            <td style={{ textAlign: "center" }}>{idx + 1}</td>
                            <td style={{ fontWeight: 700 }}>{s.name}</td>
                            <td style={{ textAlign: "center" }}>{s.grade} / {s.section || "-"}</td>
                            <td style={{ textAlign: "center", direction: "ltr" }}>{(s as any).guardianPhone || s.phone || "-"}</td>
                            <td style={{ textAlign: "center" }}>{new Intl.NumberFormat("en-US").format(s.tuition - (s.discount || 0))}</td>
                            <td style={{ textAlign: "center" }}>{new Intl.NumberFormat("en-US").format(pd)}</td>
                            <td style={{ textAlign: "center", fontWeight: 700, color: "#dc2626" }}>{new Intl.NumberFormat("en-US").format(rm)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#f0f0f0", fontWeight: 900 }}>
                        <td colSpan={4} style={{ textAlign: "center" }}>المجموع</td>
                        <td style={{ textAlign: "center" }}>{new Intl.NumberFormat("en-US").format(unpaid.reduce((s, st) => s + st.tuition - (st.discount || 0), 0))}</td>
                        <td style={{ textAlign: "center" }}>{new Intl.NumberFormat("en-US").format(unpaid.reduce((s, st) => s + (st.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0), 0))}</td>
                        <td style={{ textAlign: "center", color: "#dc2626" }}>{new Intl.NumberFormat("en-US").format(totalDue)}</td>
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
  );
};

interface Expense {
  id: string;
  title: string;
  school: string;
  type: string;
  source: string;
  date: string;
  amount: number;
  receiver: string;
  notes: string;
  status: "pending" | "paid";
  paymentDate?: string;
  receiptNo?: number;
}

interface AdditionalRevenue {
  id: string;
  title: string;
  school: string;
  payer: string;
  amount: number;
  date: string;
  notes: string;
  status: "pending" | "received";
  receivedDate?: string;
  receiptNo?: number;
}

interface Investor {
  id: string;
  name: string;
  percentage: number;
  payments?: {
    id: string;
    amount: number;
    date: string;
    notes?: string;
    receiptNo?: number | string;
  }[];
}

interface SystemSettings {
  schoolName: string;
  schoolLogo: string | null;
  academicYear: string;
  address: string;
  lat?: number;
  lng?: number;
  gradePrices?: Record<string, number>;
  investors?: Investor[];
  sections?: string[];
  printSettings?: PrintSettings;
}

interface AppUser {
  id: string;
  fullname: string;
  username: string;
  password: string;
  permissions: string[];
  allowedSchools: string[];
  notes: string;
  linkedSchool?: string;
  schoolPicture?: string;
  /**
   * Marks how the account was created:
   *  - "superadmin"  → top-level school admin created by the SuperAdmin panel.
   *                    These are SEPARATE accounts and must NOT appear in any
   *                    school's "manage users" list.
   *  - "school"      → regular employee added by a school admin from within
   *                    their own account. Scoped to that school only.
   */
  createdBy?: "superadmin" | "school";
  /** The school admin (username) who created this user — for school-scoped users only. */
  createdByUsername?: string;
  /** Display name shown in the app (the username remains the immutable login id). */
  displayName?: string;
  /** Base64 image data used as the user's profile picture. */
  profilePicture?: string;
  /** Whether the account is active (can log in). Defaults to true. */
  isActive?: boolean;
  /** ISO date when the account was first activated/created. */
  activatedAt?: string;
  /** ISO date when the account was last deactivated (if currently inactive). */
  deactivatedAt?: string;
  /** Subscription plan type */
  subscriptionPlan?: "monthly" | "yearly";
  /** ISO date when the subscription expires. Auto-checked at login. */
  expiresAt?: string;
}

const processTransferStudent = (
  student: Student,
  targetSchool: string,
  targetGrade: string,
  targetSection: string,
  systemSettings: SystemSettings | undefined
): Student => {
  const currentYear = systemSettings?.academicYear || "2024-2025";
  const paidForCurrentYear = (student.payments || [])
    .filter((p) => p.schoolYear === currentYear)
    .reduce((sum, p) => sum + p.amount, 0);
  const remainingDues = student.tuition - (student.discount || 0) - paidForCurrentYear;

  let updatedDebts = student.previousDebts ? [...student.previousDebts] : [];
  if (remainingDues > 0) {
    const alreadyExists = updatedDebts.some((d) => d.year === currentYear);
    if (!alreadyExists) {
      updatedDebts.push({
        id: Math.random().toString(36).substring(2, 9),
        year: currentYear,
        amount: remainingDues,
        paid: 0,
        isPaying: true,
      });
    }
  }

  // Look up new price or fallback to current tuition
  let newTuition = student.tuition;
  if (systemSettings?.gradePrices && systemSettings.gradePrices[targetGrade] !== undefined) {
    newTuition = Number(systemSettings.gradePrices[targetGrade]);
  }

  return {
    ...student,
    school: targetSchool,
    grade: targetGrade,
    section: targetSection,
    tuition: newTuition,
    discount: 0, // Reset discount for the new year
    previousDebts: updatedDebts,
  };
};

const PERMISSIONS = [
  { id: "edit-data", label: "تعديل بيانات" },
  { id: "view-invoices", label: "كشف الفواتير والمصروفات" },
  { id: "view-vault", label: "كشف الصندوق" },
  { id: "add-students", label: "اضافة طلاب" },
  { id: "add-expenses", label: "اضافة مصروفات" },
  { id: "add-revenue", label: "اضافة ايرادات" },
  { id: "manage-employees", label: "إدارة الموظفين" },
  { id: "view-reports", label: "عرض التقارير والجرد" },
  { id: "manage-grades", label: "إدارة الدرجات والنتائج" },
  { id: "manage-attendance", label: "إدارة الحضور والغياب" },
  { id: "settings", label: "اعدادات النظام" },
  { id: "manage-users", label: "إدارة المستخدمين" },
];

// --- Tiles Data ---
const TILES: DashboardTile[] = [
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

// --- Grade Management Component ---

export default StudentInvoices;

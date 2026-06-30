/**
 * StudentSearch.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Monitor, Search, UserPlus, DollarSign, ChevronLeft, ChevronRight, Users, Wallet, Receipt, FileText, GraduationCap, TrendingUp, CreditCard, ArrowRight, X, Trash2, AlertCircle, Eye, ClipboardList, Download, School, Edit2, Check, Printer, FileSpreadsheet, Filter } from "lucide-react";
import { Bar, Area } from "recharts";
import html2canvas from "html2canvas";
import type { Student, Payment, AppUser, SystemSettings } from "@/types";
import { formatStudentCode, formatWithCommas } from "@/utils/format";
import { notify } from "@/utils/notify";
import { sendWhatsAppReceipt } from "@/utils/whatsapp";
import { printDocument, saveElementAsImage } from "@/utils/print";
import { VIEW_TO_PATH, PATH_TO_VIEW } from "@/constants";
import { processTransferStudent } from "@/utils/transfer";
import EditStudentModal from "@/components/students/EditStudentModal";
import StudentAccountStatementModal from "@/components/print/StudentAccountStatementModal";
import PrintReport from "@/components/print/PrintReport";
import ReceiptPrint from "@/components/print/ReceiptPrint";

const StudentSearch = ({
  onBack,
  onNavigate,
  students,
  onDelete,
  onTransfer,
  onUpdate,
  schools,
  grades,
  systemSettings,
  onAddPayment,
  receiptCounter,
  currentUser,
}: {
  onBack: () => void;
  onNavigate?: (view: string) => void;
  students: Student[];
  onDelete: (id: string) => void;
  onTransfer: (id: string) => void;
  onUpdate: (updated: Student[]) => void;
  schools: string[];
  grades: string[];
  systemSettings?: SystemSettings;
  onAddPayment?: (studentId: string, payment: Payment) => void;
  receiptCounter?: number;
  currentUser?: AppUser | null;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("جميع المدارس");
  const [selectedGrade, setSelectedGrade] = useState("جميع المراحل");
  const [selectedSection, setSelectedSection] = useState("جميع الشعب");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid" | "partial">("all");
  const [showUnpaidReport, setShowUnpaidReport] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [transferringStudent, setTransferringStudent] =
    useState<Student | null>(null);

  // Bulk selection and transfer states
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [bulkTransferModalOpen, setBulkTransferModalOpen] = useState(false);
  const [targetSchool, setTargetSchool] = useState("");
  const [targetGrade, setTargetGrade] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // States for payment inside search
  const [paymentModal, setPaymentModal] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [receipt, setReceipt] = useState<{
    student: Student;
    payment: Payment;
  } | null>(null);
  const [viewingReceiptsStudent, setViewingReceiptsStudent] =
    useState<Student | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const reportPageRef = useRef<HTMLDivElement>(null);

  const [showPrint, setShowPrint] = useState(false);
  const [printSelected, setPrintSelected] = useState(false);
  const [viewingStatementStudent, setViewingStatementStudent] =
    useState<Student | null>(null);

  const getLastPaymentDate = (s: Student) => {
    if (!s.payments || s.payments.length === 0) return "لا يوجد";
    const sorted = [...s.payments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0].date;
  };

  const formatLastPayDate = (dateStr: string) => {
    if (dateStr === "لا يوجد") return "لا يوجد";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[0]}\\${parseInt(parts[1], 10)}\\${parseInt(parts[2], 10)}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const calculatePaid = (s: Student) =>
    (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((acc, p) => acc + p.amount, 0);

  const prepareQuickPayment = (s: Student) => {
    const paid = calculatePaid(s);
    const totalRequired = s.tuition - (s.discount || 0);
    const remaining = totalRequired - paid;

    setPaymentModal(s);
    setPaymentAmount(remaining > 0 ? remaining.toString() : "");
    setPaymentNotes("تسديد قسط");
  };

  const handlePay = () => {
    if (!paymentModal || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      notify("يرجى إدخال مبلغ دفع صحيح", "warning");
      return;
    }

    const newPayment: Payment = {
      id: Date.now().toString(),
      amount: parseFloat(paymentAmount),
      date: new Date().toISOString().split("T")[0],
      schoolYear: new Date().getFullYear().toString(),
      notes: paymentNotes,
    };

    if (onAddPayment) {
      // App.tsx handles: adding payment to student, tagging academicYear, saving to Supabase
      onAddPayment(paymentModal.id, newPayment);
      if (paymentModal.guardianPhone) {
        sendWhatsAppReceipt(paymentModal.guardianPhone, paymentModal.name, newPayment.amount);
      }
    }

    setReceipt({ student: paymentModal, payment: newPayment });
    setPaymentModal(null);
    setPaymentAmount("");
    setPaymentNotes("");
  };

  const saveAsImage = async () => {
    await saveElementAsImage("receipt-to-print", `وصل_دفع_${receipt?.student.name || "طالب"}`);
  };

  const sections = [...(systemSettings?.sections || ["أ", "ب", "ج"])].sort();

  const filtered = students.filter((s) => {
    const matchesSearch = s.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSchool =
      selectedSchool === "جميع المدارس" || s.school === selectedSchool;
    const matchesGrade =
      selectedGrade === "جميع المراحل" || s.grade === selectedGrade;
    const matchesSection =
      selectedSection === "جميع الشعب" || s.section === selectedSection;

    // Payment status filter
    let matchesPayment = true;
    if (paymentFilter !== "all") {
      const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
      const required = s.tuition - (s.discount || 0);
      if (paymentFilter === "paid") matchesPayment = paid >= required && required > 0;
      else if (paymentFilter === "unpaid") matchesPayment = paid === 0;
      else if (paymentFilter === "partial") matchesPayment = paid > 0 && paid < required;
    }

    return matchesSearch && matchesSchool && matchesGrade && matchesSection && matchesPayment;
  });

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  return (
    <>
    {showPrint && (() => {
        const printRows = printSelected ? students.filter(s=>selectedStudentIds.includes(s.id)) : filtered;
        return (
          <PrintReport
            title={printSelected ? "قائمة الطلاب المحددين" : "قائمة الطلاب"}
            filterInfo={[selectedSchool!=="جميع المدارس"?selectedSchool:"",selectedGrade!=="جميع المراحل"?selectedGrade:"",searchTerm?"بحث: "+searchTerm:""].filter(Boolean).join(" — ")||"جميع الطلاب"}
            columns={[
              {label:"الاسم",key:"name",width:"23%",align:"right"},
              {label:"المدرسة",key:"school",width:"18%",align:"right"},
              {label:"المرحلة",key:"grade",width:"9%",align:"center"},
              {label:"القسط (د.ع)",key:"tuitionFmt",width:"12%",align:"center"},
              {label:"المدفوع (د.ع)",key:"paidFmt",width:"12%",align:"center"},
              {label:"المتبقي (د.ع)",key:"remFmt",width:"13%",align:"center"},
              {label:"رقم الولي",key:"phone",width:"13%",align:"center"},
            ]}
            rows={printRows.map(s=>{
              const net=s.tuition-(s.discount||0),paid=(s.payments||[]).filter((p:any)=>!p.isWithdrawn).reduce((a,p)=>a+p.amount,0),rem=Math.max(0,net-paid);
              return {name:s.name,school:s.school,grade:s.grade+" "+(s.section||""),
                tuitionFmt:new Intl.NumberFormat("en-US").format(net),
                paidFmt:new Intl.NumberFormat("en-US").format(paid),
                remFmt:rem>0?new Intl.NumberFormat("en-US").format(rem):"مسدَّد",
                phone:s.guardianPhone||"—",
                __colors:{paidFmt:"#16a34a",remFmt:rem>0?"#dc2626":"#16a34a"}};
            })}
            totals={{
              tuitionFmt:new Intl.NumberFormat("en-US").format(printRows.reduce((a,s)=>a+(s.tuition-(s.discount||0)),0)),
              paidFmt:new Intl.NumberFormat("en-US").format(printRows.reduce((a,s)=>a+(s.payments||[]).filter((p:any)=>!p.isWithdrawn).reduce((b,p)=>b+p.amount,0),0)),
              remFmt:new Intl.NumberFormat("en-US").format(printRows.reduce((a,s)=>{const n=s.tuition-(s.discount||0),p=(s.payments||[]).filter((p:any)=>!p.isWithdrawn).reduce((b,pp)=>b+pp.amount,0);return a+Math.max(0,n-p);},0))
            }}
            systemSettings={systemSettings}
            onClose={()=>{setShowPrint(false);setPrintSelected(false);}}
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
      {/* ── Modern light header ───────────────────────────────── */}
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30"
            >
              <Search size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">البحث عن طالب</h1>
              <p className="text-[10px] font-bold text-slate-400">{filtered.length} نتيجة من إجمالي {students.length} طالب</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setPrintSelected(false); setShowPrint(true); }}
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-black transition-all"
          >
            <Download size={14} /><span className="hidden sm:inline">طباعة القائمة</span>
          </motion.button>
        </div>
        {/* Quick Add Student Button */}
        {onNavigate && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate("add-student")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all">
            <UserPlus size={16} strokeWidth={2.5} />
            <span className="hidden md:inline">إضافة طالب</span>
          </motion.button>
        )}
      </header>
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 scrollbar-hide" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Quick stats row */}
          {(() => {
            const totalPaid = filtered.reduce((s, st) => s + (st.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0), 0);
            const totalDue = filtered.reduce((s, st) => s + Math.max(0, st.tuition - (st.discount || 0) - (st.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0)), 0);
            const paidCount = filtered.filter(st => {
              const paid = (st.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
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
                  { label: "النتائج", value: filtered.length.toString(), icon: <Users size={18}/>, from: "from-cyan-500", to: "to-blue-600", shadow: "shadow-cyan-500/25" },
                  { label: "إجمالي المدفوع", value: fmtNum(totalPaid), icon: <Wallet size={18}/>, from: "from-emerald-500", to: "to-teal-600", shadow: "shadow-emerald-500/25" },
                  { label: "إجمالي المتبقي", value: fmtNum(totalDue), icon: <ClipboardList size={18}/>, from: "from-amber-500", to: "to-orange-600", shadow: "shadow-amber-500/25" },
                  { label: "مسددون كاملاً", value: paidCount.toString() + " طالب", icon: <Check size={18}/>, from: "from-violet-500", to: "to-purple-600", shadow: "shadow-violet-500/25" },
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

          {/* Search & Filter Bar — simplified, no big stat card duplicate */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4"
          >
            <div className="relative">
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="ابحث باسم الطالب أو رقم الطالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 py-3 pr-12 pl-4 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:bg-white border border-transparent focus:border-cyan-200 transition-all font-bold"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Filter size={11}/> المرحلة الدراسية
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all"
                >
                  <option>جميع المراحل</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Filter size={11}/> الشعبة
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all"
                >
                  <option>جميع الشعب</option>
                  {sections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Filter size={11}/> حالة الدفع
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="w-full bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all"
                >
                  <option value="all">الكل</option>
                  <option value="paid">مسدد بالكامل</option>
                  <option value="partial">مسدد جزئياً</option>
                  <option value="unpaid">غير مسدد</option>
                </select>
              </div>
              {(searchTerm || selectedGrade !== "جميع المراحل" || selectedSection !== "جميع الشعب" || paymentFilter !== "all") && (
                <div className="flex items-end">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSearchTerm(""); setSelectedGrade("جميع المراحل"); setSelectedSection("جميع الشعب"); setPaymentFilter("all"); }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-xs font-black transition-all whitespace-nowrap"
                  >
                    مسح الفلاتر
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Unpaid Actions */}
          {(paymentFilter === "unpaid" || paymentFilter === "partial") && filtered.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-xl p-3 border border-rose-100 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-black text-rose-500">⚠️ {filtered.length} طالب:</span>
              <button onClick={() => setShowUnpaidReport(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 active:scale-95">
                طباعة كشف
              </button>
              <button onClick={() => {
                filtered.forEach(s => {
                  const ph = (s as any).guardianPhone || s.phone;
                  if (ph && /^07/.test(ph)) {
                    const pd = (s.payments||[]).filter((p:any)=>!p.isWithdrawn).reduce((a,p)=>a+p.amount,0);
                    const rm = Math.max(0,s.tuition-(s.discount||0)-pd);
                    if (rm > 0) {
                      const msg = `السلام عليكم ولي أمر الطالب: ${s.name}\nرصيد مستحق: ${new Intl.NumberFormat("en-US").format(rm)} د.ع\nنرجو التسديد. شكراً`;
                      window.open(`https://wa.me/${ph.replace(/^0/,"964")}?text=${encodeURIComponent(msg)}`, "_blank");
                    }
                  }
                });
              }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95">
                تذكير الكل واتساب
              </button>
            </motion.div>
          )}

          {/* Students List Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden pb-10">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 text-xs font-black border-b-2 border-slate-200">
                    <th className="py-4 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                        checked={filtered.length > 0 && filtered.every((s) => selectedStudentIds.includes(s.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds((prev) => {
                              const union = new Set([...prev, ...filtered.map((s) => s.id)]);
                              return Array.from(union);
                            });
                          } else {
                            setSelectedStudentIds((prev) =>
                              prev.filter((id) => !filtered.some((s) => s.id === id))
                            );
                          }
                        }}
                      />
                    </th>
                    <th className="py-4 px-4 text-center">كود الطالب</th>
                    <th className="py-4 px-4">اسم الطالب</th>
                    <th className="py-4 px-4">المرحلة / الشعبة</th>
                    <th className="py-4 px-4 text-left">القسط الصافي</th>
                    <th className="py-4 px-4 text-left">المدفوع</th>
                    <th className="py-4 px-4 text-left">المتبقي</th>
                    <th className="py-4 px-4 text-left">الديون السابقة</th>
                    <th className="py-4 px-4 text-center">الحالة</th>
                    <th className="py-4 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((student, idx) => {
                    const netTuition = student.tuition - (student.discount || 0);
                    const paid = calculatePaid(student);
                    const remaining = Math.max(0, netTuition - paid);
                    const isFullyPaid = paid >= netTuition;

                    const gradesList = student.studentGrades || [];
                    const failCount = gradesList.filter((g) => g.score < 50).length;

                    const prevDebtsTotal = student.previousDebts ? student.previousDebts.reduce((sum, d) => sum + d.amount, 0) : 0;
                    const prevDebtsRemaining = student.previousDebts ? student.previousDebts.reduce((sum, d) => sum + (d.amount - (d.paid || 0)), 0) : 0;

                    return (
                      <tr 
                        key={student.id} 
                        className="hover:bg-slate-50/80 transition-colors text-xs font-bold text-slate-700"
                      >
                        <td className="py-4 px-4 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds((prev) => [...prev, student.id]);
                              } else {
                                setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
                              }
                            }}
                          />
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-[10px] text-slate-400">
                          #{formatStudentCode(student.id)}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">
                          {student.name}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          الصف {student.grade} - الشعبة {student.section || "N/A"}
                        </td>
                        <td className="py-4 px-4 text-left font-mono text-slate-800 tabular-nums">
                          {formatIQD(netTuition)} د.ع
                        </td>
                        <td className="py-4 px-4 text-left font-mono text-emerald-600 tabular-nums">
                          {formatIQD(paid)} د.ع
                        </td>
                        <td className="py-4 px-4 text-left font-mono text-rose-600 tabular-nums">
                          {formatIQD(remaining)} د.ع
                        </td>
                        <td className="py-4 px-4 text-left font-mono text-slate-700 tabular-nums">
                          {prevDebtsTotal > 0 ? (
                            <div className="flex flex-col text-[10px] font-bold">
                              <span className="text-rose-600">{formatIQD(prevDebtsTotal)} د.ع</span>
                              {prevDebtsRemaining > 0 ? (
                                <span className="text-[9px] text-slate-400">(المتبقي: {formatIQD(prevDebtsRemaining)} د.ع)</span>
                              ) : (
                                <span className="text-emerald-600 font-extrabold">(مسدد ✓)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              failCount > 0
                                ? "bg-amber-50 text-amber-600 border border-amber-100/50"
                                : gradesList.length > 0
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                                : "bg-slate-50 text-slate-400 border border-slate-100"
                            }`}
                          >
                            {failCount > 0 ? `مكمل بـ ${failCount}` : gradesList.length > 0 ? "ناجح" : "لا يوجد رصد"}
                          </span>
                        </td>
                        <td className="py-4 px-4 relative">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              disabled={isFullyPaid}
                              onClick={() => prepareQuickPayment(student)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                                isFullyPaid
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95 cursor-pointer"
                              }`}
                              title="تسديد القسط"
                            >
                              <DollarSign size={13} />
                              <span>تسديد</span>
                            </button>

                            <button
                              onClick={() => setViewingStatementStudent(student)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                              title="كشف حساب الطالب"
                            >
                              <FileText size={13} />
                              <span>كشف الحساب</span>
                            </button>

                            {student.payments && student.payments.length > 0 && (
                              <button
                                onClick={() => setViewingReceiptsStudent(student)}
                                className="bg-cyan-50 hover:bg-cyan-100 text-cyan-600 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                                title="عرض الوصولات"
                              >
                                <Eye size={13} />
                                <span>الوصولات</span>
                              </button>
                            )}

                            <div className="w-px h-5 bg-slate-200/80 mx-1" />

                            <button
                              onClick={() => setViewingStudent(student)}
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              title="عرض التفاصيل"
                            >
                              <Monitor size={13} />
                            </button>
                            <button
                              onClick={() => setEditingStudent(student)}
                              className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                              title="تعديل تفاصيل الطالب"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setTransferringStudent(student)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                              title="نقل الطالب لصف آخر"
                            >
                              <TrendingUp size={13} />
                            </button>
                            <button
                              onClick={() => onDelete(student.id)}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              title="حذف الطالب"
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
                  <p className="text-slate-400 font-bold">لا يوجد طلاب يطابقون خيارات البحث المحددة.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editing Modal */}
      <AnimatePresence>
        {editingStudent && (
          <EditStudentModal
            student={editingStudent}
            schools={schools}
            grades={grades}
            onClose={() => setEditingStudent(null)}
            onSave={(updatedStudent) => {
              const updatedStudents = students.map((s) =>
                s.id === updatedStudent.id ? updatedStudent : s,
              );
              onUpdate(updatedStudents);
              setEditingStudent(null);
            }}
            systemSettings={systemSettings}
          />
        )}
      </AnimatePresence>

      {/* Viewing Modal */}
      <AnimatePresence>
        {viewingStudent && (
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
              className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative"
              dir="rtl"
            >
              <div className="bg-blue-600 p-8 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">{viewingStudent.name}</h2>
                  <p className="text-blue-100 font-bold mt-1">
                    تاريخ التسجيل: {viewingStudent.date}
                  </p>
                </div>
                <button
                  onClick={() => setViewingStudent(null)}
                  className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      إجمالي الغيابات
                    </p>
                    <p className="text-xl font-black text-rose-600">
                      {viewingStudent.attendance?.filter(
                        (a) => a.status === "absent",
                      ).length || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      إجمالي التأخير
                    </p>
                    <p className="text-xl font-black text-amber-600">
                      {viewingStudent.attendance?.filter(
                        (a) => a.status === "late",
                      ).length || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      المعدل العام
                    </p>
                    <p className="text-xl font-black text-emerald-600">
                      {(() => {
                        const grades = viewingStudent.studentGrades || [];
                        if (grades.length === 0) return "0%";
                        const total = grades.reduce(
                          (acc, curr) => acc + curr.score,
                          0,
                        );
                        return (total / grades.length).toFixed(1) + "%";
                      })()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      الحالة الدراسية
                    </p>
                    <p
                      className={`text-xl font-black ${(() => {
                        const grades = viewingStudent.studentGrades || [];
                        const failCount = grades.filter(
                          (g) => g.score < 50,
                        ).length;
                        if (failCount > 0) return "text-amber-600";
                        if (grades.length > 0) return "text-emerald-600";
                        return "text-slate-400";
                      })()}`}
                    >
                      {(() => {
                        const grades = viewingStudent.studentGrades || [];
                        const failCount = grades.filter(
                          (g) => g.score < 50,
                        ).length;
                        if (failCount > 0) return `مكمل بـ ${failCount} مواد`;
                        if (grades.length > 0) return "ناجح";
                        return "قيد الرصد";
                      })()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      المدرسة
                    </p>
                    <p className="font-bold text-slate-700">
                      {viewingStudent.school}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      المرحلة / الشعبة
                    </p>
                    <p className="font-bold text-slate-700">
                      الصف {viewingStudent.grade} - {viewingStudent.section}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      رقم هاتف ولي الأمر
                    </p>
                    <p className="font-bold text-slate-700">
                      {viewingStudent.guardianPhone}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      رقم هاتف آخر
                    </p>
                    <p className="font-bold text-slate-700">
                      {viewingStudent.motherPhone || "غير متوفر"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      القسط الكلي
                    </p>
                    <p className="font-bold text-emerald-600">
                      {formatIQD(viewingStudent.tuition)} د.ع
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      الخصم
                    </p>
                    <p className="font-bold text-rose-500">
                      {formatIQD(viewingStudent.discount)} د.ع
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    ملاحظات إضافية
                  </p>
                  <p className="text-sm font-bold text-slate-600 italic">
                    "{viewingStudent.notes || "لا توجد ملاحظات"}"
                  </p>
                </div>

                <button
                  onClick={() => setViewingStudent(null)}
                  className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black shadow-xl shadow-slate-800/10 hover:bg-slate-900 transition-colors"
                >
                  إغلاق التفاصيل
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Student Modal */}
      <AnimatePresence>
        {transferringStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[75] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative p-10 space-y-6"
              dir="rtl"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800">
                    ترحيل / نقل الطالب
                  </h2>
                  <p className="text-slate-500 font-bold">
                    اختر المرحلة الدراسية الجديدة للطالب:
                    <br />
                    <span className="text-emerald-600 px-1 font-black underline text-lg">
                      {transferringStudent.name}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">
                    المرحلة الحالية: {transferringStudent.grade}
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto p-2 border border-slate-100 rounded-2xl bg-slate-50">
                    {grades.map((grade) => {
                      const isCurrent = grade === transferringStudent.grade;
                      return (
                        <button
                          key={grade}
                          onClick={() => {
                            const updatedStudents = students.map((s) =>
                              s.id === transferringStudent.id
                                ? { ...s, grade: grade }
                                : s,
                            );
                            onUpdate(updatedStudents);
                            setTransferringStudent(null);
                          }}
                          className={`p-3 rounded-xl font-black text-xs transition-all text-center border ${
                            isCurrent
                              ? "bg-amber-100 border-amber-300 text-amber-700"
                              : "bg-white border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 shadow-sm"
                          }`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setTransferringStudent(null)}
                    className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all text-sm"
                  >
                    إلغاء
                  </button>
                </div>
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
                    <p className="text-slate-400 font-bold text-xs">{paymentModal.name}</p>
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">المبلغ المتبقي</p>
                    <p className="text-2xl font-black tabular-nums">{formatIQD(paymentModal.tuition - paymentModal.discount - calculatePaid(paymentModal))} د.ع</p>
                  </div>
                  <Receipt size={32} />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 mr-2">المبلغ المستلم (د.ع)</label>
                    <input
                      type="text"
                      value={formatWithCommas(paymentAmount)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '');
                        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                          setPaymentAmount(raw);
                        }
                      }}
                      placeholder="أدخل قيمة القسط المستلم..."
                      className="w-full bg-slate-50 py-4 px-8 rounded-2xl text-2xl font-black text-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all border border-slate-100 placeholder:text-slate-200 tabular-nums text-right font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 mr-2">ملاحظات الوصل</label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="مثال: تسديد قسط شهر أيار..."
                      className="w-full bg-slate-50 p-4 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border border-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button
                  onClick={handlePay}
                  className="flex-1 bg-emerald-600 text-white p-5 rounded-[2rem] font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  تأكيد وطباعة الوصل
                </button>
                <button
                  onClick={() => setPaymentModal(null)}
                  className="flex-1 bg-white text-slate-500 p-5 rounded-[2rem] font-black text-lg border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <p className="text-slate-400 font-bold text-xs">عرض واستعراض جميع الوصولات المدفوعة للطالب: {viewingReceiptsStudent.name}</p>
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
                {(!viewingReceiptsStudent.payments || viewingReceiptsStudent.payments.length === 0) ? (
                  <div className="text-center py-12 text-slate-400 font-bold">
                    لا توجد وصولات مدفوعة لهذا الطالب بعد.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viewingReceiptsStudent.payments.map((payment, index) => (
                      <div 
                        key={payment.id || index} 
                        className="bg-slate-50 hover:bg-slate-100/50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-400">رقم الوصل:</span>
                            <span className="text-sm font-black text-blue-600 font-mono">#{/^\d+$/.test(String(payment.id)) ? String(payment.id).padStart(4, "0") : payment.id}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-bold">
                            تاريخ الدفع: {payment.date} {payment.notes && `| ${payment.notes}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <span className="text-xs font-black text-slate-400 block">المبلغ المدفوع</span>
                            <span className="text-lg font-black text-emerald-600 font-mono">{formatIQD(payment.amount)} د.ع</span>
                          </div>
                          <button 
                            onClick={() => {
                              setReceipt({ student: viewingReceiptsStudent, payment: payment });
                              setViewingReceiptsStudent(null);
                            }}
                            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-md shadow-blue-500/10 active:scale-95"
                          >
                            <Eye size={14} />
                            <span>عرض الوصل</span>
                          </button>
                        </div>
                      </div>
                    ))}
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

      {/* Receipt Modal */}
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
              <div className="print-area w-full bg-white shadow-2xl rounded-3xl" ref={receiptRef}>
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

      {/* Student Individual Account Statement Modal */}
      <AnimatePresence>
        {viewingStatementStudent && (
          <StudentAccountStatementModal
            student={viewingStatementStudent}
            onClose={() => setViewingStatementStudent(null)}
            systemSettings={systemSettings}
          />
        )}
      </AnimatePresence>

      {/* Student accounts ledger report (A4 Excel) modal */}
      <AnimatePresence>
        {false && (() => {
          const reportRowsPerPage = 20;
          const activeReportPage = 0;
          const setShowReportModal = (v: any) => {};
          const setReportRowsPerPage = (v: any) => {};
          const setActiveReportPage = (v: any) => {};
          const reportFontSize = "text-xs p-1.5";
          const setReportFontSize = (v: any) => {};
          const setPrintScope = (v: any) => {};
          const printScope = "all";
          const pages = [];
          for (let i = 0; i < filtered.length; i += reportRowsPerPage) {
            pages.push(filtered.slice(i, i + reportRowsPerPage));
          }
          const totalPages = pages.length || 1;
          const activePageData = pages[activeReportPage] || [];

          const grandTotalTuition = filtered.reduce((acc, s) => acc + (s.tuition - (s.discount || 0)), 0);
          const grandTotalPaid = filtered.reduce((acc, s) => acc + calculatePaid(s), 0);
          const grandTotalRemaining = filtered.reduce((acc, s) => acc + Math.max(0, s.tuition - (s.discount || 0) - calculatePaid(s)), 0);

          const handleSaveReportImage = async () => {
            if (reportPageRef.current) {
              try {
                const canvas = await html2canvas(reportPageRef.current, {
                  scale: 2,
                  useCORS: true,
                  backgroundColor: "#ffffff",
                });
                const link = document.createElement("a");
                link.download = `تقرير_حسابات_الطلاب_صفحة_${activeReportPage + 1}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
              } catch (err) {
                console.error("Error saving image:", err);
              }
            }
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col overflow-y-auto font-sans text-right"
              dir="rtl"
            >
              {/* Top Control Panel - Hidden during print */}
              <div className="sticky top-0 w-full bg-slate-900/95 border-b border-white/10 p-4 md:p-6 z-[110] no-print" dir="rtl">
                <div className="max-w-6xl mx-auto flex flex-col gap-4 font-sans text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
                        <FileSpreadsheet size={20} />
                      </div>
                      <div>
                        <h2 className="text-sm md:text-lg font-black text-white">معاينة كشف حسابات الطلاب للطباعة (A4)</h2>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">تطابق تام وبأعلى دقة، متجاوب بالكامل وجاهز للطباعة الفورية</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Responsive controls sheet */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    {/* Rows per page */}
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] font-black text-slate-400">عدد الأسطر لكل صفحة (A4):</label>
                      <select
                        value={reportRowsPerPage}
                        onChange={(e) => {
                          setReportRowsPerPage(Number(e.target.value));
                          setActiveReportPage(0);
                        }}
                        className="bg-slate-900 text-white rounded-xl py-2 px-3 focus:outline-none border border-slate-700 text-xs font-bold cursor-pointer text-right"
                      >
                        <option value={10}>10 أسطر</option>
                        <option value={15}>15 سطرًا</option>
                        <option value={20}>20 سطرًا (الافتراضي)</option>
                        <option value={25}>25 سطرًا</option>
                        <option value={30}>30 سطرًا</option>
                        <option value={40}>40 سطرًا</option>
                      </select>
                    </div>

                    {/* Font size selection */}
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] font-black text-slate-400 font-sans">حجم خط الجدول:</label>
                      <select
                        value={reportFontSize}
                        onChange={(e) => setReportFontSize(e.target.value)}
                        className="bg-slate-900 text-white rounded-xl py-2 px-3 focus:outline-none border border-slate-700 text-xs font-bold cursor-pointer text-right"
                      >
                        <option value="text-[10px] p-1">صغير جداً (10px)</option>
                        <option value="text-xs p-1.5">صغير (12px - مناسب للطباعة)</option>
                        <option value="text-sm p-2">متوسط (14px - الافتراضي)</option>
                        <option value="text-base p-2.5">كبير (16px)</option>
                      </select>
                    </div>

                    {/* Preview Page Selector */}
                    <div className="space-y-1.5 flex flex-col col-span-1">
                      <label className="text-[10px] font-black text-slate-400">معاينة وتصفح التقرير:</label>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={activeReportPage === 0}
                          onClick={() => setActiveReportPage(p => Math.max(0, p - 1))}
                          className="bg-slate-900 border border-slate-700 hover:border-slate-500 disabled:opacity-40 text-white p-2 rounded-xl transition-colors cursor-pointer"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <span className="flex-1 text-center font-black text-xs text-white bg-slate-900/50 py-1.5 rounded-lg border border-slate-700">
                          صفحة {activeReportPage + 1} من {totalPages}
                        </span>
                        <button
                          disabled={activeReportPage >= totalPages - 1}
                          onClick={() => setActiveReportPage(p => Math.min(totalPages - 1, p + 1))}
                          className="bg-slate-900 border border-slate-700 hover:border-slate-500 disabled:opacity-40 text-white p-2 rounded-xl transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Print buttons */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPrintScope("all");
                            setTimeout(() => window.print(), 100);
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                        >
                          <Printer size={14} />
                          <span>طباعة الكل ({totalPages} ص)</span>
                        </button>
                        <button
                          onClick={() => {
                            setPrintScope("current");
                            setTimeout(() => window.print(), 100);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-600/20 active:scale-95 whitespace-nowrap"
                        >
                          <Printer size={14} />
                          <span>طباعة المعروض</span>
                        </button>
                        <button
                          onClick={handleSaveReportImage}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                          title="حفظ المعروض كصورة"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Printable Area Wrapper */}
              <div className="flex-1 flex justify-center py-8 px-4 md:px-8 bg-slate-800/40" dir="rtl">
                <style>{`
                  @media print {
                    body * {
                      visibility: hidden !important;
                    }
                    html, body {
                      height: auto !important;
                      overflow: visible !important;
                      background-color: white !important;
                    }
                    #report-print-container, #report-print-container * {
                      visibility: visible !important;
                    }
                    #report-print-container {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      background-color: white !important;
                    }
                    .report-a4-page {
                      width: 297mm !important;
                      height: 209mm !important;
                      page-break-after: always !important;
                      break-after: page !important;
                      box-shadow: none !important;
                      border: none !important;
                      margin: 0 !important;
                      padding: 15mm !important;
                      background: white !important;
                    }
                    .no-print {
                      display: none !important;
                    }
                  }
                  /* Screen Preview A4 Landscape styles */
                  .report-a4-page {
                    width: 297mm;
                    min-height: 210mm;
                    background: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    padding: 12mm;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    color: black !important;
                  }
                  @media (max-width: 1280px) {
                    .report-a4-preview-wrapper {
                      transform: scale(0.8);
                      transform-origin: top center;
                    }
                  }
                  @media (max-width: 1024px) {
                    .report-a4-preview-wrapper {
                      transform: scale(0.65);
                      transform-origin: top center;
                    }
                  }
                  @media (max-width: 768px) {
                    .report-a4-preview-wrapper {
                      transform: scale(0.5);
                      transform-origin: top center;
                    }
                  }
                  @media (max-width: 480px) {
                    .report-a4-preview-wrapper {
                      transform: scale(0.35);
                      transform-origin: top center;
                    }
                  }
                `}</style>

                <div 
                  className="report-a4-preview-wrapper w-full flex flex-col items-center pb-24 overflow-x-auto"
                  ref={reportPageRef}
                >
                  <div id="report-print-container" className="flex flex-col gap-8">
                    {/* Render active content according to selected scope (current page vs all) */}
                    {(printScope === "all" ? pages : [activePageData]).map((pageRows, pageIdx) => {
                      const realPageNum = printScope === "all" ? pageIdx : activeReportPage;
                      const isLastPage = realPageNum === totalPages - 1;

                      return (
                        <div key={realPageNum} className="report-a4-page border border-slate-300 relative rounded-xl text-black flex flex-col justify-between" dir="rtl">
                          <div>
                            {/* Page Top Header Section */}
                            <div className="flex justify-between items-start mb-6">
                              {/* Right block: Name of School */}
                              <div className="space-y-1 text-right text-black font-semibold text-xs leading-relaxed shrink-0">
                                <p className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                                  <span className="text-slate-400 font-sans">المدرسة:</span>
                                  <span className="text-slate-900 font-extrabold">{systemSettings?.schoolName || "مدارس مرتضى الأهلية"}</span>
                                </p>
                                <p className="flex items-center gap-1.5 text-xs">
                                  <span className="text-slate-400">العام الدراسي:</span>
                                  <span className="text-slate-800 font-bold font-mono">{systemSettings?.academicYear || "2025-2026"}</span>
                                </p>
                                <p className="flex items-center gap-1.5 text-xs">
                                  <span className="text-slate-400">التاريخ:</span>
                                  <span className="text-slate-800 font-bold font-mono">
                                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })}
                                  </span>
                                </p>
                              </div>

                              {/* Middle block: Centered elegant box title */}
                              <div className="flex flex-col items-center">
                                <div className="border-[3px] border-slate-900 border-double py-2 px-8 text-center font-black text-xl tracking-wider text-slate-900 uppercase bg-white">
                                  بيانات حسابات الطلبة
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 mt-1 font-mono">
                                  صفحة {realPageNum + 1} من {totalPages}
                                </span>
                              </div>

                              {/* Left block: Optional School Logo Picture */}
                              <div className="flex flex-col items-end shrink-0 w-32">
                                {systemSettings?.schoolLogo ? (
                                  <img
                                    src={systemSettings.schoolLogo}
                                    alt="School Logo"
                                    className="w-14 h-14 object-contain rounded-xl border border-slate-300 p-1"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-300 border-dashed flex flex-col items-center justify-center text-slate-400 gap-1 select-none">
                                    <GraduationCap size={20} />
                                    <span className="text-[6px] font-bold">بدون شعار</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* The ledger spreadsheet table */}
                            <div className="w-full">
                              <table className="w-full text-right border-collapse table-fixed select-text" dir="rtl">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-900 border-[1.5px] border-slate-900 font-black">
                                    <th className="border-[1.5px] border-slate-900 p-2 text-center text-[11px] md:text-xs" style={{ width: "6%" }}>ت</th>
                                    <th className="border-[1.5px] border-slate-900 p-2 text-right text-[11px] md:text-xs" style={{ width: "30%" }}>اسم الطالب</th>
                                    <th className="border-[1.5px] border-slate-900 p-2 text-center text-[11px] md:text-xs" style={{ width: "16%" }}>القسط (بعد الخصم)</th>
                                    <th className="border-[1.5px] border-slate-900 p-2 text-center text-[11px] md:text-xs" style={{ width: "16%" }}>المدفوعات</th>
                                    <th className="border-[1.5px] border-slate-900 p-2 text-center text-[11px] md:text-xs" style={{ width: "15%" }}>الباقي</th>
                                    <th className="border-[1.5px] border-slate-900 p-2 text-center text-[11px] md:text-xs" style={{ width: "17%" }}>تاريخ آخر قسط</th>
                                    <th className="border-[1.5px] border-slate-900 p-2 text-right text-[11px] md:text-xs" style={{ width: "12%" }}>ملاحظات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pageRows.map((student, sIdx) => {
                                    const realIndex = realPageNum * reportRowsPerPage + sIdx + 1;
                                    const totalReq = student.tuition - (student.discount || 0);
                                    const paid = calculatePaid(student);
                                    const bal = totalReq - paid;
                                    const lastPayDateStr = getLastPaymentDate(student);

                                    return (
                                      <tr key={student.id} className="hover:bg-slate-50 border-[1.5px] border-slate-900 transition-colors">
                                        <td className="border-[1.5px] border-slate-900 p-1.5 text-center font-bold font-mono text-[11px] text-slate-950">
                                          {realIndex}
                                        </td>
                                        <td className="border-[1.5px] border-slate-900 p-1.5 text-right font-black text-slate-900 truncate text-[11px] md:text-xs">
                                          {student.name}
                                        </td>
                                        <td className="border-[1.5px] border-slate-900 p-1.5 text-center font-extrabold font-mono text-slate-900 text-[11px] md:text-xs tabular-nums">
                                          {formatIQD(totalReq)}
                                        </td>
                                        <td className="border-[1.5px] border-slate-900 p-1.5 text-center font-extrabold font-mono text-slate-900 text-[11px] md:text-xs tabular-nums">
                                          {formatIQD(paid)}
                                        </td>
                                        <td className={`border-[1.5px] border-slate-900 p-1.5 text-center font-extrabold font-mono text-[11px] md:text-xs tabular-nums ${bal === 0 ? "text-red-600 font-extrabold" : "text-slate-900"}`}>
                                          {formatIQD(bal)}
                                        </td>
                                        <td className="border-[1.5px] border-slate-900 p-1.5 text-center font-bold font-mono text-[11px] md:text-xs">
                                          {formatLastPayDate(lastPayDateStr)}
                                        </td>
                                        <td className="border-[1.5px] border-slate-900 p-1.5 text-right font-semibold text-slate-500 truncate text-[10px]">
                                          {student.notes || ""}
                                        </td>
                                      </tr>
                                    );
                                  })}

                                  {isLastPage && (
                                    <tr className="font-extrabold bg-slate-100 text-slate-900 border-[1.5px] border-slate-900 leading-relaxed font-sans">
                                      <td className="border-[1.5px] border-slate-900 p-2 text-center bg-slate-150"></td>
                                      <td className="border-[1.5px] border-slate-900 p-2 text-center font-black text-xs md:text-sm bg-slate-150 text-slate-900">المجموع</td>
                                      <td className="border-[1.5px] border-slate-900 p-2 text-center font-black font-mono text-xs md:text-sm bg-slate-150 text-slate-900">{formatIQD(grandTotalTuition)}</td>
                                      <td className="border-[1.5px] border-slate-900 p-2 text-center font-black font-mono text-xs md:text-sm bg-slate-150 text-slate-900">{formatIQD(grandTotalPaid)}</td>
                                      <td className="border-[1.5px] border-slate-900 p-2 text-center font-black font-mono text-xs md:text-sm text-red-600 bg-slate-150">{formatIQD(grandTotalRemaining)}</td>
                                      <td className="border-[1.5px] border-slate-900 p-2 text-center bg-slate-150"></td>
                                      <td className="border-[1.5px] border-slate-900 p-2 text-center bg-slate-150"></td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Neat bottom spacer to separate from edges */}
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 border-t border-slate-200 pt-2 shrink-0">
                            <span>نظام إدارة المدارس الرقمية</span>
                            <span className="font-mono">صفحة {realPageNum + 1} من {totalPages}</span>
                            <span>مدارس مرتضى الأهلية</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Floating Transfer Selection Bar */}
      {selectedStudentIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-[2rem] shadow-2xl z-50 flex items-center gap-6 justify-between max-w-2xl w-[90%] md:w-auto"
        >
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
            <span className="font-black text-sm">
              تم تحديد {selectedStudentIds.length} طالبًا
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => {
                const sampleStudent = students.find((s) => s.id === selectedStudentIds[0]);
                setTargetSchool(sampleStudent?.school || schools[0] || "");
                setTargetGrade(sampleStudent?.grade || grades[0] || "");
                setTargetSection(sampleStudent?.section || "أ");
                setConfirmPassword("");
                setBulkTransferModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <TrendingUp size={14} /><span>ترحيل المحددين</span>
            </button>

            <button
              onClick={() => { setPrintSelected(true); setShowPrint(true); }}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Download size={14} /><span>طباعة المحددين</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`هل تريد حذف ${selectedStudentIds.length} طالب؟ لا يمكن التراجع.`)) {
                  selectedStudentIds.forEach(id => onDelete(id));
                  setSelectedStudentIds([]);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Trash2 size={14} /><span>حذف المحددين</span>
            </button>

            <button
              onClick={() => setSelectedStudentIds([])}
              className="bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      )}

      {/* Bulk Transfer Modal (الترحيل بالتحديد) */}
      {bulkTransferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100/80"
          >
            <div className="flex justify-between items-center border-b border-light-200 pb-4 mb-6">
              <h3 className="text-xl font-black text-slate-900">الترحيل بالتحديد</h3>
              <button
                onClick={() => setBulkTransferModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3 w-full">
                <AlertCircle className="text-indigo-600 shrink-0" size={24} />
                <p className="text-indigo-900 font-bold text-xs leading-relaxed">
                  سيتم ترحيل <span className="font-extrabold">{selectedStudentIds.length}</span> طلاب إلى الوجهة المحددة أدناه. يرجى مراجعة الخيارات بدقة وإدخال الرقم السري للتأكيد.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-wider">
                    المدرسة الوجهة
                  </label>
                  <select
                    value={targetSchool}
                    onChange={(e) => setTargetSchool(e.target.value)}
                    className="w-full bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 text-xs"
                  >
                    <option value="">اختر المدرسة</option>
                    {schools.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-wider">
                    المرحلة الوجهة
                  </label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 text-xs"
                  >
                    <option value="">اختر المرحلة</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-wider">
                    الشعبة الوجهة
                  </label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="w-full bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 text-xs"
                  >
                    <option value="">اختر الشعبة</option>
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-500 mr-1 uppercase tracking-wider">
                  رمز تأكيد الحساب
                </label>
                <input
                  type="password"
                  placeholder="أدخل الرقم السري لحسابك لتأكيد الترحيل..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 py-4 px-6 rounded-xl border border-rose-100 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-100 transition-all font-bold text-xs"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (!targetSchool || !targetGrade || !targetSection) {
                      notify("يرجى اختيار المدرسة والمرحلة والشعبة بشكل صحيح.", "warning");
                      return;
                    }

                    if (!confirmPassword) {
                      notify("يرجى إدخال رمز تأكيد الحساب.", "warning");
                      return;
                    }

                    if (confirmPassword !== currentUser?.password) {
                      notify("رمز تأكيد الحساب غير صحيح.", "warning");
                      return;
                    }

                    // Perform bulk transfer using our helper logic
                    const updatedStudents = students.map((s) => {
                      if (selectedStudentIds.includes(s.id)) {
                        return processTransferStudent(
                          s,
                          targetSchool,
                          targetGrade,
                          targetSection,
                          systemSettings
                        );
                      }
                      return s;
                    });

                    onUpdate(updatedStudents);
                    notify(`تم بنجاح ترحيل ${selectedStudentIds.length} طلاب إلى ${targetSchool} - ${targetGrade} - الشعبة ${targetSection}`, "success");
                    setSelectedStudentIds([]);
                    setBulkTransferModalOpen(false);
                    setConfirmPassword("");
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-4 rounded-2xl font-black text-sm shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                >
                  ترحيل
                </button>
                
                <button
                  onClick={() => setBulkTransferModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-sm transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>

    {/* Unpaid Report Print Modal */}
    {showUnpaidReport && (() => {
      const unpaid = filtered.filter(s => {
        const pd = (s.payments||[]).filter((p:any)=>!p.isWithdrawn).reduce((a,p)=>a+p.amount,0);
        return pd < (s.tuition-(s.discount||0));
      });
      return (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-rose-600 p-4 text-white flex justify-between items-center shrink-0">
              <h2 className="font-black">كشف غير المسددين ({unpaid.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => { const el=document.getElementById("ss-unpaid-print"); if(el){const w=window.open("","_blank"); if(w){w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><style>*{font-family:Cairo,sans-serif}body{padding:20px}@page{size:A4;margin:10mm}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;font-size:11px}th{background:#f0f0f0;font-weight:900}</style></head><body>'+el.innerHTML+'</body></html>'); w.document.close(); setTimeout(()=>{w.print();w.close()},500);}}}}
                  className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-bold">طباعة</button>
                <button onClick={() => setShowUnpaidReport(false)} className="p-1.5 bg-white/10 rounded-lg">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div id="ss-unpaid-print" style={{ fontFamily: "Cairo", direction: "rtl", color: "#000" }}>
                <h2 style={{ textAlign: "center", fontSize: "16px", fontWeight: 900 }}>كشف الطلاب غير المسددين</h2>
                <table style={{ marginTop: "12px" }}>
                  <thead><tr><th>ت</th><th>الاسم</th><th>المرحلة</th><th>الهاتف</th><th>القسط</th><th>المدفوع</th><th>المتبقي</th></tr></thead>
                  <tbody>
                    {unpaid.map((s,i) => {
                      const pd=(s.payments||[]).filter((p:any)=>!p.isWithdrawn).reduce((a,p)=>a+p.amount,0);
                      const rm=Math.max(0,s.tuition-(s.discount||0)-pd);
                      return <tr key={s.id}><td style={{textAlign:"center"}}>{i+1}</td><td style={{fontWeight:700}}>{s.name}</td><td style={{textAlign:"center"}}>{s.grade}</td><td style={{textAlign:"center",direction:"ltr"}}>{(s as any).guardianPhone||s.phone||"-"}</td><td style={{textAlign:"center"}}>{formatIQD(s.tuition-(s.discount||0))}</td><td style={{textAlign:"center"}}>{formatIQD(pd)}</td><td style={{textAlign:"center",fontWeight:700,color:"#dc2626"}}>{formatIQD(rm)}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    })()}

    </>
  );
};


const VIEW_TO_PATH: Record<string, string> = {
  dashboard: "/",
  "student-invoices": "/students",
  "search-students": "/search",
  "add-student": "/add-student",
  "expense-invoices": "/expenses",
  "add-expense": "/add-expense",
  "add-additional-revenue": "/add-revenue",
  vault: "/vault",
  employees: "/employees",
  settings: "/setting",
  "manage-users": "/users",
  "grade-management": "/grades",
  "attendance-management": "/attendance",
  "payment-inventory": "/payments",
  "additional-revenue-list": "/revenue",
  "previous-debts": "/debts",
  investors: "/investors",
  taxes: "/taxes",
  profile: "/profile",
};

const PATH_TO_VIEW: Record<string, string> = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([v, p]) => [p, v])
);

// --- App Sidebar Component ---

export default StudentSearch;

/**
 * PaymentInventory.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, Receipt, TrendingUp, ArrowRight, ClipboardList, Check, Printer } from "lucide-react";
import type { Student } from "@/types";

const PaymentInventory = ({
  onBack,
  students,
  schools,
  grades,
}: {
  onBack: () => void;
  students: Student[];
  schools: string[];
  grades: string[];
}) => {
  const [selectedGrade, setSelectedGrade] = useState("جميع المراحل");
  const [selectedSchool, setSelectedSchool] = useState("جميع المدارس");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = students.filter((s) => {
    const matchesGrade =
      selectedGrade === "جميع المراحل" || s.grade === selectedGrade;
    const matchesSchool =
      selectedSchool === "جميع المدارس" || s.school === selectedSchool;
    const matchesSearch = s.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSchool && matchesSearch;
  });

  const getStudentMetrics = (student: Student) => {
    const totalPaid = student.payments.filter((p: any) => !p.isWithdrawn).reduce((sum, p) => sum + p.amount, 0);
    const remaining = student.tuition - totalPaid - student.discount;
    return { totalPaid, remaining };
  };

  const totals = filtered.reduce(
    (acc, student) => {
      const { totalPaid, remaining } = getStudentMetrics(student);
      return {
        paid: acc.paid + totalPaid,
        remaining: acc.remaining + remaining,
        discount: acc.discount + (student.discount || 0),
      };
    },
    { paid: 0, remaining: 0, discount: 0 },
  );

  const totalTuitionPossible = filtered.reduce((sum, s) => sum + s.tuition, 0);
  const percentageCollected =
    totalTuitionPossible > 0
      ? (
          (totals.paid / (totalTuitionPossible - totals.discount)) *
          100
        ).toFixed(1) + "%"
      : "0%";

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #ecfeff, #f0fdfa)" }}
      dir="rtl"
    >
      {/* ── Modern light header ─────────────────────────────── */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between print:hidden">
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30"
            >
              <ClipboardList size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">جرد دفعات الطلاب</h1>
              <p className="text-[10px] font-bold text-slate-400">{filtered.length} طالب • نسبة التحصيل: {percentageCollected}</p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-white text-xs font-black shadow-lg shadow-cyan-500/30 transition-all"
          style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" }}
        >
          <Printer size={14} strokeWidth={3} />
          <span className="hidden sm:inline">طباعة الجرد</span>
        </motion.button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 scrollbar-hide print:overflow-visible print:p-0">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── Quick stats row ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden"
          >
            {[
              { label: "إجمالي المدفوع", value: formatIQD(totals.paid), icon: <Check size={18}/>, from: "from-emerald-500", to: "to-teal-600", shadow: "shadow-emerald-500/25" },
              { label: "إجمالي المتبقي", value: formatIQD(totals.remaining), icon: <ClipboardList size={18}/>, from: "from-amber-500", to: "to-orange-600", shadow: "shadow-amber-500/25" },
              { label: "إجمالي الخصومات", value: formatIQD(totals.discount), icon: <Receipt size={18}/>, from: "from-rose-500", to: "to-red-600", shadow: "shadow-rose-500/25" },
              { label: "نسبة التحصيل", value: percentageCollected, icon: <TrendingUp size={18}/>, from: "from-cyan-500", to: "to-blue-600", shadow: "shadow-cyan-500/25" },
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

          {/* ── Filters ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 print:hidden"
          >
            <div className="relative">
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="بحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 py-3 pr-12 pl-4 rounded-xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:bg-white border border-transparent focus:border-cyan-200 transition-all"
              />
            </div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-200 transition-all"
            >
              <option>جميع المراحل</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </motion.div>

          {/* ── Table ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            id="payment-inventory-table"
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto"
          >
            <table className="w-full text-right">
              {/* ... table content remains same ... */}
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 font-black text-xs border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4">No.</th>
                  <th className="px-6 py-4">اسم الطالب</th>
                  <th className="px-6 py-4">المرحلة</th>
                  <th className="px-6 py-4">تاريخ الدفعة</th>
                  <th className="px-6 py-4">المبلغ</th>
                  <th className="px-6 py-4">السنة الدراسية</th>
                  <th className="px-6 py-4">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-sm">
                {(() => {
                  const allPaymentsView = filtered
                    .flatMap((student) =>
                      student.payments.map((payment) => ({
                        ...payment,
                        studentName: student.name,
                        studentGrade: student.grade,
                        studentId: student.id,
                      })),
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    );

                  if (allPaymentsView.length === 0) {
                    return (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-20 text-center text-slate-400 font-bold py-10"
                        >
                          لا توجد دفعات مسجلة للطلاب المختارين
                        </td>
                      </tr>
                    );
                  }

                  return allPaymentsView.map((payment, idx) => (
                    <tr
                      key={`${payment.studentId}-${payment.id}`}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 text-slate-800">
                        {payment.studentName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {payment.studentGrade}
                      </td>
                      <td className="px-6 py-4 text-blue-600 tabular-nums">
                        {payment.date}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 tabular-nums font-black">
                        {formatIQD(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {payment.schoolYear}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[200px]">
                        {payment.notes || "-"}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </motion.div>

          {/* Summaries — shown only on print since stats row covers screen */}
          <div className="hidden print:block space-y-6 print:mt-6 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-2xl text-center space-y-2">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  إجمالي المبالغ المدفوعة
                </span>
                <p className="text-3xl font-black text-emerald-700 tabular-nums">
                  {formatIQD(totals.paid)} د.ع
                </p>
              </div>
              <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-2xl text-center space-y-2">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                  إجمالي المبالغ المتبقية
                </span>
                <p className="text-3xl font-black text-rose-700 tabular-nums">
                  {formatIQD(totals.remaining)} د.ع
                </p>
              </div>
              <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-2xl text-center space-y-2">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                  إجمالي الخصومات
                </span>
                <p className="text-3xl font-black text-amber-700 tabular-nums">
                  {formatIQD(totals.discount)} د.ع
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl text-center space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  عدد الطلاب
                </span>
                <p className="text-3xl font-black text-slate-800 tabular-nums">
                  {filtered.length}
                </p>
              </div>
              <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl text-center space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  نسبة التحصيل
                </span>
                <p className="text-3xl font-black text-cyan-600 tabular-nums">
                  {percentageCollected}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PaymentInventory;

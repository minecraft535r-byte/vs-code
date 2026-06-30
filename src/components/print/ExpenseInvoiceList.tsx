/**
 * ExpenseInvoiceList.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Wallet, Receipt, FileText, ArrowRight, Eye, Download, Check, Clock, Plus, Trash2, Edit2 } from "lucide-react";
import type { Expense } from "@/types";
import { printDocument, saveElementAsImage, getStoredReceiptSize } from "@/utils/print";
import { verifyDeletePassword } from "@/utils/security";
import { notify } from "@/utils/notify";
import { formatWithCommas } from "@/utils/format";
import ExpenseReceiptPrint from "@/components/print/ExpenseReceiptPrint";
import PrintReport from "@/components/print/PrintReport";

const ExpenseInvoiceList = ({
  onBack,
  expenses,
  onPayExpense,
  schools,
  expenseTypes,
  onNavigate,
  onDeleteExpense,
  onEditExpense,
}: {
  onBack: () => void;
  expenses: Expense[];
  onPayExpense: (expenseId: string) => void;
  schools: string[];
  expenseTypes: string[];
  onNavigate?: (view: string) => void;
  onDeleteExpense?: (id: string) => void;
  onEditExpense?: (expense: Expense) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("جميع المدارس");
  const [selectedType, setSelectedType] = useState("جميع الأنواع");
  const [receipt, setReceipt] = useState<Expense | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const saveAsImage = async () => {
    await saveElementAsImage("expense-receipt-to-print", `مستند_صرف_${receipt?.title}_${receipt?.id}`);
  };

  const filtered = expenses.filter((e) => {
    const expDate = e.paymentDate || e.date || "";
    const matchesDateFrom = !dateFrom || expDate >= dateFrom;
    const matchesDateTo = !dateTo || expDate <= dateTo;
    const matchesSearch =
      (e.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.receiver || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool =
      selectedSchool === "جميع المدارس" || e.school === selectedSchool;
    const matchesType =
      selectedType === "جميع الأنواع" || e.type === selectedType;
    return matchesSearch && matchesSchool && matchesType && matchesDateFrom && matchesDateTo;
  });

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  return (
    <>
      {/* Print Report */}
      {showPrint && (
        <PrintReport
          title="كشف فواتير المصروفات"
          filterInfo={[selectedType !== "جميع الأنواع" ? selectedType : "", selectedSchool !== "جميع المدارس" ? selectedSchool : ""].filter(Boolean).join(" — ")}
          columns={[
            { label:"العنوان", key:"title", width:"22%", align:"right" },
            { label:"المستلم", key:"receiver", width:"15%", align:"right" },
            { label:"النوع", key:"type", width:"10%", align:"center" },
            { label:"المدرسة", key:"school", width:"15%", align:"center" },
            { label:"المبلغ (د.ع)", key:"amount", width:"13%", align:"center" },
            { label:"الحالة", key:"statusAr", width:"10%", align:"center" },
            { label:"التاريخ", key:"date", width:"12%", align:"center" },
          ]}
          rows={filtered.map(e=>({
            title:e.title, receiver:e.receiver, type:e.type, school:e.school,
            amount:new Intl.NumberFormat("en-US").format(e.amount),
            statusAr:e.status==="paid"?"مسدَّد":"معلّق",
            date:e.paymentDate||e.date,
            __colors:{ amount:"#16a34a", statusAr:e.status==="paid"?"#16a34a":"#dc2626" }
          }))}
          totals={{ amount: new Intl.NumberFormat("en-US").format(filtered.filter(e=>e.status==="paid").reduce((a,e)=>a+e.amount,0)) + " (مسدَّد)" }}
          onClose={()=>setShowPrint(false)}
        />
      )}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(circle at top right, #fef2f2, #fff7ed)" }}>
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30"
            >
              <Receipt size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">فواتير المصروفات</h1>
              <p className="text-[10px] font-bold text-slate-400">{filtered.length} مصروف من إجمالي {expenses.length}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && onDeleteExpense && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                const ok = await verifyDeletePassword();
                if (!ok) return;
                selectedIds.forEach(id => onDeleteExpense(id));
                notify(`تم حذف ${selectedIds.size} مصروف بنجاح`, "success");
                setSelectedIds(new Set());
              }}
              className="flex items-center gap-2 bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/25 transition-all">
              <Trash2 size={14} />
              <span>حذف المحدد ({selectedIds.size})</span>
            </motion.button>
          )}
          {onNavigate && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("add-expense")}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-xl transition-all">
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden md:inline">إضافة مصروف</span>
            </motion.button>
          )}
          <motion.button whileTap={{scale:0.95}}
            onClick={()=>setShowPrint(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-black transition-all">
            <Download size={14}/><span className="hidden sm:inline">طباعة القائمة</span>
          </motion.button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 scrollbar-hide" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── Quick stats row ───────────────────────────────── */}
          {(() => {
            const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
            const paidAmount = filtered.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0);
            const pendingCount = filtered.filter(e => e.status !== "paid").length;
            const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);
            return (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                {[
                  { label: "إجمالي المصروفات", value: filtered.length.toString(), icon: <Receipt size={18}/>, from: "from-rose-500", to: "to-red-600", shadow: "shadow-rose-500/25" },
                  { label: "القيمة الإجمالية", value: fmtNum(totalAmount), icon: <Wallet size={18}/>, from: "from-amber-500", to: "to-orange-600", shadow: "shadow-amber-500/25" },
                  { label: "المدفوع", value: fmtNum(paidAmount), icon: <Check size={18}/>, from: "from-emerald-500", to: "to-teal-600", shadow: "shadow-emerald-500/25" },
                  { label: "بانتظار الصرف", value: pendingCount.toString() + " مصروف", icon: <Clock size={18}/>, from: "from-violet-500", to: "to-purple-600", shadow: "shadow-violet-500/25" },
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
                placeholder="ابحث في المصروفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 py-3 pr-12 pl-4 rounded-xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:bg-white border border-transparent focus:border-rose-200 transition-all"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-200 transition-all min-w-[160px]"
            >
              <option>جميع الأنواع</option>
              {expenseTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </motion.div>

          {/* ── Smart Date Filter + Quick Filters ─────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3"
          >
            {/* Quick Filters Row */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-black text-slate-400 flex items-center ml-2">⚡ فلتر سريع:</span>
              {[
                { label: "اليوم", fn: () => { const t = new Date().toISOString().split("T")[0]; setDateFrom(t); setDateTo(t); } },
                { label: "هذا الأسبوع", fn: () => { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - now.getDay()); setDateFrom(start.toISOString().split("T")[0]); setDateTo(now.toISOString().split("T")[0]); } },
                { label: "هذا الشهر", fn: () => { const now = new Date(); setDateFrom(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`); setDateTo(now.toISOString().split("T")[0]); } },
                { label: "هذه السنة", fn: () => { const y = new Date().getFullYear(); setDateFrom(`${y}-01-01`); setDateTo(new Date().toISOString().split("T")[0]); } },
              ].map(q => (
                <button key={q.label} onClick={q.fn}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition-all active:scale-95">
                  {q.label}
                </button>
              ))}
            </div>

            {/* Date Pickers Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 px-3 py-2 focus-within:ring-2 focus-within:ring-rose-100 focus-within:border-rose-200 transition-all">
                <span className="text-xs font-black text-slate-500 whitespace-nowrap">من:</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none min-w-[120px]" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 px-3 py-2 focus-within:ring-2 focus-within:ring-rose-100 focus-within:border-rose-200 transition-all">
                <span className="text-xs font-black text-slate-500 whitespace-nowrap">إلى:</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none min-w-[120px]" />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-3 py-2 rounded-xl transition-colors active:scale-95 shadow-sm">
                  ✕ مسح الفلاتر
                </button>
              )}
              {(dateFrom || dateTo) && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 mr-auto">
                  📊 {filtered.length} نتيجة
                </span>
              )}
            </div>

            {/* No results message */}
            {(dateFrom || dateTo) && filtered.length === 0 && (
              <div className="text-center py-3 text-sm font-bold text-slate-400 bg-slate-50 rounded-xl">
                لا توجد مصروفات في هذه الفترة
              </div>
            )}
          </motion.div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border-b-2 border-slate-200">
                <tr>
                  <th className="py-4 px-3 text-center font-black text-xs w-10">
                    <input type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set(filtered.map(x => x.id)));
                        else setSelectedIds(new Set());
                      }}
                      className="w-4 h-4 rounded accent-rose-500"
                    />
                  </th>
                  <th className="py-4 px-6 text-right font-black text-xs">البيان</th>
                  <th className="py-4 px-3 text-center font-black text-xs">المستلم</th>
                  <th className="py-4 px-3 text-center font-black text-xs">القيمة</th>
                  <th className="py-4 px-3 text-center font-black text-xs">التاريخ</th>
                  <th className="py-4 px-3 text-center font-black text-xs">الحالة</th>
                  <th className="py-4 px-6 text-left font-black text-xs">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => {
                  const isPaid = e.status === "paid";

                  return (
                    <motion.tr
                      layout
                      key={e.id}
                      className={`hover:bg-rose-50/30 transition-colors group ${selectedIds.has(e.id) ? "bg-rose-50/50" : ""}`}
                    >
                      <td className="py-4 px-3 text-center">
                        <input type="checkbox"
                          checked={selectedIds.has(e.id)}
                          onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(e.id)) next.delete(e.id);
                            else next.add(e.id);
                            setSelectedIds(next);
                          }}
                          className="w-4 h-4 rounded accent-rose-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">
                          {e.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1 group-hover:text-rose-400 transition-colors uppercase tracking-widest">
                          {e.school} | {e.type}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-slate-600">
                          {e.receiver || "---"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-700 tabular-nums">
                        {formatIQD(e.amount)}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-500 tabular-nums">
                        {e.date}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isPaid ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                        >
                          {isPaid ? "تم الصرف" : "انتظار"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            onClick={() => setReceipt(e)}
                            className="px-3 py-2 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-900 text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Eye size={14} />
                            <span className="hidden sm:inline">عرض</span>
                          </button>
                          {onEditExpense && (
                            <button
                              onClick={() => {
                                setEditingExpense(e);
                                setEditAmount(String(e.amount));
                                setEditNotes(e.notes || "");
                              }}
                              className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 active:scale-95 transition-all"
                              title="تعديل المصروف"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {onDeleteExpense && (
                            <button
                              onClick={async () => {
                                const ok = await verifyDeletePassword();
                                if (!ok) return;
                                onDeleteExpense(e.id);
                                notify("تم حذف المصروف بنجاح", "success");
                              }}
                              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all"
                              title="حذف المصروف"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {filtered.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <FileText size={64} className="mx-auto text-slate-200" />
                <p className="text-slate-400 font-bold">
                  لا يوجد مصروفات مطابقة للبحث
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex flex-col items-center overflow-y-auto"
          >
            <div className="sticky top-0 w-full bg-slate-900/90 border-b border-white/10 p-6 z-[110] no-print">
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
                <ExpenseReceiptPrint expense={receipt} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Expense Modal ── */}
      <AnimatePresence>
        {editingExpense && onEditExpense && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-amber-500 p-5 text-white">
                <h3 className="text-lg font-black">تعديل المصروف</h3>
                <p className="text-amber-100 text-xs font-bold">{editingExpense.title}</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 block mb-1.5">المبلغ (د.ع)</label>
                  <input type="text" inputMode="decimal"
                    value={formatWithCommas(editAmount)}
                    onChange={e => { const r = e.target.value.replace(/,/g, ""); if (!r || /^\d*\.?\d*$/.test(r)) setEditAmount(r); }}
                    className="w-full py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 font-bold font-mono text-left focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 block mb-1.5">الملاحظات</label>
                  <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
              </div>
              <div className="p-5 pt-0 flex gap-3">
                <button onClick={() => setEditingExpense(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">إلغاء</button>
                <button onClick={() => {
                  onEditExpense({ ...editingExpense, amount: parseFloat(editAmount) || editingExpense.amount, notes: editNotes });
                  setEditingExpense(null);
                  notify("تم تعديل المصروف بنجاح", "success");
                }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20">حفظ التعديل</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════
// UNIVERSAL PRINT REPORT — A4 plain table, multiple pages
// ══════════════════════════════════════════════════════════════
interface PrintCol { label: string; key: string; width?: string; align?: "right"|"center"|"left"; }
interface PrintTotals { [key: string]: string | number; }

export default ExpenseInvoiceList;

/**
 * AdditionalRevenueList.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, DollarSign, Wallet, Receipt, TrendingUp, ArrowRight, Download, Check, Clock } from "lucide-react";
import type { AdditionalRevenue } from "@/types";
import { printDocument, saveElementAsImage, getStoredReceiptSize } from "@/utils/print";
import AdditionalRevenueReceiptPrint from "@/components/print/AdditionalRevenueReceiptPrint";

const AdditionalRevenueList = ({
  onBack,
  revenues,
  onReceiveRevenue,
  schools,
}: {
  onBack: () => void;
  revenues: AdditionalRevenue[];
  onReceiveRevenue: (id: string) => void;
  schools: string[];
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("جميع المدارس");
  const [receipt, setReceipt] = useState<AdditionalRevenue | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const saveAsImage = async () => {
    await saveElementAsImage("additional-revenue-receipt-to-print", `مستند_قبض_${receipt?.title}_${receipt?.id}`);
  };

  const filtered = revenues.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.payer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool =
      selectedSchool === "جميع المدارس" || r.school === selectedSchool;
    return matchesSearch && matchesSchool;
  });

  const handleReceive = (rev: AdditionalRevenue) => {
    onReceiveRevenue(rev.id);
    setReceipt({
      ...rev,
      status: "received",
      receivedDate: new Date().toISOString().split("T")[0],
    });
  };

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #f0fdfa, #ecfdf5)" }}
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30"
            >
              <DollarSign size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">جرد الواردات الإضافية</h1>
              <p className="text-[10px] font-bold text-slate-400">{filtered.length} وارد من إجمالي {revenues.length}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 scrollbar-hide" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── Quick stats row ───────────────────────────────── */}
          {(() => {
            const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);
            const receivedAmount = filtered.filter(r => r.status === "received").reduce((s, r) => s + r.amount, 0);
            const pendingCount = filtered.filter(r => r.status !== "received").length;
            return (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                {[
                  { label: "إجمالي الواردات", value: filtered.length.toString(), icon: <DollarSign size={18}/>, from: "from-emerald-500", to: "to-teal-600", shadow: "shadow-emerald-500/25" },
                  { label: "القيمة الإجمالية", value: formatIQD(totalAmount), icon: <Wallet size={18}/>, from: "from-blue-500", to: "to-indigo-600", shadow: "shadow-blue-500/25" },
                  { label: "المُسلَّم", value: formatIQD(receivedAmount), icon: <Check size={18}/>, from: "from-cyan-500", to: "to-teal-600", shadow: "shadow-cyan-500/25" },
                  { label: "بانتظار التسلُّم", value: pendingCount.toString() + " وارد", icon: <Clock size={18}/>, from: "from-amber-500", to: "to-orange-600", shadow: "shadow-amber-500/25" },
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

          {/* ── Search bar ──────────────────────────────────── */}
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
                placeholder="ابحث في الواردات بالعنوان أو المسدد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 py-3 pr-12 pl-4 rounded-xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:bg-white border border-transparent focus:border-emerald-200 transition-all"
              />
            </div>
          </motion.div>

          {/* ── Table ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border-b-2 border-slate-200">
                <tr>
                  <th className="py-4 px-6 text-right font-black text-xs">
                    نوع الوارد
                  </th>
                  <th className="py-4 px-3 text-center font-black text-xs">القيمة</th>
                  <th className="py-4 px-3 text-center font-black text-xs">بتاريخ</th>
                  <th className="py-4 px-3 text-center font-black text-xs">الحالة</th>
                  <th className="py-4 px-6 text-left font-black text-xs">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const isReceived = r.status === "received";

                  return (
                    <motion.tr
                      layout
                      key={r.id}
                      className="hover:bg-emerald-50/30 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="font-black text-slate-800 text-sm">
                          {r.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1 group-hover:text-emerald-500 transition-colors">
                          {r.school} • المسدد: {r.payer}
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center font-black text-emerald-600 text-sm tabular-nums">
                        {formatIQD(r.amount)}
                      </td>
                      <td className="py-4 px-3 text-center font-bold text-slate-500 text-xs tabular-nums">
                        {r.date}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black ${isReceived ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}
                        >
                          {isReceived ? "✓ تم الاستلام" : "⏳ بانتظار القبض"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-left">
                        {isReceived ? (
                          <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setReceipt(r)}
                            className="px-4 py-2 rounded-xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-all"
                          >
                            <Receipt size={13} />
                            <span>عرض المستند</span>
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                            onClick={() => handleReceive(r)}
                            className="px-4 py-2 rounded-xl font-black text-xs text-white shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition-all"
                            style={{ background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)" }}
                          >
                            <TrendingUp size={13} />
                            <span>تأكيد الاستلام</span>
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {filtered.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <TrendingUp size={64} className="mx-auto text-slate-100" />
                <p className="text-slate-400 font-bold">
                  لا توجد سجلات مطابقة للبحث
                </p>
              </div>
            )}
          </motion.div>
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
                  onClick={() => printDocument("additional-revenue-receipt-to-print", getStoredReceiptSize())}
                  className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-white"
                >
                  <Receipt size={20} className="text-emerald-600" />
                  <span>طباعة المستند</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveAsImage}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-emerald-500 shadow-emerald-600/40"
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
                <AdditionalRevenueReceiptPrint revenue={receipt} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AdditionalRevenueList;

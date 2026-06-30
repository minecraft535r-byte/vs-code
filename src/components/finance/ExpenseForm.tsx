/**
 * ExpenseForm.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Receipt, ArrowRight, Download } from "lucide-react";
import type { Expense } from "@/types";
import { notify } from "@/utils/notify";
import { printDocument, saveElementAsImage, getStoredReceiptSize } from "@/utils/print";
import FormInput from "@/components/ui/FormInput";
import ManagedSelect from "@/components/ui/ManagedSelect";
import ExpenseReceiptPrint from "@/components/print/ExpenseReceiptPrint";

const ExpenseForm = ({
  onBack,
  onSave,
  schools,
  expenseTypes,
  sources,
  onUpdateList,
  isSchoolLocked = false,
  defaultSchool,
}: {
  onBack: () => void;
  onSave: (e: Expense) => Expense | void;
  schools: string[];
  expenseTypes: string[];
  sources: string[];
  onUpdateList: (k: string, l: string[]) => void;
  isSchoolLocked?: boolean;
  defaultSchool?: string;
}) => {
  const [formData, setFormData] = useState({
    title: "",
    school: defaultSchool || schools[0] || "",
    type: expenseTypes[0] || "",
    source: sources[0] || "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    receiver: "",
    notes: "",
  });

  const [createdReceipt, setCreatedReceipt] = useState<Expense | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const saveAsImage = async () => {
    await saveElementAsImage("expense-receipt-to-print", `مستند_صرف_${createdReceipt?.title}_${createdReceipt?.id}`);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.title.trim()) {
      notify("يرجى إدخال البيان", "warning");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      notify("يرجى إدخال مبلغ صحيح", "warning");
      return;
    }

    const newExpense: Expense = {
      ...formData,
      id: Date.now().toString(),
      amount: parseFloat(formData.amount) || 0,
      status: "pending",
    };

    const saved = onSave(newExpense);
    if (saved) {
      setCreatedReceipt(saved);
    } else {
      onBack();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #fef2f2, #fff7ed)" }}
      dir="rtl"
    >
      {/* ── Modern light header with gradient icon ────────────────── */}
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30"
            >
              <Receipt size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">إضافة مصروف جديد</h1>
              <p className="text-[10px] font-bold text-slate-400">أدخل بيانات المصروف لإضافته للسجل المالي</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-black">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>نموذج جديد</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
        <div className="max-w-4xl mx-auto pb-32">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 pr-1"
            >
              <div className="w-1.5 h-5 bg-rose-500 rounded-full" />
              <h2 className="text-sm font-black text-slate-700">بيانات المصروف</h2>
              <span className="text-[10px] font-bold text-slate-400">— جميع الحقول مطلوبة ما لم تذكر</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <FormInput
                label="البيان :"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="البيان مثل (اشتراك الانترنت , شراء سجلات , الخ....)"
                full
                required
              />
              <ManagedSelect
                label="المدرسة :"
                name="school"
                value={formData.school}
                onChange={handleInputChange}
                options={schools}
                listKey="schools"
                onUpdateList={onUpdateList}
                disableAdd={isSchoolLocked}
              />
              <ManagedSelect
                label="نوع المصروف :"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                options={expenseTypes}
                listKey="expenseTypes"
                onUpdateList={onUpdateList}
              />
              <ManagedSelect
                label="صادرة من :"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                options={sources}
                listKey="sources"
                onUpdateList={onUpdateList}
              />
              <FormInput
                label="بتاريخ :"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                type="date"
                required
              />
              <FormInput
                label="قيمة المبلغ :"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="المبلغ بالدينار العراقي"
                type="number"
                required
              />
              <FormInput
                label="مستلم المبلغ :"
                name="receiver"
                value={formData.receiver}
                onChange={handleInputChange}
                placeholder="اسم مستلم المبلغ"
                full
              />

              <div className="col-span-2 space-y-2">
                <label className="text-xs font-black text-slate-500 mr-2">
                  الملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="اكتب ملاحظاتك هنا"
                  className="w-full h-32 bg-slate-50/50 py-4 px-6 rounded-3xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:bg-white transition-all border border-rose-50/50 focus:border-rose-300 font-bold resize-none"
                />
              </div>
            </motion.div>
          </form>
        </div>
      </div>

      <footer className="p-5 md:p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 shrink-0 z-20">
        <div className="max-w-4xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            onClick={handleSubmit}
            className="w-full text-white font-black py-4 rounded-2xl shadow-2xl shadow-rose-500/30 flex items-center justify-center gap-3 transition-all relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #f43f5e 0%, #ef4444 50%, #dc2626 100%)" }}
          >
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="inline-flex"
            >
              <Receipt size={18} strokeWidth={3} />
            </motion.span>
            <span>حفظ بيانات المصروف</span>
          </motion.button>
        </div>
      </footer>

      {/* Receipt Modal */}
      <AnimatePresence>
        {createdReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex flex-col items-center overflow-y-auto"
            dir="rtl"
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
                  onClick={onBack}
                  className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-slate-700"
                >
                  <ArrowRight size={20} />
                  <span>رجوع للرئيسية</span>
                </motion.button>
              </div>
            </div>

            <div className="w-full max-w-[210mm] py-12 px-4">
              <div
                className="print-area w-full bg-white shadow-2xl rounded-3xl"
                ref={receiptRef}
              >
                <ExpenseReceiptPrint expense={createdReceipt} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ExpenseForm;

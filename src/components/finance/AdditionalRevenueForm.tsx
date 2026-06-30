/**
 * AdditionalRevenueForm.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { DollarSign, ArrowRight } from "lucide-react";
import type { AdditionalRevenue } from "@/types";
import { notify } from "@/utils/notify";
import FormInput from "@/components/ui/FormInput";
import ManagedSelect from "@/components/ui/ManagedSelect";

const AdditionalRevenueForm = ({
  onBack,
  onSave,
  schools,
  onUpdateList,
  isSchoolLocked = false,
}: {
  onBack: () => void;
  onSave: (r: AdditionalRevenue) => void;
  schools: string[];
  onUpdateList: (k: string, l: string[]) => void;
  isSchoolLocked?: boolean;
}) => {
  const [formData, setFormData] = useState({
    title: "",
    school: schools[0] || "",
    payer: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.title.trim()) {
      notify("يرجى إدخال مسمى الوارد", "warning");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      notify("يرجى إدخال مبلغ صحيح", "warning");
      return;
    }

    const newRevenue: AdditionalRevenue = {
      ...formData,
      id: Date.now().toString(),
      amount: parseFloat(formData.amount) || 0,
      status: "pending",
    };

    onSave(newRevenue);
    onBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #f0fdfa, #ecfdf5)" }}
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30"
            >
              <DollarSign size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">إضافة وارد جديد</h1>
              <p className="text-[10px] font-bold text-slate-400">سجّل إيراداً إضافياً للمدرسة</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-black">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
              <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
              <h2 className="text-sm font-black text-slate-700">بيانات الوارد</h2>
              <span className="text-[10px] font-bold text-slate-400">— جميع الحقول مطلوبة ما لم تذكر</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <FormInput
                label="الوارد :"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="الوارد مثل (دورة صيفية، دخل حانوت ، الخ ....)"
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
              <FormInput
                label="مسلم المبلغ :"
                name="payer"
                value={formData.payer}
                onChange={handleInputChange}
                placeholder="اسم الطالب او الشخص الذي دفع المبلغ"
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
                  className="w-full h-32 bg-slate-50/50 py-4 px-6 rounded-3xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:bg-white transition-all border border-emerald-50/50 focus:border-emerald-300 font-bold resize-none"
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
            className="w-full text-white font-black py-4 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition-all relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0d9488 100%)" }}
          >
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="inline-flex"
            >
              <DollarSign size={18} strokeWidth={3} />
            </motion.span>
            <span>حفظ بيانات الوارد</span>
          </motion.button>
        </div>
      </footer>
    </motion.div>
  );
}

export default AdditionalRevenueForm;

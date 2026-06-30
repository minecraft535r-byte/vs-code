/**
 * StudentForm.tsx
 * Extracted and refactored from App.tsx monolith
 * Mobile-responsive layout improvements applied
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UserPlus, ArrowRight } from "lucide-react";
import type { Student, SystemSettings } from "@/types";
import { formatWithCommas } from "@/utils/format";
import { sanitizeInput, validateIraqiPhone, validatePositiveNumber } from "@/utils/security";
import { notify } from "@/utils/notify";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import ManagedSelect from "@/components/ui/ManagedSelect";

const StudentForm = ({
  onBack,
  onSave,
  schools,
  grades,
  onUpdateList,
  isSchoolLocked = false,
  defaultSchool,
  systemSettings,
}: {
  onBack: () => void;
  onSave: (s: Student) => void;
  schools: string[];
  grades: string[];
  onUpdateList: (k: string, l: string[]) => void;
  isSchoolLocked?: boolean;
  defaultSchool?: string;
  systemSettings?: SystemSettings;
}) => {
  const initialSchool = defaultSchool || schools[0] || "";
  const [formData, setFormData] = useState({
    name: "",
    school: initialSchool,
    grade: grades[0] || "",
    section: systemSettings?.sections?.[0] || "أ",
    tuition: "",
    guardianPhone: "",
    motherPhone: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [discountType, setDiscountType] = useState<"iqd" | "percent">("iqd");
  const [discountInput, setDiscountInput] = useState("0");

  // Autofill tuition for selected grade from systemSettings rules
  useEffect(() => {
    if (formData.grade && systemSettings?.gradePrices?.[formData.grade]) {
      setFormData((prev) => ({
        ...prev,
        tuition: String(systemSettings.gradePrices?.[formData.grade] || ""),
      }));
    }
  }, [formData.grade, systemSettings?.gradePrices]);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Name Validation (Must be at least 4 words)
    const nameWords = formData.name.trim().split(/\s+/);
    if (nameWords.length < 4) {
      notify("يرجى إدخال الاسم الرباعي الكامل (4 كلمات على الأقل)", "warning");
      return;
    }

    // 2. Guardian Phone Validation (Required, 11 digits, starts with 07)
    const phoneRegex = /^07[0-9]{9}$/;
    if (!phoneRegex.test(formData.guardianPhone)) {
      notify("يرجى إدخال رقم هاتف ولي أمر صحيح مكون من 11 رقماً ويبدأ بـ 07", "warning");
      return;
    }

    // 3. Mother's Phone Validation (Optional, but if entered must be 11 digits)
    if (formData.motherPhone && !phoneRegex.test(formData.motherPhone)) {
      notify(
        "يرجى إدخال رقم هاتف أم صحيح مكون من 11 رقماً ويبدأ بـ 07 أو اتركه فارغاً"
  , "warning");
      return;
    }

    const finalDiscount = discountType === "percent"
      ? ((parseFloat(formData.tuition) || 0) * (parseFloat(discountInput) || 0)) / 100
      : (parseFloat(discountInput) || 0);

    const newStudent: Student = {
      ...formData,
      id: Date.now().toString(),
      tuition: parseFloat(formData.tuition) || 0,
      discount: finalDiscount,
      payments: [],
    };

    onSave(newStudent);
    onBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #f8fafc, #eff6ff)" }}
      dir="rtl"
    >
      {/* ── Header ──────────────────────────────── */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-3 sm:px-4 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <motion.button
            whileHover={{ x: 4 }} whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowRight size={16} />
          </motion.button>
          <div className="flex items-center gap-2 min-w-0">
            <motion.div
              initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30"
            >
              <UserPlus size={16} />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-800 leading-tight truncate">إضافة طالب جديد</h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 truncate">أدخل بيانات الطالب لتسجيله في النظام</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-black shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>نموذج جديد</span>
        </div>
      </header>

      {/* ── Form Content ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-8 py-4 md:py-8 scrollbar-hide">
        <div className="max-w-4xl mx-auto pb-28 sm:pb-32">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 pr-1"
            >
              <div className="w-1.5 h-5 bg-blue-500 rounded-full shrink-0" />
              <h2 className="text-xs sm:text-sm font-black text-slate-700">بيانات الطالب</h2>
              <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">— جميع الحقول مطلوبة ما لم تذكر</span>
            </motion.div>

            {/* ── Main form card ──────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-5 bg-white p-4 sm:p-5 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100"
            >
              {/* Full name - full width */}
              <div className="col-span-1 md:col-span-2">
                <FormInput
                  label="الاسم الرباعي"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="مثال: محمد احمد علي حسن"
                  full
                  required
                />
              </div>

              {/* Grade + Section side by side (always 2 cols) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <ManagedSelect
                  label="المرحلة"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  options={grades}
                  listKey="grades"
                  onUpdateList={onUpdateList}
                  disableAdd={true}
                />
                <FormSelect
                  label="الشعبة"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  options={systemSettings?.sections || ["أ", "ب", "ج"]}
                />
              </div>

              {/* Date */}
              <FormInput
                label="تاريخ اضافة الطالب"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                type="date"
                required
              />

              {/* ── Tuition + Discount section ──────────── */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-3 sm:pt-4 border-t border-slate-100">
                <FormInput
                  label="القسط الكلي (د.ع)"
                  name="tuition"
                  value={formData.tuition}
                  onChange={handleInputChange}
                  placeholder="قسط الطالب الكلي"
                  type="number"
                  required
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <label className="text-xs font-black text-slate-500">
                      الخصم المطبق
                    </label>
                    <div className="flex gap-1.5 sm:gap-2 text-[10px] font-black">
                      <button
                        type="button"
                        onClick={() => setDiscountType("iqd")}
                        className={`px-2 py-1 rounded-lg transition-colors ${
                          discountType === "iqd"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        مبلغ (د.ع)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType("percent")}
                        className={`px-2 py-1 rounded-lg transition-colors ${
                          discountType === "percent"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        نسبة (%)
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={discountType === "percent" ? "أدخل النسبة (مثال: 10)" : "أدخل مبلغ الخصم"}
                    value={discountType === "percent" ? discountInput : formatWithCommas(discountInput)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                        setDiscountInput(raw);
                      }
                    }}
                    className="w-full bg-slate-50/50 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all border border-blue-50/50 focus:border-blue-300 font-bold font-mono text-left text-sm sm:text-base"
                  />
                  {discountType === "percent" && formData.tuition && (
                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-400">
                      مرادف الخصم بالدينار:{" "}
                      {new Intl.NumberFormat("en-US").format(
                        Math.round(((parseFloat(formData.tuition) || 0) * (parseFloat(discountInput) || 0)) / 100)
                      )}{" "}
                      د.ع
                    </div>
                  )}
                </div>
              </div>

              {/* ── Phone numbers ──────────── */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                <FormInput
                  label="رقم هاتف ولي الأمر"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleInputChange}
                  placeholder="07XXXXXXXXX"
                  required
                />
                <FormInput
                  label="رقم هاتف آخر (اختياري)"
                  name="motherPhone"
                  value={formData.motherPhone}
                  onChange={handleInputChange}
                  placeholder="07XXXXXXXXX"
                />
              </div>

              {/* ── Notes ──────────── */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-black text-slate-500">
                  الملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="اكتب ملاحظاتك هنا"
                  className="w-full h-24 sm:h-32 bg-slate-50/50 py-3 sm:py-4 px-4 sm:px-6 rounded-2xl sm:rounded-3xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all border border-blue-50/50 focus:border-blue-300 font-bold resize-none text-sm sm:text-base"
                />
              </div>
            </motion.div>
          </form>
        </div>
      </div>

      {/* ── Submit footer ──────────────────────────────── */}
      <footer className="px-3 sm:px-5 md:px-6 py-3 sm:py-5 md:py-6 bg-white/80 backdrop-blur-md border-t border-slate-100 shrink-0 z-20">
        <div className="max-w-4xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            onClick={handleSubmit}
            className="w-full text-white font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-2 sm:gap-3 transition-all relative overflow-hidden text-sm sm:text-base"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)" }}
          >
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="inline-flex"
            >
              <UserPlus size={17} strokeWidth={3} />
            </motion.span>
            <span>حفظ بيانات الطالب وتسجيله</span>
          </motion.button>
        </div>
      </footer>
    </motion.div>
  );
}

export default StudentForm;

/**
 * EditStudentModal.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Edit2, Printer } from "lucide-react";
import type { Student, SystemSettings } from "@/types";
import { formatStudentCode, formatWithCommas } from "@/utils/format";

const EditStudentModal = ({
  student,
  schools,
  grades,
  onClose,
  onSave,
  systemSettings,
}: {
  student: Student;
  schools: string[];
  grades: string[];
  onClose: () => void;
  onSave: (updated: Student) => void;
  systemSettings?: SystemSettings;
}) => {
  const [formData, setFormData] = useState<Student>({ ...student });
  const [discountType, setDiscountType] = useState<"iqd" | "percent">("iqd");
  const [discountInput, setDiscountInput] = useState(String(student.discount || 0));

  const handleSaveWithDiscount = () => {
    const finalDiscount = discountType === "percent"
      ? ((formData.tuition * (parseFloat(discountInput) || 0)) / 100)
      : (parseFloat(discountInput) || 0);
    onSave({
      ...formData,
      discount: finalDiscount,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[75] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative my-8"
        dir="rtl"
      >
        <div className="bg-amber-500 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Edit2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">تعديل بيانات الطالب</h2>
              <p className="text-amber-100 font-bold mt-1">
                كود الطالب: #{formatStudentCode(student.id)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">
                اسم الطالب
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">
                المرحلة الدراسية
              </label>
              <select
                value={formData.grade}
                onChange={(e) => {
                  const newGrade = e.target.value;
                  const targetPrice = systemSettings?.gradePrices?.[newGrade];
                  const updatedTuition =
                    targetPrice !== undefined ? targetPrice : formData.tuition;
                  setFormData({
                    ...formData,
                    grade: newGrade,
                    tuition: updatedTuition,
                  });
                }}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
              >
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">
                الشعبة
              </label>
              <select
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
              >
                {(systemSettings?.sections || ["أ", "ب", "ج"]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Tuition: Discount inline style layout */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">
                المبلغ الكلي (القسط)
              </label>
              <input
                type="text"
                value={formatWithCommas(formData.tuition)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                    setFormData({ ...formData, tuition: parseFloat(raw) || 0 });
                  }
                }}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all text-right font-mono"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">
                  الخصم المطبق
                </label>
                <div className="flex gap-2 text-[10px] font-black">
                  <button
                    type="button"
                    onClick={() => setDiscountType("iqd")}
                    className={`px-2 py-0.5 rounded ${
                      discountType === "iqd"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    مبلغ (د.ع)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("percent")}
                    className={`px-2 py-0.5 rounded ${
                      discountType === "percent"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    نسبة (%)
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder={discountType === "percent" ? "النسبة مئوية" : "الخصم بالدينار"}
                value={discountType === "percent" ? discountInput : formatWithCommas(discountInput)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                    setDiscountInput(raw);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all text-right font-mono"
              />
              {discountType === "percent" && formData.tuition && (
                <div className="text-[10px] font-bold text-slate-400 mr-2">
                  مرادف الخصم بالدينار:{" "}
                  {new Intl.NumberFormat("en-US").format(
                    Math.round(((formData.tuition || 0) * (parseFloat(discountInput) || 0)) / 100)
                  )}{" "}
                  د.ع
                </div>
              )}
            </div>

            {/* Parent's Number: Other Number inline style layout */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">
                رقم ولي الأمر (Parent's Number)
              </label>
              <input
                type="text"
                value={formData.guardianPhone}
                onChange={(e) =>
                  setFormData({ ...formData, guardianPhone: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">
                رقم هاتف آخر (Other Number)
              </label>
              <input
                type="text"
                value={formData.motherPhone}
                onChange={(e) =>
                  setFormData({ ...formData, motherPhone: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">
              ملاحظات إضافية
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            onClick={handleSaveWithDiscount}
            className="flex-1 bg-amber-500 text-white p-5 rounded-[2rem] font-black text-lg hover:bg-amber-600 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
          >
            حفظ التعديلات
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white text-slate-500 p-5 rounded-[2rem] font-black text-lg border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Taxes (Names Roster Printer) ---

export default EditStudentModal;

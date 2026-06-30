/**
 * SectionsManagementSubView.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Users, Plus, ArrowRight, Trash2, Info } from "lucide-react";
import type { Student, SystemSettings } from "@/types";
import { notify } from "@/utils/notify";
import { verifyDeletePassword } from "@/utils/security";

const SectionsManagementSubView = ({
  onBack,
  systemSettings,
  onUpdateSettings,
  students = [],
}: {
  onBack: () => void;
  systemSettings: SystemSettings;
  onUpdateSettings: (s: SystemSettings, silent?: boolean) => void;
  students?: Student[];
}) => {
  const [newSectionName, setNewSectionName] = useState("");
  const sections = systemSettings.sections || ["أ", "ب", "ج"];

  const handleAddSection = () => {
    const trimmed = newSectionName.trim();
    if (!trimmed) return;
    if (sections.includes(trimmed)) {
      notify("هذه الشعبة موجودة بالفعل!", "warning");
      return;
    }
    const updatedSections = [...sections, trimmed];
    onUpdateSettings(
      {
        ...systemSettings,
        sections: updatedSections,
      },
      false,
    );
    setNewSectionName("");
  };

  const handleDeleteSection = async (secName: string) => {
    const hasStudents = students.some((s) => s.section === secName);
    let message = `هل أنت متأكد من حذف شعبة (${secName})؟`;
    if (hasStudents) {
      const count = students.filter((s) => s.section === secName).length;
      message = `تنبيه: هذه الشعبة تحتوي على ${count} طالباً حالياً. هل أنت متأكد من حذفها؟ لن يتم حذف الطلاب ولكنهم سيكونون بلا شعبة محددة.`;
    }

    if (window.confirm(message)) {
      const __ok = await verifyDeletePassword(); if (!__ok) return;
      const updatedSections = sections.filter((s) => s !== secName);
      onUpdateSettings(
        {
          ...systemSettings,
          sections: updatedSections,
        },
        false,
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #ecfeff, #f0fdfa)" }}
      dir="rtl"
    >
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30"
            >
              <Users size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">إدارة الشُّعب الدراسية</h1>
              <p className="text-[10px] font-bold text-slate-400">{sections.length} شعبة • تُستخدم لتصنيف الطلاب داخل كل مرحلة</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Info banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-cyan-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
              <Info size={16} />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
              أضف شُعباً دراسية (مثل <span className="text-cyan-700 font-black">أ، ب، ج</span>) لتصنيف الطلاب داخل كل مرحلة. الشُّعب تظهر في قائمة اختيار الطالب وفي التقارير.
            </p>
          </motion.div>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-2 pr-1"
          >
            <div className="w-1.5 h-5 bg-cyan-500 rounded-full" />
            <h2 className="text-sm font-black text-slate-700">إضافة شعبة جديدة</h2>
          </motion.div>

          {/* Add new section card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end"
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 pr-1">
                <Users size={11}/> اسم الشعبة أو رمزها
              </label>
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="مثال: أ، ب، ج، أو شعبة 1"
                className="w-full bg-slate-50 py-3 px-4 rounded-xl text-sm font-bold border border-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-200 focus:bg-white transition-all text-right"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSection();
                }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
              onClick={handleAddSection}
              className="text-white font-black px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/30 text-xs flex items-center justify-center gap-2 transition-all md:h-[46px]"
              style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0d9488 100%)" }}
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="inline-flex"
              >
                <Plus size={14} strokeWidth={3}/>
              </motion.span>
              <span>إضافة</span>
            </motion.button>
          </motion.div>

          {/* Current Sections List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-cyan-500 rounded-full"/>
                <h3 className="text-sm font-black text-slate-700">
                  الشُّعب المتاحة حالياً
                </h3>
              </div>
              <span className="text-[10px] bg-cyan-50 px-2.5 py-1 text-cyan-700 font-black rounded-lg border border-cyan-100">
                إجمالي: {sections.length}
              </span>
            </div>

            {sections.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold space-y-3">
                <Users size={40} className="mx-auto text-slate-300" />
                <p className="text-xs">
                  لا توجد شُعب مضافة. أضف شعبة من النموذج أعلاه.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sections.map((sec, index) => {
                  const count = students.filter(
                    (s) => s.section === sec,
                  ).length;
                  return (
                    <motion.div
                      key={sec}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + index * 0.03 }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50/50 border border-slate-100 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-500/10 transition-all relative overflow-hidden group"
                    >
                      <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-cyan-500 opacity-10 group-hover:opacity-20 transition-opacity"/>
                      <div className="flex items-center gap-3 relative z-10">
                        <div
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center font-black shadow-md shadow-cyan-500/30 shrink-0"
                        >
                          {sec}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-sm">
                            شعبة {sec}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {count} طالب
                          </span>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteSection(sec)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded-lg transition-all shrink-0 relative z-10"
                        title="حذف الشعبة"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default SectionsManagementSubView;

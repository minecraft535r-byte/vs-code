/**
 * BulkTransfer.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Users, GraduationCap, TrendingUp, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import type { Student } from "@/types";
import { notify } from "@/utils/notify";

const BulkTransfer = ({
  onBack,
  grades,
  students,
  onBulkTransfer,
}: {
  onBack: () => void;
  grades: string[];
  students: Student[];
  onBulkTransfer: (from: string, to: string) => void;
}) => {
  const [fromGrade, setFromGrade] = useState("");
  const [toGrade, setToGrade] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const studentsInGrade = fromGrade
    ? students.filter((s) => s.grade === fromGrade).length
    : 0;

  const handleTransfer = () => {
    if (!fromGrade || !toGrade) {
      notify("يرجى اختيار المرحلة الحالية والمرحلة الهدف", "warning");
      return;
    }
    if (fromGrade === toGrade) {
      notify("لا يمكن ترحيل الطلاب إلى نفس المرحلة", "warning");
      return;
    }
    if (studentsInGrade === 0) {
      notify("لا يوجد طلاب في المرحلة المختارة", "warning");
      return;
    }

    setIsConfirming(true);
  };

  const confirmTransfer = () => {
    onBulkTransfer(fromGrade, toGrade);
    setIsConfirming(false);
    onBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] bg-slate-50 flex flex-col"
      dir="rtl"
    >
      <header className="h-20 bg-emerald-600 text-white flex items-center justify-between px-8 shadow-xl relative z-10 shrink-0">
        <div className="flex items-center gap-6">
          <motion.button whileHover={{ x: 5 }} onClick={onBack}>
            <ArrowRight size={24} />
          </motion.button>
          <h1 className="text-xl font-black">الترحيل الجماعي للطلاب</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-hide">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-12 space-y-12">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm rotate-3">
                  <RefreshCw size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-800">
                  ترحيل الطلاب للمرحلة التالية
                </h2>
                <p className="text-slate-400 font-bold max-w-lg mx-auto leading-relaxed">
                  اختر المرحلة الدراسية الحالية والمرحلة التي ترغب بترحيل الطلاب
                  إليها. سيتم تحديث جميع بيانات الطلاب المختارين دفعة واحدة.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-2 border-emerald-50 p-10 rounded-[2.5rem] bg-emerald-50/20">
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-sm font-black text-emerald-700 mr-2 uppercase tracking-widest">
                    <GraduationCap size={18} />
                    ترحيل من مرحلة :
                  </label>
                  <select
                    value={fromGrade}
                    onChange={(e) => setFromGrade(e.target.value)}
                    className="w-full h-16 bg-white py-4 px-8 rounded-2xl border-2 border-emerald-100 font-black text-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 hover:border-emerald-300 transition-all text-lg"
                  >
                    <option value="">اختر المرحلة الحالية</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {fromGrade && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-emerald-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <Users size={20} />
                        <span className="font-bold">عدد طلاب هذه المرحلة:</span>
                      </div>
                      <span className="text-2xl font-black">
                        {studentsInGrade}
                      </span>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-sm font-black text-amber-600 mr-2 uppercase tracking-widest">
                    <TrendingUp size={18} />
                    إلى مرحلة :
                  </label>
                  <select
                    value={toGrade}
                    onChange={(e) => setToGrade(e.target.value)}
                    className="w-full h-16 bg-white py-4 px-8 rounded-2xl border-2 border-amber-100 font-black text-amber-900 focus:outline-none focus:ring-4 focus:ring-amber-100 hover:border-amber-300 transition-all text-lg"
                  >
                    <option value="">اختر المرحلة المستهدفة</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTransfer}
                  disabled={!fromGrade || !toGrade || studentsInGrade === 0}
                  className="bg-emerald-600 text-white font-black px-16 py-6 rounded-3xl shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:opacity-30 disabled:grayscale flex items-center gap-4 text-xl"
                >
                  <RefreshCw
                    size={24}
                    className={isConfirming ? "animate-spin" : ""}
                  />
                  ترحيل ونقل الطلاب الآن
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isConfirming && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-md w-full text-center space-y-8 border-4 border-white"
          >
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle size={48} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800">
                تأكيد العملية
              </h3>
              <p className="text-slate-500 font-bold leading-relaxed text-lg">
                هل أنت متأكد من ترحيل {studentsInGrade} طالباً من مرحلة{" "}
                <span className="text-emerald-600 font-black">
                  ({fromGrade})
                </span>{" "}
                إلى مرحلة{" "}
                <span className="text-amber-600 font-black">({toGrade})</span>؟
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmTransfer}
                className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl hover:bg-emerald-700 transition-colors shadow-xl shadow-emerald-600/20 text-lg"
              >
                نعم، قم بالترحيل الآن
              </button>
              <button
                onClick={() => setIsConfirming(false)}
                className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-200 transition-colors text-lg"
              >
                إلغاء العملية
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default BulkTransfer;

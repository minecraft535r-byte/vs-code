/**
 * AttendanceManagement.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, GraduationCap, TrendingDown, TrendingUp, Plus, ArrowRight, ChevronDown, X, Trash2, LayoutGrid, CalendarCheck, RotateCcw, UserX, AlertTriangle } from "lucide-react";
import type { Student, AppUser, SystemSettings } from "@/types";
import { formatWithCommas, handleDirectMoneyChange } from "@/utils/format";
import { notify } from "@/utils/notify";
import { verifyDeletePassword } from "@/utils/security";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import ManagedSelect from "@/components/ui/ManagedSelect";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import TrendArrow from "@/components/ui/TrendArrow";

const AttendanceManagement = ({
  onBack,
  students,
  onUpdateStudents,
  schools,
  grades,
  currentUser,
  systemSettings,
}: {
  onBack: () => void;
  students: Student[];
  onUpdateStudents: (updated: Student[]) => void;
  schools: string[];
  grades: string[];
  currentUser: AppUser | null;
  systemSettings?: SystemSettings;
}) => {
  const isOwner =
    currentUser?.username === "Mor" ||
    currentUser?.username === "Methaq" ||
    currentUser?.permissions.includes("admin") ||
    currentUser?.permissions.includes("settings");
  const [selectedSchool, setSelectedSchool] = useState(schools[0] || "");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [searchTerm, setSearchTerm] = useState("");

  const [absenceThreshold, setAbsenceThreshold] = useState<number | "">("");

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPasscode, setResetPasscode] = useState("");
  const [isReseting, setIsReseting] = useState(false);
  const [resetStep, setResetStep] = useState(1);

  const getAttendanceStats = (student: Student) => {
    const attendance = student.attendance || [];
    const absent = attendance.filter((a) => a.status === "absent").length;
    const late = attendance.filter((a) => a.status === "late").length;
    const present = attendance.filter((a) => a.status === "present").length;
    return { absent, late, present };
  };

  const sections = [...(systemSettings?.sections || ["أ", "ب", "ج"])].sort();

  const filteredStudents = students.filter((s) => {
    const stats = getAttendanceStats(s);
    return (
      (selectedSchool === "" || s.school === selectedSchool) &&
      (selectedGrade === "" || s.grade === selectedGrade) &&
      (selectedSection === "" || s.section === selectedSection) &&
      (s.name.includes(searchTerm) || s.id.includes(searchTerm)) &&
      (absenceThreshold === "" || stats.absent >= absenceThreshold)
    );
  });

  const handleUpdateStatus = (
    studentId: string,
    status: "present" | "absent" | "late",
  ) => {
    const updatedStudents = students.map((s) => {
      if (s.id === studentId) {
        const currentAttendance = s.attendance || [];
        const recordIndex = currentAttendance.findIndex(
          (r) => r.date === selectedDate,
        );

        let newAttendance = [...currentAttendance];
        if (recordIndex > -1) {
          newAttendance[recordIndex] = { date: selectedDate, status };
        } else {
          newAttendance.push({ date: selectedDate, status });
        }

        return { ...s, attendance: newAttendance };
      }
      return s;
    });
    onUpdateStudents(updatedStudents);
  };

  const handleBulkStatus = (status: "present" | "absent") => {
    const idsToUpdate = filteredStudents.map((s) => s.id);
    const updatedStudents = students.map((s) => {
      if (idsToUpdate.includes(s.id)) {
        const currentAttendance = s.attendance || [];
        const recordIndex = currentAttendance.findIndex(
          (r) => r.date === selectedDate,
        );

        let newAttendance = [...currentAttendance];
        if (recordIndex > -1) {
          newAttendance[recordIndex] = { date: selectedDate, status };
        } else {
          newAttendance.push({ date: selectedDate, status });
        }

        return { ...s, attendance: newAttendance };
      }
      return s;
    });
    onUpdateStudents(updatedStudents);
  };

  const handleResetAttendance = () => {
    if (resetPasscode === currentUser?.password) {
      setIsReseting(true);
      const idsToReset = filteredStudents.map((s) => s.id);

      // Update the main students list by resetting attendance for filtered IDs
      const updatedList = students.map((s) =>
        idsToReset.includes(s.id) ? { ...s, attendance: [] } : s,
      );

      // Artificial delay for UI feedback
      setTimeout(() => {
        onUpdateStudents(updatedList);
        setIsReseting(false);
        setShowResetConfirm(false);
        setResetPasscode("");
        setResetStep(1);
        notify(
          `تم تصفير سجلات ${idsToReset.length} طالباً بنجاح (بناءً على الفلترة الحالية)`
  , "success");
      }, 1000);
    } else {
      notify("كلمة المرور غير صحيحة", "warning");
    }
  };

  const handleResetStudent = async (studentId: string) => {
    if (confirm("هل أنت متأكد من تصفير سجل هذا الطالب؟")) {
      const __ok = await verifyDeletePassword(); if (!__ok) return;
      const updatedStudents = students.map((s) =>
        s.id === studentId ? { ...s, attendance: [] } : s,
      );
      onUpdateStudents(updatedStudents);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #f0fdf4, #ecfdf5)" }}
      dir="rtl"
    >
      {/* ── Modern light header ─────────────────────────────── */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
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
              <CalendarCheck size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">سجل الحضور والغياب</h1>
              <p className="text-[10px] font-bold text-slate-400">{filteredStudents.length} طالب • تاريخ السجل: {selectedDate}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl font-bold text-xs focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-200 focus:bg-white transition-all"
          />
          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setResetStep(1);
                setResetPasscode("");
                setShowResetConfirm(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-black text-xs border border-rose-100 transition-all"
              title="تصفير السجلات المفلترة"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">
                {filteredStudents.length === students.length
                  ? "تصفير الكل"
                  : "تصفير المختارين"}
              </span>
            </motion.button>
          )}
        </div>
      </header>

      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-100 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3">
            <GraduationCap size={13} className="text-slate-400 ml-1.5" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-transparent py-2 pr-1 pl-3 font-bold text-xs focus:outline-none cursor-pointer text-slate-700"
            >
              <option value="">كل المراحل</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3">
            <LayoutGrid size={13} className="text-slate-400 ml-1.5" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-transparent py-2 pr-1 pl-3 font-bold text-xs focus:outline-none cursor-pointer text-slate-700"
            >
              <option value="">كل الشعب</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3">
            <UserX size={13} className="text-rose-400 ml-1.5" />
            <select
              value={absenceThreshold}
              onChange={(e) =>
                setAbsenceThreshold(
                  e.target.value === "" ? "" : parseInt(e.target.value),
                )
              }
              className="bg-transparent py-2 pr-1 pl-3 font-bold text-xs focus:outline-none cursor-pointer text-slate-700"
            >
              <option value="">كل الغيابات</option>
              <option value="1">غائب مرّة أو أكثر</option>
              <option value="3">غائب 3 مرّات أو أكثر</option>
              <option value="5">غائب 5 مرّات أو أكثر</option>
              <option value="10">غائب 10 مرّات أو أكثر</option>
            </select>
          </div>

          <div className="relative w-44">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-200 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleBulkStatus("present")}
            className="px-3 py-2 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-500/30 transition-all"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)" }}
          >
            تحديد الكل حاضر
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleBulkStatus("absent")}
            className="px-3 py-2 text-white rounded-xl font-black text-xs shadow-lg shadow-rose-500/30 transition-all"
            style={{ background: "linear-gradient(135deg, #f43f5e 0%, #ef4444 100%)" }}
          >
            تحديد الكل غائب
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 scrollbar-hide">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <UserX size={40} />
                </div>
                <p className="text-slate-400 font-bold">
                  لا يوجد طلاب مطابقين للبحث
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const record = student.attendance?.find(
                  (r) => r.date === selectedDate,
                );
                const status = record?.status;
                const stats = getAttendanceStats(student);

                return (
                  <motion.div
                    layout
                    key={student.id}
                    className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <h3 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors uppercase">
                          {student.name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest">
                          {student.grade} - {student.section}
                        </p>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleResetStudent(student.id)}
                          className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                          title="تصفير سجل الطالب"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-emerald-50/50 p-3 rounded-2xl text-center border border-emerald-100/50">
                        <p className="text-[10px] font-black text-emerald-600 mb-1">
                          حاضر
                        </p>
                        <p className="text-xl font-black text-emerald-700">
                          {stats.present}
                        </p>
                      </div>
                      <div className="bg-rose-50/50 p-3 rounded-2xl text-center border border-rose-100/50">
                        <p className="text-[10px] font-black text-rose-600 mb-1">
                          غائب
                        </p>
                        <p className="text-xl font-black text-rose-700">
                          {stats.absent}
                        </p>
                      </div>
                      <div className="bg-amber-50/50 p-3 rounded-2xl text-center border border-amber-100/50">
                        <p className="text-[10px] font-black text-amber-600 mb-1">
                          متأخر
                        </p>
                        <p className="text-xl font-black text-amber-700">
                          {stats.late}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdateStatus(student.id, "present")
                        }
                        className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${
                          status === "present"
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
                        }`}
                      >
                        حاضر
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(student.id, "absent")}
                        className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${
                          status === "absent"
                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                            : "bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                        }`}
                      >
                        غائب
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(student.id, "late")}
                        className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${
                          status === "late"
                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                            : "bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500"
                        }`}
                      >
                        متأخر
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl"
              dir="rtl"
            >
              {isReseting ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-black text-slate-800 text-xl tracking-widest uppercase">
                    جاري تصفير السجلات...
                  </p>
                </div>
              ) : (
                <div className="p-8 space-y-6">
                  <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={40} />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">
                      تأكيد تصفير الحضور
                    </h2>
                    <p className="text-slate-500 font-bold text-sm">
                      هل أنت متأكد من مسح كافة سجلات الحضور لـ
                      <span className="text-rose-600 px-1 font-black underline">
                        {filteredStudents.length}
                      </span>
                      طالباً (بناءً على الفلترة)؟
                    </p>
                  </div>
                  <input
                    type="password"
                    value={resetPasscode}
                    onChange={(e) => setResetPasscode(e.target.value)}
                    placeholder="كلمة مرور الحساب"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl text-center font-black text-2xl focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all outline-none"
                    autoFocus
                  />
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={handleResetAttendance}
                      className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-200"
                    >
                      تأكيد المسح النهائي
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Animated counter component ────────────────────────────────────────────
const AnimatedCounter = ({
  value, isMoney = false, suffix = "", isDark = false,
}: { value: number; isMoney?: boolean; suffix?: string; isDark?: boolean }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplayed(0); return; }
    const duration = 900;
    const step = Math.max(1, Math.ceil(end / (duration / 16)));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplayed(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <p className={`text-sm md:text-base font-black leading-tight relative z-10 ${isDark ? "text-white" : "text-slate-800"}`}>
      {isMoney
        ? new Intl.NumberFormat("en-US").format(displayed) + " د.ع"
        : displayed.toLocaleString("en") + (suffix ? " " + suffix : "")}
    </p>
  );
};

// ── Animated trend arrow (up=green, down=red, neutral=hidden) ─────────────
// MUST be defined at module level (not inside another component's render),
// otherwise React sees a new function identity every render → remounts the
// component → replays the entry animation continuously.
const TrendArrow = ({ trend, delay }: { trend: "up" | "down" | "neutral"; delay: number }) => {
  if (trend === "neutral") return null;
  const isUp = trend === "up";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: isUp ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 18 }}
      className={`absolute top-3 left-3 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-black text-[9px] ${
        isUp
          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
          : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
      }`}
    >
      <motion.span
        animate={isUp ? { y: [-1, 1, -1] } : { y: [1, -1, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex"
      >
        {isUp ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
      </motion.span>
    </motion.div>
  );
};

const FormInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  full = false,
  required = false,
}: any) => {
  const isMoney =
    type === "number" &&
    (name === "tuition" ||
      name === "discount" ||
      name === "amount" ||
      name === "salary" ||
      name === "price" ||
      name?.toLowerCase().includes("price") ||
      name?.toLowerCase().includes("amount"));

  if (isMoney) {
    const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleDirectMoneyChange(e, (cleanVal) => {
        onChange(name, cleanVal);
      });
    };

    return (
      <div className={`${full ? "col-span-2" : ""} space-y-2`}>
        <label className="text-xs font-black text-slate-500 mr-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          placeholder={placeholder}
          value={formatWithCommas(value)}
          onChange={handleMoneyChange}
          required={required}
          className="w-full bg-slate-50/50 py-4 px-6 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all border border-blue-50/50 focus:border-blue-300 font-bold"
        />
      </div>
    );
  }

  return (
    <div className={`${full ? "col-span-2" : ""} space-y-2`}>
      <label className="text-xs font-black text-slate-500 mr-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        className="w-full bg-slate-50/50 py-4 px-6 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all border border-blue-50/50 focus:border-blue-300 font-bold"
      />
    </div>
  );
};

const FormSelect = ({ label, name, value, onChange, options }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-black text-slate-500 mr-2">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full bg-slate-50/50 py-4 px-6 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all border border-blue-50/50 focus:border-blue-300 font-bold appearance-none cursor-pointer"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronDown size={20} />
      </div>
    </div>
  </div>
);

const ManagedSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  onUpdateList,
  listKey,
  disableAdd = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (n: string, v: string) => void;
  options: string[];
  onUpdateList: (k: string, l: string[]) => void;
  listKey: string;
  disableAdd?: boolean;
}) => {
  const [isManaging, setIsManaging] = useState(false);
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim() && !options.includes(newItem.trim())) {
      onUpdateList(listKey, [...options, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleDelete = async (item: string) => {
    const __ok = await verifyDeletePassword(); if (!__ok) return;
    onUpdateList(
      listKey,
      options.filter((opt) => opt !== item),
    );
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-xs font-black text-slate-500 mr-2">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            className="w-full bg-slate-50/50 py-4 px-6 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all border border-blue-50/50 focus:border-blue-300 font-bold appearance-none cursor-pointer"
          >
            {options.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown size={20} />
          </div>
        </div>
        {!disableAdd && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsManaging(true)}
            className="w-14 bg-white border border-blue-100 text-blue-500 rounded-2xl flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm shrink-0"
          >
            <Plus size={20} />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isManaging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute top-full left-0 right-0 z-[70] mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 space-y-4 max-h-80 flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-slate-400">
                إدارة القائمة
              </h4>
              <button
                type="button"
                onClick={() => setIsManaging(false)}
                className="text-slate-400 hover:text-rose-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="إضافة جديد..."
                className="flex-1 bg-slate-50 py-3 px-5 rounded-xl border border-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
              {options.map((opt) => (
                <motion.div
                  layout
                  key={opt}
                  className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-50 group hover:border-rose-100"
                >
                  <span className="text-sm font-bold text-slate-700">
                    {opt}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(opt)}
                    className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AttendanceManagement;

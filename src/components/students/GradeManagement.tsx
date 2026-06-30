/**
 * GradeManagement.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Lock, Search, GraduationCap, ArrowRight, LayoutGrid, RotateCcw, AlertTriangle } from "lucide-react";
import type { Student, AppUser, SystemSettings, Grade } from "@/types";
import { notify } from "@/utils/notify";
import { verifyDeletePassword } from "@/utils/security";
import { STUDENT_SUBJECTS } from "@/constants";

const GradeManagement = ({
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
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const editingStudent =
    students.find((s) => s.id === editingStudentId) || null;

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPasscode, setResetPasscode] = useState("");
  const [isReseting, setIsReseting] = useState(false);

  const sections = [...(systemSettings?.sections || ["أ", "ب", "ج"])].sort();

  const handleResetGrades = () => {
    if (resetPasscode === currentUser?.password) {
      const filteredIds = filteredStudents.map((s) => s.id);

      const updatedStudentsList = students.map((s) => {
        if (filteredIds.includes(s.id)) {
          return { ...s, studentGrades: [] };
        }
        return s;
      });

      if (filteredIds.length === 0) {
        notify("لم يتم العثور على طلاب مطابقين لمعايير البحث الحالية.", "warning");
        return;
      }

      onUpdateStudents(updatedStudentsList);
      setShowResetConfirm(false);
      setResetPasscode("");
      setIsReseting(false);
      notify(
        `تم تصفير درجات ${filteredIds.length} طالباً بنجاح (بناءً على الفلترة الحالية)`
  , "success");
    } else {
      notify("كلمة المرور غير صحيحة", "warning");
    }
  };

  const handleResetIndividualGrades = async (studentId: string) => {
    if (
      window.confirm(
        "هل أنت متأكد من تصفير درجات هذا الطالب؟ هذا الإجراء سيمسح كافة الدرجات المرصودة له.",
      )
    ) {
      const __ok = await verifyDeletePassword(); if (!__ok) return;
      const updatedStudents = students.map((s) =>
        s.id === studentId ? { ...s, studentGrades: [] } : s,
      );
      onUpdateStudents(updatedStudents);
      notify("تم تصفير درجات الطالب المختار بنجاح", "success");
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      (selectedSchool === "" || s.school === selectedSchool) &&
      (selectedGrade === "" || s.grade === selectedGrade) &&
      (selectedSection === "" || s.section === selectedSection) &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.includes(searchTerm)),
  );

  const calculateGPA = (grades?: Grade[]) => {
    if (!grades || grades.length === 0) return 0;
    const total = grades.reduce((acc, curr) => acc + curr.score, 0);
    return (total / grades.length).toFixed(1);
  };

  const getStatusInfo = (grades?: Grade[]) => {
    if (!grades || grades.length === 0)
      return {
        text: "لا يوجد بيانات",
        color: "text-slate-400",
        bgColor: "bg-slate-50",
      };
    const failCount = grades.filter((g) => g.score < 50).length;

    if (failCount === 0) {
      return {
        text: "ناجح",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      };
    }

    return {
      text: `مكمل بـ ${failCount} مواد`,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    };
  };

  const handleUpdateGrade = (subject: string, score: number) => {
    if (!editingStudent) return;

    const currentGrades = editingStudent.studentGrades || [];
    const gradeIndex = currentGrades.findIndex((g) => g.subject === subject);

    let newGrades = [...currentGrades];
    if (gradeIndex > -1) {
      newGrades[gradeIndex] = { subject, score };
    } else {
      newGrades.push({ subject, score });
    }

    const updatedStudent = { ...editingStudent, studentGrades: newGrades };
    const updatedStudentsList = students.map((s) =>
      s.id === updatedStudent.id ? updatedStudent : s,
    );
    onUpdateStudents(updatedStudentsList);
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30"
            >
              <GraduationCap size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">إدارة الدرجات والنتائج</h1>
              <p className="text-[10px] font-bold text-slate-400">{filteredStudents.length} طالب من إجمالي {students.length}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-xs font-black transition-all"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">
                {filteredStudents.length === students.length
                  ? "تصفير الجميع"
                  : "تصفير المختارين"}
              </span>
            </motion.button>
          )}

          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
            <GraduationCap size={13} className="text-slate-400 ml-1.5" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer text-slate-700"
            >
              <option value="">كل المراحل</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
            <LayoutGrid size={13} className="text-slate-400 ml-1.5" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer text-slate-700"
            >
              <option value="">كل الشعب</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="بحث عن طالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-3 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs focus:bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-200 transition-all outline-none w-44"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Students List */}
        <div className="w-full md:w-96 border-l border-slate-200 overflow-y-auto p-4 space-y-3 bg-white/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">
            قائمة الطلاب
          </p>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={32} />
              </div>
              <p className="text-slate-400 font-bold">لا يوجد طلاب مطابقين</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <motion.div
                layout
                key={student.id}
                onClick={() => setEditingStudentId(student.id)}
                className={`w-full text-right p-4 rounded-2xl transition-all border cursor-pointer ${editingStudentId === student.id ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" : "bg-white text-slate-700 border-slate-100 hover:border-blue-200 shadow-sm"}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-black text-sm">{student.name}</span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${editingStudentId === student.id ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}
                  >
                    {student.id}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span
                    className={`text-xs ${editingStudentId === student.id ? "text-blue-100" : "text-slate-400"} font-bold`}
                  >
                    {student.grade} - {student.section}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${editingStudentId === student.id ? "bg-white/20" : getStatusInfo(student.studentGrades).bgColor + " " + getStatusInfo(student.studentGrades).color}`}
                    >
                      {getStatusInfo(student.studentGrades).text}
                    </span>
                    <span
                      className={`text-xs font-black p-1 rounded ${editingStudentId === student.id ? "bg-white/10" : "bg-slate-50"}`}
                    >
                      {calculateGPA(student.studentGrades)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Grade Editor */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          <AnimatePresence mode="wait">
            {!editingStudent ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto"
              >
                <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                  <GraduationCap size={48} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">
                  إدارة درجات الطلاب
                </h2>
                <p className="text-slate-400 font-bold leading-relaxed">
                  يرجى اختيار طالب من القائمة الجانبية لعرض وتعديل درجاته
                  الدراسية.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={editingStudent.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto space-y-8 pb-20"
              >
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400">
                      <User size={40} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">
                        {editingStudent.name}
                      </h2>
                      <p className="text-slate-400 font-bold">
                        {editingStudent.school} - {editingStudent.grade} (
                        {editingStudent.section})
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-emerald-50 p-6 rounded-3xl text-center min-w-[120px] border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">
                        المعدل العام
                      </p>
                      <p className="text-3xl font-black text-emerald-700">
                        {calculateGPA(editingStudent.studentGrades)}%
                      </p>
                    </div>
                    <div
                      className={`${getStatusInfo(editingStudent.studentGrades).bgColor} ${getStatusInfo(editingStudent.studentGrades).color} p-6 rounded-3xl text-center min-w-[120px] border border-current/10`}
                    >
                      <p className="text-[10px] font-black opacity-60 uppercase mb-1">
                        الحالة
                      </p>
                      <p className="text-2xl font-black">
                        {getStatusInfo(editingStudent.studentGrades).text}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {STUDENT_SUBJECTS.map((subject) => {
                    const grade = editingStudent.studentGrades?.find(
                      (g) => g.subject === subject,
                    );
                    return (
                      <div
                        key={subject}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-700">
                            {subject}
                          </p>
                          <p
                            className={`text-xs font-bold ${grade ? (grade.score >= 50 ? "text-emerald-500" : "text-rose-500") : "text-slate-300"}`}
                          >
                            {grade
                              ? grade.score >= 50
                                ? "ناجح"
                                : "راسب"
                              : "لم ترصد"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={grade?.score || ""}
                            onChange={(e) =>
                              handleUpdateGrade(
                                subject,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            placeholder="0"
                            className="w-20 bg-slate-50 py-3 px-4 rounded-xl text-center font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 border border-slate-100 focus:border-blue-300 transition-all outline-none"
                          />
                          <div
                            className={`w-2 h-10 rounded-full ${grade ? (grade.score >= 50 ? "bg-emerald-400" : "bg-rose-400") : "bg-slate-100"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
              dir="rtl"
            >
              {!isReseting ? (
                <div className="p-8 space-y-6">
                  <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={40} />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">
                      تنبيه هام جداً!
                    </h2>
                    <p className="text-slate-500 font-bold">
                      هل أنت متأكد من رغبتك في تصفير كافة درجات ومعدلات لـ
                      <span className="text-rose-600 px-1 font-black underline">
                        {filteredStudents.length}
                      </span>
                      طالباً المختارين حالياً؟ هذا الإجراء نهائي ولا يمكن
                      التراجع عنه.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setIsReseting(true)}
                      className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-200"
                    >
                      نعم، أنا متأكد
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-lg hover:bg-slate-200 active:scale-95 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 space-y-6">
                  <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Lock size={40} />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">
                      تأكيد كود الحساب
                    </h2>
                    <p className="text-slate-500 font-bold">
                      يرجى إدخال الكود السري لإتمام عملية مسح الدرجات
                    </p>
                  </div>
                  <input
                    type="password"
                    value={resetPasscode}
                    onChange={(e) => setResetPasscode(e.target.value)}
                    placeholder="أدخل كود الحساب"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl text-center font-black text-2xl focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all"
                    autoFocus
                  />
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleResetGrades}
                      className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-200"
                    >
                      تأكيد المسح النهائي
                    </button>
                    <button
                      onClick={() => setIsReseting(false)}
                      className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      عودة
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

// --- Attendance Management Component ---

export default GradeManagement;

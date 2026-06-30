/**
 * GradesManagementSubView.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Layout, Wallet, Plus, ArrowRight, ChevronDown, X, Trash2, ListTree, Info, LayoutGrid, Edit, Check } from "lucide-react";
import type { Student, SystemSettings } from "@/types";
import { formatWithCommas, handleDirectMoneyChange } from "@/utils/format";
import { notify } from "@/utils/notify";
import { verifyDeletePassword } from "@/utils/security";

const GradesManagementSubView = ({
  onBack,
  grades,
  onUpdateGrades,
  systemSettings,
  onUpdateSettings,
  students = [],
  onUpdateStudents,
}: {
  onBack: () => void;
  grades: string[];
  onUpdateGrades: (newGrades: string[]) => void;
  systemSettings: SystemSettings;
  onUpdateSettings: (s: SystemSettings, silent?: boolean) => void;
  students?: Student[];
  onUpdateStudents?: (s: Student[], isCompleteOverwrite?: boolean) => void;
}) => {
  const [newGradeName, setNewGradeName] = useState("");
  const [newGradePrice, setNewGradePrice] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Selection and Bulk Delete States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());

  // Custom Edit States for each row/grade
  const [editingGradeName, setEditingGradeName] = useState<string | null>(null);
  const [tempGradeName, setTempGradeName] = useState("");
  const [tempGradePrice, setTempGradePrice] = useState("");

  const lastRowSwapTimeRef = useRef<number>(0);

  const handleAddGrade = () => {
    const trimmed = newGradeName.trim();
    if (!trimmed) return;
    if (grades.includes(trimmed)) {
      notify("هذه المرحلة موجودة بالفعل!", "warning");
      return;
    }
    const price = parseFloat(newGradePrice) || 0;

    // Update grades list
    const updatedGrades = [...grades, trimmed];
    onUpdateGrades(updatedGrades);

    // Update prices inside system settings
    const updatedPrices = {
      ...(systemSettings.gradePrices || {}),
      [trimmed]: price,
    };
    onUpdateSettings(
      {
        ...systemSettings,
        gradePrices: updatedPrices,
      },
      true,
    );

    setNewGradeName("");
    setNewGradePrice("");
  };

  const finalizeGradeDeletion = (gradeName: string) => {
    const updatedGrades = grades.filter((g) => g !== gradeName);
    onUpdateGrades(updatedGrades);

    // Clean up price from dictionary
    const updatedPrices = { ...(systemSettings.gradePrices || {}) };
    delete updatedPrices[gradeName];
    onUpdateSettings(
      {
        ...systemSettings,
        gradePrices: updatedPrices,
      },
      true,
    );
  };

  const handleDeleteGrade = async (gradeName: string) => {
    const gradeStudents = students.filter((s) => s.grade === gradeName);
    let message = `هل أنت متأكد من حذف صف (${gradeName})؟`;

    if (gradeStudents.length > 0) {
      message = `تنبيه: هذا الصف يحتوي على ${gradeStudents.length} طالب/طلاب حالياً. هل أنت متأكد من حذف صف (${gradeName}) بشكل نهائي؟ سيتم تحويل الطلاب المسجلين فيه تلقائياً ليكونوا بلا صف.`;
    }

    if (window.confirm(message)) {
      const __ok = await verifyDeletePassword(); if (!__ok) return;
      if (gradeStudents.length > 0) {
        const updatedStudents = students.map((s) => {
          if (s.grade === gradeName) {
            return { ...s, grade: "" };
          }
          return s;
        });
        if (onUpdateStudents) {
          onUpdateStudents(updatedStudents, true);
        }
      }
      finalizeGradeDeletion(gradeName);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGrades.size === 0) return;

    const selectedList = Array.from(selectedGrades) as string[];
    const affectedStudents = students.filter((s) =>
      selectedList.includes(s.grade),
    );

    let message = `هل أنت متأكد من حذف الـ ${selectedList.length} صفوف المحددة؟`;
    if (affectedStudents.length > 0) {
      message = `تنبيه: الصفوف المحددة تحتوي على ${affectedStudents.length} طالب/طالبة حالياً. هل أنت متأكد من حذف هذه الصفوف بشكل نهائي؟ سيتم تحويل هؤلاء الطلاب تلقائياً ليكونوا بلا صف.`;
    }

    if (window.confirm(message)) {
      const __ok = await verifyDeletePassword(); if (!__ok) return;
      if (affectedStudents.length > 0) {
        const updatedStudents = students.map((s) => {
          if (selectedList.includes(s.grade)) {
            return { ...s, grade: "" };
          }
          return s;
        });
        if (onUpdateStudents) {
          onUpdateStudents(updatedStudents, true);
        }
      }

      const updatedGrades = grades.filter((g) => !selectedGrades.has(g));
      onUpdateGrades(updatedGrades);

      const updatedPrices = { ...(systemSettings.gradePrices || {}) };
      selectedList.forEach((g) => {
        delete updatedPrices[g];
      });
      onUpdateSettings(
        {
          ...systemSettings,
          gradePrices: updatedPrices,
        },
        true,
      );

      setIsSelectionMode(false);
      setSelectedGrades(new Set());
    }
  };

  const handlePriceChange = (gradeName: string, amount: number) => {
    const updatedPrices = {
      ...(systemSettings.gradePrices || {}),
      [gradeName]: amount,
    };
    onUpdateSettings(
      {
        ...systemSettings,
        gradePrices: updatedPrices,
      },
      true,
    );
  };

  const handleStartEdit = (grade: string, price: number) => {
    setEditingGradeName(grade);
    setTempGradeName(grade);
    setTempGradePrice(String(price));
  };

  const handleSaveEdit = (oldGradeName: string) => {
    const newName = tempGradeName.trim();
    if (!newName) return;
    if (newName !== oldGradeName && grades.includes(newName)) {
      notify("هذه المرحلة موجودة بالفعل لصف آخر!", "warning");
      return;
    }
    const priceValue = parseFloat(tempGradePrice) || 0;

    // Update grades array
    const updatedGrades = grades.map((g) => (g === oldGradeName ? newName : g));
    onUpdateGrades(updatedGrades);

    // Update prices dictionary
    const updatedPrices = { ...(systemSettings.gradePrices || {}) };
    delete updatedPrices[oldGradeName];
    updatedPrices[newName] = priceValue;

    onUpdateSettings(
      {
        ...systemSettings,
        gradePrices: updatedPrices,
      },
      true,
    );

    setEditingGradeName(null);
  };

  // Click-to-move up or down helpers
  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...grades];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onUpdateGrades(updated);
  };

  const moveDown = (index: number) => {
    if (index === grades.length - 1) return;
    const updated = [...grades];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onUpdateGrades(updated);
  };

  // HTML5 Elegant dragging mechanics with micro-swaps (Discord style)
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastRowSwapTimeRef.current < 250) {
      return; // prevent recursive swap flickering
    }
    if (draggedIndex !== null && draggedIndex !== index) {
      lastRowSwapTimeRef.current = now;
      const updated = [...grades];
      const temp = updated[draggedIndex];
      updated[draggedIndex] = updated[index];
      updated[index] = temp;
      setDraggedIndex(index);
      onUpdateGrades(updated);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #eef2ff, #f5f3ff)" }}
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"
            >
              <Layout size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">إدارة المراحل والأسعار</h1>
              <p className="text-[10px] font-bold text-slate-400">{grades.length} مرحلة • اسحب لإعادة الترتيب أو عدّل الأسعار</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Info banner instead of big centered intro */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Info size={16} />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
              أضف مراحل دراسية جديدة وحدد <span className="text-indigo-700 font-black">قسطها السنوي الافتراضي</span>. اسحب الصفوف لإعادة الترتيب، أو اضغط على القلم لتعديل اسم وقسط أي مرحلة.
            </p>
          </motion.div>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-2 pr-1"
          >
            <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
            <h2 className="text-sm font-black text-slate-700">إضافة مرحلة جديدة</h2>
          </motion.div>

          {/* Addition Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end"
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 pr-1">
                <Layout size={11}/> اسم المرحلة
              </label>
              <input
                type="text"
                placeholder="مثال: الأول الابتدائي"
                value={newGradeName}
                onChange={(e) => setNewGradeName(e.target.value)}
                className="w-full bg-slate-50 py-3 px-4 rounded-xl text-sm font-bold border border-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 pr-1">
                <Wallet size={11}/> القسط السنوي (د.ع)
              </label>
              <input
                type="text"
                placeholder="مثال: 750,000"
                value={formatWithCommas(newGradePrice)}
                onChange={(e) => handleDirectMoneyChange(e, setNewGradePrice)}
                className="w-full bg-slate-50 py-3 px-4 rounded-xl text-sm font-bold border border-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 focus:bg-white transition-all text-right font-mono"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
              onClick={handleAddGrade}
              className="text-white font-black px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/30 text-xs flex items-center justify-center gap-2 transition-all md:h-[46px]"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
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

          {/* Editable Draggable List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-5 md:p-6 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-indigo-500 rounded-full"/>
                <h3 className="text-sm font-black text-slate-700">
                  المراحل المضافة حالياً
                </h3>
                <span className="text-[10px] bg-indigo-50 px-2.5 py-1 text-indigo-700 font-black rounded-lg border border-indigo-100">
                  إجمالي: {grades.length}
                </span>
              </div>

              {grades.length > 0 && (
                <div className="flex items-center gap-2">
                  {!isSelectionMode ? (
                    <button
                      onClick={() => {
                        setIsSelectionMode(true);
                        setSelectedGrades(new Set());
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>تحديد وحذف متعدد</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-500 ml-2">
                        تم تحديد {selectedGrades.size} صف/صفوف
                      </span>
                      <button
                        onClick={handleBulkDelete}
                        disabled={selectedGrades.size === 0}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-lg shadow-rose-600/15"
                      >
                        <Trash2 size={14} />
                        <span>حذف المحدد</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedGrades(new Set());
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <X size={14} />
                        <span>إلغاء</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <motion.div layout className="space-y-3">
              {grades.map((grade, index) => {
                const isEditing = editingGradeName === grade;
                const currentPrice = systemSettings.gradePrices?.[grade] || 0;
                const isSelected = selectedGrades.has(grade);

                return (
                  <motion.div
                    layout
                    key={grade}
                    draggable={!isEditing && !isSelectionMode}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      if (isSelectionMode) {
                        const next = new Set(selectedGrades);
                        if (next.has(grade)) {
                          next.delete(grade);
                        } else {
                          next.add(grade);
                        }
                        setSelectedGrades(next);
                      }
                    }}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl transition-all border ${
                      isSelectionMode ? "cursor-pointer select-none" : ""
                    } ${
                      draggedIndex === index
                        ? "opacity-40 border-dashed border-indigo-400 bg-indigo-50/10 scale-98"
                        : isSelected
                          ? "bg-rose-50/40 border-rose-300 ring-2 ring-rose-200"
                          : "bg-slate-50/60 border-slate-100 hover:border-slate-200 hover:bg-slate-50/100"
                    } ${isEditing ? "ring-2 ring-indigo-500 bg-indigo-50/10 border-indigo-250" : ""}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Checkbox for selective delete */}
                      {isSelectionMode && (
                        <div className="flex items-center justify-center w-10 h-10 shrink-0">
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-rose-600 border-rose-600 text-white"
                                : "bg-white border-slate-300 hover:border-rose-400"
                            }`}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>
                      )}

                      {/* Drag and arrows - Only show when not editing or selecting */}
                      {!isEditing && !isSelectionMode ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="cursor-grab active:cursor-grabbing text-slate-400 p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all">
                            <LayoutGrid size={18} />
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveUp(index);
                            }}
                            disabled={index === 0}
                            className={`p-2 bg-white border rounded-xl transition-all active:scale-90 ${index === 0 ? "text-slate-200 border-slate-100 cursor-not-allowed" : "text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                          >
                            <ChevronDown size={16} className="rotate-180" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveDown(index);
                            }}
                            disabled={index === grades.length - 1}
                            className={`p-2 bg-white border rounded-xl transition-all active:scale-90 ${index === grades.length - 1 ? "text-slate-200 border-slate-100 cursor-not-allowed" : "text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      ) : !isEditing && isSelectionMode ? null : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <Edit size={16} />
                        </div>
                      )}

                      {/* Order & Name */}
                      <div className="flex items-center gap-3 flex-1 w-full">
                        <span className="w-6 h-6 bg-slate-200/60 rounded-full flex items-center justify-center text-[11px] font-black text-slate-500 shrink-0">
                          {index + 1}
                        </span>

                        {isEditing ? (
                          <div
                            className="flex flex-col sm:flex-row gap-3 flex-1 w-full items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative flex-1 w-full">
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                                الاسم:
                              </span>
                              <input
                                type="text"
                                value={tempGradeName}
                                onChange={(e) =>
                                  setTempGradeName(e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 py-2.5 pr-14 pl-3 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm text-slate-800"
                              />
                            </div>
                            <div className="relative w-full sm:w-44">
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                                القسط:
                              </span>
                              <input
                                type="text"
                                value={formatWithCommas(tempGradePrice)}
                                onChange={(e) =>
                                  handleDirectMoneyChange(e, setTempGradePrice)
                                }
                                className="w-full bg-white border border-slate-200 py-2.5 pr-14 pl-12 rounded-xl font-black focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm text-slate-800 text-center font-mono"
                                dir="ltr"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                د.ع
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-800 text-base">
                            {grade}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Default Price / Actions */}
                    <div
                      className="flex items-center gap-4 mt-4 md:mt-0 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(grade)}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <Check size={14} />
                            <span>حفظ تعديل</span>
                          </button>
                          <button
                            onClick={() => setEditingGradeName(null)}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-black rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <X size={14} />
                            <span>إلغاء</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-white border border-slate-100 p-2.5 rounded-xl gap-2 shadow-sm min-w-[12rem]">
                            <span className="text-xs font-black text-slate-400 mr-1">
                              القسط السنوي:
                            </span>
                            <span
                              className="w-24 text-indigo-750 font-black text-sm text-center block"
                              dir="ltr"
                            >
                              {new Intl.NumberFormat("en-US").format(
                                currentPrice,
                              )}
                            </span>
                            <span className="text-[10px] font-black text-slate-300">
                              د.ع
                            </span>
                          </div>

                          {!isSelectionMode && (
                            <>
                              <button
                                onClick={() =>
                                  handleStartEdit(grade, currentPrice)
                                }
                                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all active:scale-90"
                                title="تعديل الصف والمبلغ"
                              >
                                <Edit size={16} />
                              </button>

                              <button
                                onClick={() => handleDeleteGrade(grade)}
                                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-all active:scale-90"
                                title="حذف الصف"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {grades.length === 0 && (
              <div className="py-16 text-center text-slate-400 font-bold space-y-3">
                <ListTree
                  size={48}
                  className="mx-auto text-slate-300 animate-pulse"
                />
                <p className="text-slate-500 font-black">
                  لم يتم إضافة أي صفوف بعد.
                </p>
                <p className="text-xs text-slate-400">
                  استخدم المربع أعلاه لإضافة صفوف للمدرسة.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default GradesManagementSubView;

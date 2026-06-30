/**
 * AcademicYearSelector.tsx — Year selector dropdown for the main header
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, ChevronDown, Check, Plus, Trash2, Edit2, X } from "lucide-react";
import type { AcademicYear } from "@/types";

interface Props {
  activeYear: string;
  academicYears: AcademicYear[];
  onSwitch: (year: string) => void;
  onAdd: (year: AcademicYear) => boolean;
  onEdit: (id: string, updates: Partial<AcademicYear>) => void;
  onDelete: (id: string) => void;
}

const AcademicYearSelector: React.FC<Props> = ({
  activeYear, academicYears, onSwitch, onAdd, onEdit, onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newYearName, setNewYearName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    if (!newYearName.trim()) return;
    const year: AcademicYear = {
      id: Date.now().toString(),
      name: newYearName.trim(),
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const ok = onAdd(year);
    if (ok) { setNewYearName(""); setShowAdd(false); setOpen(false); }
  };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-xs font-black transition-all"
      >
        <Calendar size={14} />
        <span>{activeYear}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-600">السنوات الدراسية</span>
              <button onClick={() => setShowAdd(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus size={12} /> إضافة سنة
              </button>
            </div>

            {/* Year list */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {academicYears.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs font-bold">
                  لا توجد سنوات دراسية — أضف واحدة
                </div>
              ) : (
                academicYears.map(year => (
                  <div key={year.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-colors group ${
                      year.name === activeYear
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    {editingId === year.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                          className="flex-1 text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white"
                          autoFocus />
                        <button onClick={() => { onEdit(year.id, { name: editName }); setEditingId(null); }}
                          className="text-emerald-600 p-1"><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)}
                          className="text-slate-400 p-1"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => { onSwitch(year.name); setOpen(false); }}
                          className="flex items-center gap-2 flex-1 text-right">
                          {year.name === activeYear && (
                            <Check size={14} className="text-blue-600" />
                          )}
                          <span className={`text-xs font-bold ${
                            year.name === activeYear ? "text-blue-700" : "text-slate-700"
                          }`}>{year.name}</span>
                          {year.isActive && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">نشطة</span>
                          )}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingId(year.id); setEditName(year.name); }}
                            className="p-1 text-slate-400 hover:text-amber-500"><Edit2 size={12} /></button>
                          {!year.isActive && (
                            <button onClick={() => onDelete(year.id)}
                              className="p-1 text-slate-400 hover:text-rose-500"><Trash2 size={12} /></button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add new year form */}
            <AnimatePresence>
              {showAdd && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="overflow-hidden border-t border-slate-100">
                  <div className="p-3 space-y-2">
                    <input type="text" placeholder="مثال: 2026-2027" value={newYearName}
                      onChange={e => setNewYearName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAdd()}
                      className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                      autoFocus />
                    <div className="flex gap-2">
                      <button onClick={() => setShowAdd(false)}
                        className="flex-1 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">إلغاء</button>
                      <button onClick={handleAdd}
                        className="flex-1 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">إنشاء</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {open && <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />}
    </div>
  );
};

export default AcademicYearSelector;

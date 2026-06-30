/**
 * TaxesListView.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Search, Users, GraduationCap, ArrowRight, X, Download, Info, Check, Printer, FileSpreadsheet } from "lucide-react";
import type { Student, SystemSettings } from "@/types";
import { formatStudentCode } from "@/utils/format";
import { notify } from "@/utils/notify";
import { printDocument, saveElementAsImage } from "@/utils/print";
import { PAPER_SIZES } from "@/constants";

const TaxesListView = ({
  onBack,
  students,
  schools,
  grades,
  systemSettings,
}: {
  onBack: () => void;
  students: Student[];
  schools: string[];
  grades: string[];
  systemSettings?: SystemSettings;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("جميع المراحل");
  const [selectedSection, setSelectedSection] = useState("جميع الشعب");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reportTitle, setReportTitle] = useState("الضرائب");
  const [blankColumns, setBlankColumns] = useState(3);
  const [customHeaders, setCustomHeaders] = useState("");
  const [showPrint, setShowPrint] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const sections = [...(systemSettings?.sections || ["أ", "ب", "ج"])].sort();
  const paperSize = systemSettings?.printSettings?.statementSize || "A4";
  const stSel = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const paper = PAPER_SIZES.A4; // designed at A4, zoom-fitted on print
  const stZoom = stSel.w / 210;
  const isSmall = false; // design uniformly at A4; print CSS scales to the chosen paper

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm);
    const matchesGrade =
      selectedGrade === "جميع المراحل" || s.grade === selectedGrade;
    const matchesSection =
      selectedSection === "جميع الشعب" || s.section === selectedSection;
    return matchesSearch && matchesGrade && matchesSection;
  });

  const selectedStudents = students.filter((s) => selectedIds.includes(s.id));

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filtered.some((s) => s.id === id))
      );
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...filtered.map((s) => s.id)]))
      );
    }
  };

  const openPrint = () => {
    if (selectedStudents.length === 0) {
      notify("يرجى تحديد طالب واحد على الأقل لطباعة التقرير.", "warning");
      return;
    }
    setShowPrint(true);
  };

  const handleSaveImage = async () => {
    await saveElementAsImage("taxes-report-container", `تقرير_${reportTitle || "الضرائب"}`);
  };

  const currentDateStr = new Date()
    .toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })
    .replace(/[-]/g, "\\");

  const headerLabels = customHeaders
    .split(",")
    .map((h) => h.trim())
    .filter((h) => h.length > 0);
  const totalBlankCols = Math.max(headerLabels.length, blankColumns);

  return (
    <>
      {/* Print Preview Overlay */}
      {showPrint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-md flex flex-col overflow-y-auto"
          dir="rtl"
        >
          {/* Control panel */}
          <div className="sticky top-0 w-full bg-slate-900/90 border-b border-white/10 p-4 md:p-6 z-[130] no-print">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center text-white">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-black text-white">تقرير أسماء الطلاب للطباعة</h2>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">
                    {selectedStudents.length} طالب — حجم الورق: {paperSize} — الباقي يُملأ يدوياً
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printDocument("taxes-report-container", paperSize)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] md:text-xs font-black py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-600/20"
                >
                  <Printer size={14} />
                  <span>طباعة التقرير</span>
                </button>
                <button
                  onClick={handleSaveImage}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] md:text-xs font-black py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Download size={14} />
                  <span>حفظ كصورة</span>
                </button>
                <button
                  onClick={() => setShowPrint(false)}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 text-white transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center py-8 px-4 md:px-8 bg-slate-800/40">
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                html, body { height: auto !important; overflow: visible !important; background-color: white !important; }
                @page { size: ${stSel.w}mm ${stSel.h}mm; margin: 0 !important; }
                #taxes-report-container, #taxes-report-container * { visibility: visible !important; }
                #taxes-report-container {
                  position: absolute !important; right: 0 !important; left: 0 !important; top: 0 !important;
                  transform: none !important; zoom: ${stZoom} !important; width: 210mm !important;
                  margin: 0 auto !important;
                  background-color: white !important; box-shadow: none !important; border: none !important; border-radius: 0 !important;
                }
                .no-print { display: none !important; }
              }
            `}</style>

            <div
              className="w-full flex justify-center pb-24 overflow-x-auto"
              style={{
                transform: "scale(0.8)",
                transformOrigin: "top center",
              }}
            >
              <div
                id="taxes-report-container"
                ref={reportRef}
                dir="rtl"
                style={{
                  width: paper.width,
                  minHeight: "auto",
                  background: "white",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                  padding: paper.padding,
                  margin: "0 auto",
                  boxSizing: "border-box",
                  color: "black",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: paper.fontSize,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isSmall ? "8px" : "24px", marginTop: isSmall ? "2px" : "6px" }}>
                  <div style={{ textAlign: "right", width: "35%", color: "#000", fontWeight: "bold", lineHeight: "1.8" }}>
                    <p>التاريخ: <span style={{ fontFamily: "monospace" }}>{currentDateStr}</span></p>
                    <p>العدد: <span style={{ fontFamily: "monospace" }}>{selectedStudents.length}</span></p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "30%" }}>
                    <div style={{ width: `${paper.logoSize}px`, height: `${paper.logoSize}px`, borderRadius: "50%", border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", backgroundColor: "#fff" }}>
                      {systemSettings?.schoolLogo ? (
                        <img src={systemSettings.schoolLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} referrerPolicy="no-referrer" />
                      ) : (
                        <GraduationCap size={paper.logoSize * 0.4} />
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", width: "35%", color: "#000", lineHeight: "1.6" }}>
                    <h2 style={{ fontSize: paper.titleSize, fontWeight: 900, margin: 0 }}>{systemSettings?.schoolName || "مدرسة المختار الابتدائية"}</h2>
                    <p style={{ fontSize: isSmall ? "7px" : "12px", fontWeight: "bold", color: "#4b5563", marginTop: "4px" }}>الأهلية</p>
                  </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: "center", margin: isSmall ? "6px 0" : "16px 0" }}>
                  <h3 style={{ fontSize: paper.titleSize, fontWeight: 900, color: "#000", borderBottom: "3px solid #000", display: "inline-block", paddingBottom: "4px" }}>
                    {reportTitle || "تقرير"}
                  </h3>
                </div>

                {/* Names table */}
                <table style={{ width: "100%", textAlign: "right", borderCollapse: "collapse", border: "1px solid #000", fontSize: paper.fontSize, marginTop: isSmall ? "6px" : "16px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#fff", border: "1px solid #000", fontWeight: 900 }}>
                      <th style={{ border: "1px solid #000", padding: isSmall ? "2px" : "8px", textAlign: "center", width: "8%" }}>ت</th>
                      <th style={{ border: "1px solid #000", padding: isSmall ? "2px" : "8px", textAlign: "right", width: totalBlankCols > 0 ? "42%" : "92%" }}>اسم الطالب</th>
                      {Array.from({ length: totalBlankCols }).map((_, i) => (
                        <th
                          key={i}
                          style={{
                            border: "1px solid #000",
                            padding: isSmall ? "2px" : "8px",
                            textAlign: "center",
                            width: `${50 / totalBlankCols}%`,
                          }}
                        >
                          {headerLabels[i] || ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudents.map((s, idx) => (
                      <tr key={s.id} style={{ border: "1px solid #000", textAlign: "center" }}>
                        <td style={{ border: "1px solid #000", padding: isSmall ? "3px" : "10px", fontFamily: "monospace", fontWeight: "bold" }}>{idx + 1}</td>
                        <td style={{ border: "1px solid #000", padding: isSmall ? "3px" : "10px", textAlign: "right", fontWeight: 900 }}>{s.name}</td>
                        {Array.from({ length: totalBlankCols }).map((_, i) => (
                          <td key={i} style={{ border: "1px solid #000", padding: isSmall ? "3px" : "10px" }}>&nbsp;</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: isSmall ? "6px" : "9px", fontWeight: "bold", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: isSmall ? "4px" : "12px", marginTop: isSmall ? "8px" : "32px", paddingBottom: "4px" }}>
                  <span>نظام إدارة المدارس الرقمية</span>
                  <span>{reportTitle || "تقرير الأسماء"}</span>
                  <span>{systemSettings?.schoolName || "مدارس المختار الأهلية"}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(circle at top right, #ecfeff, #f0f9ff)" }}
        dir="rtl"
      >
        {/* ── Modern light header ──────────────────────────── */}
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
                <FileSpreadsheet size={18} />
              </motion.div>
              <div>
                <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">تقرير الضرائب وأسماء الطلاب</h1>
                <p className="text-[10px] font-bold text-slate-400">{selectedStudents.length} طالب محدد من إجمالي {filtered.length}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={openPrint}
              disabled={selectedStudents.length === 0}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-white text-xs font-black shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" }}
            >
              <Printer size={14} strokeWidth={3} />
              <span className="hidden sm:inline">طباعة المحدد ({selectedStudents.length})</span>
              <span className="sm:hidden">{selectedStudents.length}</span>
            </motion.button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-5">
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
                اختر الطلاب من القائمة ثم اطبع التقرير. سيظهر في التقرير <span className="text-cyan-700 font-black">اسم الطالب فقط</span> مع أعمدة فارغة لتعبئة بقية البيانات يدوياً بعد الطباعة.
              </p>
            </motion.div>

            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-2 pr-1"
            >
              <div className="w-1.5 h-5 bg-cyan-500 rounded-full" />
              <h2 className="text-sm font-black text-slate-700">خيارات التقرير</h2>
              <span className="text-[10px] font-bold text-slate-400">— خصص العنوان والأعمدة</span>
            </motion.div>

            {/* Report options */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest">عنوان التقرير</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="مثال: الضرائب"
                  className="w-full bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-200 focus:bg-white transition-all text-right"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest">عدد الأعمدة الفارغة</label>
                <select
                  value={blankColumns}
                  onChange={(e) => setBlankColumns(Number(e.target.value))}
                  className="w-full bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-200 focus:bg-white transition-all"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest">عناوين الأعمدة (اختياري)</label>
                <input
                  type="text"
                  value={customHeaders}
                  onChange={(e) => setCustomHeaders(e.target.value)}
                  placeholder="افصل بينها بفاصلة، أو اتركها فارغة"
                  className="w-full bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-200 focus:bg-white transition-all text-right"
                />
              </div>
            </motion.div>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب أو رقم الطالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 py-4 pr-14 pl-6 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-cyan-100 transition-all font-bold"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest">المرحلة الدراسية</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full bg-slate-50 py-3 px-5 rounded-xl border border-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  >
                    <option>جميع المراحل</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-1 uppercase tracking-widest">الشعبة</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full bg-slate-50 py-3 px-5 rounded-xl border border-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  >
                    <option>جميع الشعب</option>
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px] bg-cyan-600 text-white p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users size={22} />
                  <span className="font-black text-sm">المعروضون</span>
                </div>
                <span className="text-2xl font-black">{filtered.length}</span>
              </div>
              <div className="flex-1 min-w-[150px] bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check size={22} />
                  <span className="font-black text-sm">المحددون</span>
                </div>
                <span className="text-2xl font-black">{selectedStudents.length}</span>
              </div>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-xs hover:bg-rose-100 transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  مسح التحديد
                </button>
              )}
            </div>

            {/* Students list */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 text-xs font-black border-b-2 border-slate-200">
                      <th className="py-4 px-4 text-center w-12">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded cursor-pointer accent-cyan-600"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="py-4 px-4 text-center">كود الطالب</th>
                      <th className="py-4 px-4">اسم الطالب</th>
                      <th className="py-4 px-4">المرحلة / الشعبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400 font-bold">
                          لا يوجد طلاب مطابقون للفلاتر المحددة.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((s) => {
                        const isSelected = selectedIds.includes(s.id);
                        return (
                          <tr
                            key={s.id}
                            onClick={() => toggleStudent(s.id)}
                            className={`cursor-pointer transition-colors text-sm font-bold ${
                              isSelected ? "bg-cyan-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded cursor-pointer accent-cyan-600"
                                checked={isSelected}
                                onChange={() => toggleStudent(s.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">
                              #{formatStudentCode(s.id)}
                            </td>
                            <td className="py-3 px-4 text-slate-800 font-black">{s.name}</td>
                            <td className="py-3 px-4 text-slate-600">{s.grade} / {s.section}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default TaxesListView;

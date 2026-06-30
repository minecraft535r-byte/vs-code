/**
 * StudentAccountStatementModal.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React from "react";
import { motion } from "motion/react";
import { FileText, X, Download, School, Printer } from "lucide-react";
import type { Student, PrintSettings } from "@/types";
import { formatStudentCode } from "@/utils/format";
import { printDocument, saveElementAsImage } from "@/utils/print";

const StudentAccountStatementModal = ({
  student,
  students,
  onClose,
  systemSettings,
}: {
  student?: Student;
  students?: Student[];
  onClose: () => void;
  systemSettings?: {
    schoolName: string;
    schoolLogo: string | null;
    academicYear?: string;
    printSettings?: PrintSettings;
  };
}) => {
  // Normalize to array
  const list: Student[] = students && students.length > 0
    ? students
    : (student ? [student] : []);

  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  const fmtBackslashDate = (d: string) => {
    if (!d) return "";
    const clean = d.split("T")[0];
    const p = clean.split(/[-/]/);
    return p.length === 3 ? `${p[0]}\\${+p[1]}\\${+p[2]}` : d;
  };
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}\\${d.getMonth() + 1}\\${d.getDate()}`;
  })();
  const nowTime = (() => {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const am = h < 12 ? "ص" : "م";
    h = h % 12 || 12;
    return `${h}:${m} ${am}`;
  })();

  const schoolName = systemSettings?.schoolName || "مدارس المختار الأهلية";
  const schoolLogo = systemSettings?.schoolLogo || null;
  const academicYear = systemSettings?.academicYear || "";

  // Build pairs of students: each pair fills one A4 page (top + bottom)
  const pages: Student[][] = [];
  for (let i = 0; i < list.length; i += 2) {
    pages.push(list.slice(i, i + 2));
  }

  // Render one half-page (210mm wide × 144mm tall — fits 2 per A4 with safety margin)
  const renderHalfPage = (s: Student, halfIndex: "top" | "bottom", pageIdx: number, pairIdx: number) => {
    const paid = (s.payments || []).filter((p: any) => !p.isWithdrawn).reduce((a, p) => a + p.amount, 0);
    const net = s.tuition - (s.discount || 0);
    const remaining = Math.max(0, net - paid);
    const rid = formatStudentCode(s.id);
    // Display at most 5 payments to fit in compact half-A4
    const paymentsToShow = (s.payments || []).slice(0, 5);
    const hasMorePayments = (s.payments?.length || 0) > 5;

    return (
      <div
        key={`${pageIdx}-${halfIndex}`}
        className="statement-half"
        style={{
          width: "210mm",
          height: "144mm",
          padding: "7mm 10mm",
          boxSizing: "border-box",
          background: "white",
          color: "#000",
          fontFamily: "'Cairo', system-ui, sans-serif",
          fontSize: "10px",
          lineHeight: 1.4,
          display: "flex",
          flexDirection: "column",
          borderBottom: halfIndex === "top" ? "1px dashed #94a3b8" : "none",
          pageBreakAfter: halfIndex === "bottom" ? "always" : "auto",
          pageBreakInside: "avoid",
        }}
      >
        {/* Header row: school name + title + date */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "4mm",
          borderBottom: "2px solid #000",
          gap: "6mm",
        }}>
          {/* Right: School block */}
          <div style={{ display: "flex", alignItems: "center", gap: "3mm", flex: 1 }}>
            {schoolLogo && (
              <div style={{ width: "14mm", height: "14mm", borderRadius: "50%", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "1mm", flexShrink: 0 }}>
                <img src={schoolLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 900 }}>{schoolName}</div>
              {academicYear && <div style={{ fontSize: "9px", color: "#444", fontWeight: 600 }}>السنة الدراسية {academicYear}</div>}
            </div>
          </div>

          {/* Middle: Title */}
          <div style={{
            fontSize: "14px",
            fontWeight: 900,
            textAlign: "center",
            border: "2px solid #000",
            padding: "1.5mm 5mm",
            letterSpacing: "1px",
            background: "#fff",
            flexShrink: 0,
          }}>
            كشف حساب الطالب
          </div>

          {/* Left: Date/Time */}
          <div style={{ textAlign: "left", fontSize: "9px", flex: 1, lineHeight: 1.6 }}>
            <div><b>التاريخ:</b> <span style={{ fontFamily: "monospace", direction: "ltr", display: "inline-block" }}>{today}</span></div>
            <div><b>الساعة:</b> <span style={{ fontFamily: "monospace", direction: "ltr", display: "inline-block" }}>{nowTime}</span></div>
            <div><b>كود الطالب:</b> <span style={{ fontFamily: "monospace", direction: "ltr", display: "inline-block" }}>#{rid}</span></div>
          </div>
        </div>

        {/* Student info bar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          marginTop: "3mm",
          border: "1px solid #000",
          fontSize: "10px",
        }}>
          {[
            { label: "اسم الطالب", value: s.name },
            { label: "المرحلة", value: s.grade || "—" },
            { label: "الشعبة", value: s.section || "—" },
            { label: "المدرسة", value: s.school || schoolName },
          ].map((it, i) => (
            <div key={i} style={{
              borderLeft: i < 3 ? "1px solid #000" : "none",
              padding: "1.5mm 2mm",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "8px", color: "#555", fontWeight: 700 }}>{it.label}</div>
              <div style={{ fontWeight: 900, marginTop: "0.5mm" }}>{it.value}</div>
            </div>
          ))}
        </div>

        {/* Summary 4 financial boxes */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          marginTop: "3mm",
          border: "1px solid #000",
          fontSize: "10px",
        }}>
          {[
            { label: "القسط الكلي", value: fmt(s.tuition), color: "#000" },
            { label: "الخصم", value: fmt(s.discount || 0), color: "#9333ea" },
            { label: "المدفوع", value: fmt(paid), color: "#16a34a" },
            { label: "الباقي", value: fmt(remaining), color: remaining > 0 ? "#dc2626" : "#16a34a" },
          ].map((it, i) => (
            <div key={i} style={{
              borderLeft: i < 3 ? "1px solid #000" : "none",
              padding: "2mm",
              textAlign: "center",
              background: "#fafafa",
            }}>
              <div style={{ fontSize: "8px", color: "#555", fontWeight: 700, marginBottom: "1mm" }}>{it.label}</div>
              <div style={{ fontWeight: 900, fontSize: "12px", fontFamily: "monospace", color: it.color }}>{it.value}</div>
            </div>
          ))}
        </div>

        {/* Payments table */}
        <div style={{ marginTop: "3mm", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div style={{ fontSize: "10px", fontWeight: 900, marginBottom: "1mm" }}>سجل الوصولات والدفعات</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ border: "1px solid #000", padding: "1mm 1.5mm", width: "8%", textAlign: "center" }}>ت</th>
                <th style={{ border: "1px solid #000", padding: "1mm 1.5mm", width: "22%", textAlign: "center" }}>رقم الوصل</th>
                <th style={{ border: "1px solid #000", padding: "1mm 1.5mm", width: "25%", textAlign: "center" }}>القيمة (د.ع)</th>
                <th style={{ border: "1px solid #000", padding: "1mm 1.5mm", width: "20%", textAlign: "center" }}>تاريخ الوصل</th>
                <th style={{ border: "1px solid #000", padding: "1mm 1.5mm", width: "25%", textAlign: "right" }}>الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {paymentsToShow.length === 0 ? (
                <tr><td colSpan={5} style={{ border: "1px solid #000", padding: "5mm", textAlign: "center", fontWeight: 700, color: "#888" }}>
                  لا توجد دفعات مسجلة حتى الآن.
                </td></tr>
              ) : (
                paymentsToShow.map((p, i) => (
                  <tr key={p.id || i}>
                    <td style={{ border: "1px solid #000", padding: "1mm 1.5mm", textAlign: "center", fontFamily: "monospace" }}>{i + 1}</td>
                    <td style={{ border: "1px solid #000", padding: "1mm 1.5mm", textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}>
                      #{/^\d+$/.test(String(p.id)) ? String(p.id).padStart(4, "0") : p.id}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "1mm 1.5mm", textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}>{fmt(p.amount)}</td>
                    <td style={{ border: "1px solid #000", padding: "1mm 1.5mm", textAlign: "center", fontFamily: "monospace" }}>{fmtBackslashDate(p.date)}</td>
                    <td style={{ border: "1px solid #000", padding: "1mm 1.5mm", textAlign: "right", color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 0 }}>{p.notes || "—"}</td>
                  </tr>
                ))
              )}
              {hasMorePayments && (
                <tr><td colSpan={5} style={{ border: "1px solid #000", padding: "1mm", textAlign: "center", fontSize: "8px", fontWeight: 700, color: "#dc2626" }}>
                  ⚠ يوجد {(s.payments?.length || 0) - 5} دفعات إضافية لم تُعرض — راجع كشف الحساب التفصيلي
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "2mm",
          paddingTop: "2mm",
          borderTop: "1px solid #999",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8px",
          color: "#555",
          fontWeight: 700,
          flexShrink: 0,
        }}>
          <span>توقيع المحاسب: ............</span>
          <span>كشف حساب الطالب</span>
          <span>{schoolName}</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-md flex flex-col overflow-y-auto"
      dir="rtl"
    >
      {/* Control Panel */}
      <div className="sticky top-0 w-full bg-slate-900/90 border-b border-white/10 p-4 z-[130] no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black text-white">
                {list.length === 1 ? "كشف حساب الطالب" : `كشف حساب ${list.length} طلاب`}
              </h2>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">
                {list.length === 1
                  ? "نصف ورقة A4 — مساحة لطالب آخر بالأسفل"
                  : `${pages.length} صفحة A4 (طالبان لكل صفحة)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printDocument("statement-print-container", "A4")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] md:text-xs font-black py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Printer size={14} />
              <span>طباعة الكشف</span>
            </button>
            <button
              onClick={() => {
                const fname = list.length === 1
                  ? `كشف_حساب_${list[0]?.name || "طالب"}`
                  : `كشوف_حسابات_${list.length}_طلاب`;
                saveElementAsImage("statement-print-container", fname);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] md:text-xs font-black py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Download size={14} />
              <span>حفظ كصورة</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 text-white transition-all active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Print area */}
      <div className="flex-1 flex justify-center py-6 px-2 md:px-6">
        <style>{`
          @media print {
            @page { size: A4; margin: 0; }
            body * { visibility: hidden !important; }
            #statement-print-container, #statement-print-container * { visibility: visible !important; }
            #statement-print-container {
              position: absolute !important;
              left: 0; top: 0;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              transform: none !important;
            }
            .statement-page {
              page-break-after: always;
              page-break-inside: avoid;
            }
          }
          .statement-preview-zoom {
            transform-origin: top center;
          }
          @media (max-width: 1100px) { .statement-preview-zoom { transform: scale(0.8); } }
          @media (max-width: 900px)  { .statement-preview-zoom { transform: scale(0.65); } }
          @media (max-width: 700px)  { .statement-preview-zoom { transform: scale(0.5); } }
          @media (max-width: 500px)  { .statement-preview-zoom { transform: scale(0.38); } }
        `}</style>

        <div className="statement-preview-zoom">
          <div
            id="statement-print-container"
            className="bg-transparent"
            dir="rtl"
            style={{ width: "210mm" }}
          >
            {pages.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-500 font-bold">
                لا يوجد طلاب لعرض كشوف حساباتهم.
              </div>
            ) : pages.map((pair, pageIdx) => (
              <div
                key={pageIdx}
                className="statement-page bg-white shadow-2xl rounded-lg mb-6"
                style={{ width: "210mm", height: "297mm", display: "flex", flexDirection: "column", overflow: "hidden" }}
              >
                {/* Top half */}
                {renderHalfPage(pair[0], "top", pageIdx, 0)}
                {/* Bottom half: either the second student or empty */}
                {pair[1] ? (
                  renderHalfPage(pair[1], "bottom", pageIdx, 1)
                ) : (
                  <div style={{ width: "210mm", height: "144mm", padding: "8mm", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: "11px", fontWeight: 700, borderTop: "1px dashed #94a3b8" }}>
                    <span>هذه المساحة فارغة — تتسع لكشف حساب طالب إضافي</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// وصل قبض — ثلاثة تصاميم مستقلة حسب حجم الورق
// ─────────────────────────────────────────────────────────────────────────────

export default StudentAccountStatementModal;

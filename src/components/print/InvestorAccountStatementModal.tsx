/**
 * InvestorAccountStatementModal.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useRef } from "react";
import { motion } from "motion/react";
import { FileText, GraduationCap, X, Download, Printer } from "lucide-react";
import { Area } from "recharts";
import type { SystemSettings } from "@/types";
import type { Investor } from "@/types";
import { printDocument, saveElementAsImage } from "@/utils/print";
import { PAPER_SIZES } from "@/constants";

const InvestorAccountStatementModal = ({
  investor,
  netProfit,
  onClose,
  systemSettings,
}: {
  investor: Investor;
  netProfit: number;
  onClose: () => void;
  systemSettings?: SystemSettings;
}) => {
  const statementPageRef = useRef<HTMLDivElement>(null);

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const formatBackslashDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.includes("-") ? dateStr.split("-") : dateStr.split("/");
      if (parts.length === 3) {
        return `${parts[0]}\\${parseInt(parts[1], 10)}\\${parseInt(parts[2], 10)}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const handleSaveImage = async () => {
    await saveElementAsImage("investor-statement-print-container", `كشف_حساب_مستثمر_${investor.name}`);
  };

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).replace(/[-]/g, "\\");

  const currentTimeStr = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const totalShare = (netProfit * investor.percentage) / 100;
  const totalPaid = (investor.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const remaining = totalShare - totalPaid;

  const paperSize = systemSettings?.printSettings?.statementSize || "A4";
  const stSel = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const paper = PAPER_SIZES.A4; // designed at A4, zoom-fitted on print
  const stZoom = stSel.w / 210;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-md flex flex-col overflow-y-auto"
      dir="rtl"
    >
      {/* Top Control Panel */}
      <div className="sticky top-0 w-full bg-slate-900/90 border-b border-white/10 p-4 md:p-6 z-[130] no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black text-white">كشف حساب المستثمر للطباعة</h2>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">سيُطبع بحجم ورق: <span className="text-amber-300 font-black">{paperSize}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printDocument("investor-statement-print-container", paperSize)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] md:text-xs font-black py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-600/20"
            >
              <Printer size={14} />
              <span>طباعة الكشف</span>
            </button>
            <button
              onClick={handleSaveImage}
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

      {/* Printable Area Wrapper */}
      <div className="flex-1 flex justify-center py-8 px-4 md:px-8 bg-slate-800/40">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            html, body { height: auto !important; overflow: visible !important; background-color: white !important; }
            @page { size: ${stSel.w}mm ${stSel.h}mm; margin: 0 !important; }
            #investor-statement-print-container, #investor-statement-print-container * { visibility: visible !important; }
            #investor-statement-print-container {
              position: absolute !important; right: 0 !important; left: 0 !important; top: 0 !important;
              transform: none !important; zoom: ${stZoom} !important; width: 210mm !important;
              margin: 0 auto !important;
              background-color: white !important; box-shadow: none !important; border: none !important; border-radius: 0 !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>

        <div className="w-full flex justify-center pb-24 overflow-x-auto" style={{ transform: "scale(0.8)", transformOrigin: "top center" }}>
          <div
            id="investor-statement-print-container"
            ref={statementPageRef}
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
            }}
          >
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px", marginTop: "10px" }}>
                <div style={{ textAlign: "right", width: "35%", color: "#000", fontWeight: "bold", fontSize: paper.fontSize, lineHeight: "1.8" }}>
                  <p>التاريخ: <span style={{ fontFamily: "monospace" }}>{currentDateStr}</span></p>
                  <p>الساعة: <span style={{ fontFamily: "monospace" }}>{currentTimeStr}</span></p>
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
                  <p style={{ fontSize: "12px", fontWeight: "bold", color: "#4b5563", marginTop: "4px" }}>الأهلية</p>
                </div>
              </div>

              {/* Title */}
              <div style={{ textAlign: "center", margin: "20px 0" }}>
                <h3 style={{ fontSize: paper.titleSize, fontWeight: 900, color: "#000", borderBottom: "3px solid #000", display: "inline-block", paddingBottom: "4px" }}>
                  كشف حساب المستثمر: {investor.name}
                </h3>
              </div>

              {/* Summary Tables */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", margin: "20px 0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", textAlign: "center", fontWeight: "bold", fontSize: paper.fontSize }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #000" }}>
                      <td style={{ borderLeft: "1px solid #000", padding: "8px", fontWeight: 900 }}>النسبة المئوية</td>
                      <td style={{ padding: "8px", fontFamily: "monospace" }}>{investor.percentage}%</td>
                    </tr>
                    <tr>
                      <td style={{ borderLeft: "1px solid #000", padding: "8px", fontWeight: 900 }}>إجمالي الحصة</td>
                      <td style={{ padding: "8px", fontFamily: "monospace" }}>{formatIQD(totalShare)}</td>
                    </tr>
                  </tbody>
                </table>
                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", textAlign: "center", fontWeight: "bold", fontSize: paper.fontSize }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #000" }}>
                      <td style={{ borderLeft: "1px solid #000", padding: "8px", fontWeight: 900 }}>المبالغ المسحوبة</td>
                      <td style={{ padding: "8px", fontFamily: "monospace" }}>{formatIQD(totalPaid)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderLeft: "1px solid #000", padding: "8px", fontWeight: 900 }}>المتبقي</td>
                      <td style={{ padding: "8px", fontFamily: "monospace", color: remaining < 0 ? "#dc2626" : "#059669", fontWeight: 900 }}>{formatIQD(remaining)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payments Table */}
              <div style={{ marginTop: "24px" }}>
                <table style={{ width: "100%", textAlign: "right", borderCollapse: "collapse", border: "1px solid #000", fontSize: paper.fontSize }}>
                  <thead>
                    <tr style={{ backgroundColor: "#fff", border: "1px solid #000", fontWeight: 900 }}>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", width: "8%" }}>ت</th>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", width: "20%" }}>رقم الوصل</th>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", width: "24%" }}>المبلغ المدفوع</th>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", width: "22%" }}>التاريخ</th>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "right", width: "26%" }}>الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!investor.payments || investor.payments.length === 0) ? (
                      <tr>
                        <td colSpan={5} style={{ border: "1px solid #000", padding: "20px", textAlign: "center", fontWeight: 900, color: "#94a3b8" }}>
                          لا توجد مسحوبات مسجلة لهذا المستثمر بعد.
                        </td>
                      </tr>
                    ) : (
                      investor.payments.map((p, idx) => (
                        <tr key={p.id || idx} style={{ border: "1px solid #000", textAlign: "center" }}>
                          <td style={{ border: "1px solid #000", padding: "6px", fontFamily: "monospace", fontWeight: "bold" }}>{idx + 1}</td>
                          <td style={{ border: "1px solid #000", padding: "6px", fontFamily: "monospace", fontWeight: 900, color: "#2563eb" }}>
                            #{String(p.receiptNo || p.id).padStart(4, "0")}
                          </td>
                          <td style={{ border: "1px solid #000", padding: "6px", fontFamily: "monospace", fontWeight: 900 }}>{formatIQD(p.amount)}</td>
                          <td style={{ border: "1px solid #000", padding: "6px", fontFamily: "monospace", fontWeight: "bold" }}>{formatBackslashDate(p.date)}</td>
                          <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: 600, color: "#64748b" }}>{p.notes || "لا توجد ملاحظات"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: "bold", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "40px", paddingBottom: "4px" }}>
              <span>نظام إدارة المدارس الرقمية</span>
              <span>كشف حساب مستثمر</span>
              <span>{systemSettings?.schoolName || "مدارس المختار الأهلية"}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default InvestorAccountStatementModal;

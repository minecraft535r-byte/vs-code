/**
 * PrintReport.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useEffect } from "react";
import { Lock, GraduationCap, ArrowRight, Download } from "lucide-react";
import type { SystemSettings } from "@/types";
import type { PrintCol, PrintTotals } from "@/types";

const PrintReport = ({
  title, subtitle, columns, rows, totals, systemSettings, onClose, filterInfo,
}: {
  title: string;
  subtitle?: string;
  columns: PrintCol[];
  rows: Record<string,any>[];
  totals?: PrintTotals;
  systemSettings?: SystemSettings;
  onClose: () => void;
  filterInfo?: string;
}) => {
  const isSummaryReport = rows.length <= 15;
  const PAGE_ROWS = isSummaryReport ? 50 : 28;
  const today = new Date().toLocaleDateString("ar-IQ", { year:"numeric", month:"long", day:"numeric" });
  const totalPages = Math.ceil(rows.length / PAGE_ROWS) || 1;
  const fmt = (v: any) => v == null ? "—" : String(v);
  // Font sizes: larger for summary reports (vault), normal for lists
  const FS_HEADER = isSummaryReport ? 18 : 15;
  const FS_SUB = isSummaryReport ? 13 : 11;
  const FS_TH = isSummaryReport ? 13 : 11;
  const FS_TD = isSummaryReport ? 14 : 12;
  const ROW_PAD = isSummaryReport ? "10px 12px" : "6px 8px";
  const TH_PAD = isSummaryReport ? "9px 12px" : "6px 8px";

  // Lock body scroll when print report is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[9000] bg-slate-100 flex flex-col" dir="rtl"
      style={{ isolation: "isolate" }}>
      {/* Toolbar */}
      <div className="no-print bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm">
            <ArrowRight size={18}/> رجوع
          </button>
          <span className="text-slate-300">|</span>
          <span className="font-black text-slate-800 text-sm">{title}</span>
          {filterInfo && <span className="text-xs text-slate-400 hidden md:inline">— {filterInfo}</span>}
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">{rows.length} سجل</span>
        </div>
        <button onClick={()=>window.print()}
          className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-slate-900 transition-colors">
          <Download size={15}/> طباعة / حفظ PDF
        </button>
      </div>

      {/* Scrollable A4 pages */}
      <div className="flex-1 overflow-y-auto">
        <div className="print-document py-6 px-4 flex flex-col items-center gap-6">
          {Array.from({ length: totalPages }, (_, pi) => {
            const pageRows = rows.slice(pi * PAGE_ROWS, pi * PAGE_ROWS + PAGE_ROWS);
            const isLast = pi === totalPages - 1;
            return (
              <div key={pi} className="a4-page bg-white shadow-md border border-slate-200"
                style={{ width:"210mm", minHeight:"297mm", padding:"15mm 12mm", boxSizing:"border-box",
                         pageBreakAfter: isLast ? "auto" : "always", fontFamily:"Cairo,sans-serif",
                         position:"relative", flexShrink:0 }}>
                {/* Page header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                              marginBottom:"8mm", borderBottom:"2.5px solid #1e293b", paddingBottom:"5mm" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    {systemSettings?.schoolLogo
                      ? <img src={systemSettings.schoolLogo} alt="" style={{ width:60,height:60,objectFit:"contain"}}/>
                      : <div style={{ width:60,height:60,background:"#1d4ed8",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center" }}>
                          <GraduationCap color="white" size={28}/>
                        </div>}
                    <div>
                      <div style={{ fontSize:FS_HEADER,fontWeight:900,color:"#0f172a" }}>{systemSettings?.schoolName||"مدارس مرتضى"}</div>
                      <div style={{ fontSize:FS_SUB,color:"#64748b",marginTop:3 }}>{title}{subtitle?" — "+subtitle:""}</div>
                      {filterInfo && <div style={{ fontSize:FS_SUB-2,color:"#94a3b8",marginTop:2 }}>{filterInfo}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign:"left",fontSize:FS_SUB,color:"#64748b",lineHeight:1.8 }}>
                    <div>التاريخ: {today}</div>
                    <div>عدد السجلات: <strong>{rows.length}</strong></div>
                    <div>صفحة {pi+1} من {totalPages}</div>
                  </div>
                </div>

                {/* Table */}
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:FS_TD }}>
                  <thead>
                    <tr style={{ background:"#1e293b", color:"white" }}>
                      <th style={{ padding:TH_PAD, textAlign:"center", width:"5%", fontWeight:700, fontSize:FS_TH }}>#</th>
                      {columns.map((col,i)=>(
                        <th key={i} style={{ padding:TH_PAD, textAlign:col.align||"right", width:col.width, fontWeight:700, fontSize:FS_TH }}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, i) => (
                      <tr key={i} style={{ background:i%2===0?"#fff":"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
                        <td style={{ padding:ROW_PAD, textAlign:"center", color:"#94a3b8", fontSize:FS_TD-1 }}>{pi*PAGE_ROWS+i+1}</td>
                        {columns.map((col,j)=>(
                          <td key={j} style={{ padding:ROW_PAD, textAlign:col.align||"right",
                            color: row.__colors?.[col.key] || "#1e293b",
                            fontWeight: row.__bold?.[col.key] ? 700 : 500,
                            fontSize: FS_TD }}>
                            {fmt(row[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals on last page */}
                  {isLast && totals && (
                    <tfoot>
                      <tr style={{ background:"#1e293b", color:"white", fontWeight:700 }}>
                        <td style={{ padding:TH_PAD, textAlign:"center", fontSize:FS_TH }}>الإجمالي</td>
                        {columns.map((col,i)=>(
                          <td key={i} style={{ padding:TH_PAD, textAlign:col.align||"right", fontSize:FS_TH }}>
                            {totals[col.key] != null ? String(totals[col.key]) : ""}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Footer */}
                <div style={{ position:"absolute", bottom:"10mm", left:"12mm", right:"12mm",
                  fontSize:9, color:"#94a3b8", textAlign:"center", borderTop:"1px solid #e2e8f0", paddingTop:5 }}>
                  نظام إدارة مدارس مرتضى — جميع الأرقام بالدينار العراقي
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media print {
          .no-print{display:none!important}
          body{background:white!important;margin:0!important;overflow:visible!important}
          .print-document{padding:0!important;gap:0!important;display:block!important}
          .a4-page{box-shadow:none!important;border:none!important;margin:0!important;min-height:auto!important}
        }
      `}</style>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// ALL STUDENTS ACCOUNT STATEMENT — A4 printable
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// ALL STUDENTS STATEMENT — بيانات حسابات الطلبة
// ══════════════════════════════════════════════════════════════

export default PrintReport;

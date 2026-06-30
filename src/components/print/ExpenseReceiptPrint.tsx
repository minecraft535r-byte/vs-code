/**
 * ExpenseReceiptPrint.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React from "react";
import { Settings, GraduationCap, School } from "lucide-react";
import type { Expense, PrintSettings } from "@/types";
import { printPaperCSS } from "@/utils/print";
import { PAPER_SIZES } from "@/constants";
import { getStoredSettings } from "@/utils/print";

const ExpenseReceiptPrint = ({
  expense,
  systemSettings: settingsProp,
}: {
  expense: Expense;
  systemSettings?: {
    schoolName: string;
    schoolLogo: string | null;
    academicYear?: string;
    printSettings?: PrintSettings;
  };
}) => {
  // Settings priority: prop (if provided) > current user's scoped localStorage
  const settings = settingsProp ?? getStoredSettings();

  const schoolName = settings?.schoolName || expense.school || "مدارس المختار الابتدائية";
  const schoolLogo = settings?.schoolLogo || null;
  const paperSize: string = settings?.printSettings?.receiptSize || "A4";

  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  const getTime = () => {
    const n = new Date(); let h = n.getHours();
    const m = n.getMinutes().toString().padStart(2, "0");
    h = h % 12 || 12; return `${h}:${m}`;
  };
  const getDate = () => {
    const raw = expense.paymentDate || expense.date || new Date().toISOString().split("T")[0];
    const clean = raw.split("T")[0];
    const p = clean.split(/[-/]/);
    return p.length === 3 ? `${p[0]}/${+p[1]}/${+p[2]}` : raw;
  };
  const rid = expense.receiptNo || (/^\d+$/.test(String(expense.id)) ? String(expense.id).padStart(4, "0") : expense.id);

  // ════════════════════════════════════════════════════════════════════════
  // تصميم A4 — كامل مع التفاصيل والتوقيعات
  // ════════════════════════════════════════════════════════════════════════
  if (paperSize === "A4") {
    return (
      <div id="expense-receipt-to-print" dir="rtl" style={{ backgroundColor: "#ffffff", color: "#000000", padding: "15mm", width: "210mm", margin: "0 auto", border: "1px solid #000000", boxSizing: "border-box", fontFamily: "'Cairo', system-ui, sans-serif" }}>
        <style dangerouslySetInnerHTML={{ __html: printPaperCSS("A4", "#expense-receipt-to-print") }} />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", marginTop: "8px" }}>
          <div style={{ textAlign: "right", lineHeight: "1.9", width: "35%", fontWeight: "bold", fontSize: "14px" }}>
            <div>رقم الوصل: {rid}</div>
            <div>التاريخ: {getDate()}</div>
            <div>الساعة: {getTime()}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", width: "30%" }}>
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", border: "1px solid #000", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}>
              {schoolLogo
                ? <img src={schoolLogo} alt="logo" style={{ maxWidth: "80px", maxHeight: "80px", objectFit: "contain" }} />
                : <GraduationCap size={40} />}
            </div>
          </div>
          <div style={{ textAlign: "right", width: "35%" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0, lineHeight: "1.4" }}>{schoolName}</h2>
            <div style={{ fontSize: "14px", fontWeight: "bold", marginTop: "4px", color: "#555" }}>الأهلية</div>
          </div>
        </div>

        {/* ── Title ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", margin: "22px 0" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#000000", margin: 0, textDecoration: "underline", textUnderlineOffset: "8px" }}>
            صرف مبلغ
          </h1>
        </div>

        {/* ── Statement ──────────────────────────────────────────────── */}
        <div style={{ textAlign: "right", fontSize: "17px", fontWeight: "bold", lineHeight: "2.2", paddingRight: "8px", marginBottom: "24px" }}>
          تم صرف مبلغ ( <span style={{ fontSize: "20px", fontWeight: 900, fontFamily: "monospace" }}>{fmt(expense.amount)}</span> ) بتاريخ ( <span style={{ fontWeight: 900 }}>{getDate()}</span> ) وفي ما يلي التفاصيل
        </div>

        {/* ── Details ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px", paddingRight: "8px" }}>
          <div style={{ display: "flex", gap: "12px", fontSize: "17px", fontWeight: "bold" }}>
            <span style={{ minWidth: "130px" }}>باب الصرف :</span>
            <span style={{ fontWeight: 900 }}>{expense.type}</span>
          </div>
          <div style={{ display: "flex", gap: "12px", fontSize: "17px", fontWeight: "bold" }}>
            <span style={{ minWidth: "130px" }}>اسم المستلم :</span>
            <span style={{ fontWeight: 900 }}>{expense.receiver || "غير محدد"}</span>
          </div>
          {expense.title && expense.title !== expense.type && (
            <div style={{ display: "flex", gap: "12px", fontSize: "17px", fontWeight: "bold" }}>
              <span style={{ minWidth: "130px" }}>البيان :</span>
              <span style={{ fontWeight: 900 }}>{expense.title}</span>
            </div>
          )}
          {expense.notes && (
            <div style={{ fontSize: "17px", fontWeight: "bold" }}>
              <div>ملاحظات :</div>
              <div style={{ paddingRight: "20px", fontSize: "15px", fontWeight: 900, whiteSpace: "pre-line", marginTop: "4px", lineHeight: "1.6" }}>{expense.notes}</div>
            </div>
          )}
        </div>

        {/* ── Signatures ─────────────────────────────────────────────── */}
        <div style={{ marginTop: "70px", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "17px", fontWeight: 900 }}>توقيع المستلم</div>
            <div style={{ marginTop: "40px", borderTop: "1.5px solid #000", width: "130px" }}></div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "17px", fontWeight: 900 }}>الحسابات</div>
            <div style={{ marginTop: "40px", borderTop: "1.5px solid #000", width: "130px" }}></div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // تصميم A5 — نفس العناصر، مقاسات مناسبة لـ 148mm
  // ════════════════════════════════════════════════════════════════════════
  if (paperSize === "A5") {
    return (
      <div id="expense-receipt-to-print" dir="rtl" style={{ backgroundColor: "#ffffff", color: "#000000", padding: "10mm", width: "148mm", margin: "0 auto", border: "1px solid #000000", boxSizing: "border-box", fontFamily: "'Cairo', system-ui, sans-serif" }}>
        <style dangerouslySetInnerHTML={{ __html: printPaperCSS("A5", "#expense-receipt-to-print") }} />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", marginTop: "4px" }}>
          <div style={{ textAlign: "right", lineHeight: "1.8", width: "35%", fontWeight: "bold", fontSize: "10px" }}>
            <div>رقم الوصل: {rid}</div>
            <div>التاريخ: {getDate()}</div>
            <div>الساعة: {getTime()}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", width: "30%" }}>
            <div style={{ width: "58px", height: "58px", borderRadius: "50%", border: "1px solid #000", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
              {schoolLogo
                ? <img src={schoolLogo} alt="logo" style={{ maxWidth: "50px", maxHeight: "50px", objectFit: "contain" }} />
                : <GraduationCap size={24} />}
            </div>
          </div>
          <div style={{ textAlign: "right", width: "35%" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 900, margin: 0, lineHeight: "1.3" }}>{schoolName}</h2>
            <div style={{ fontSize: "10px", fontWeight: "bold", marginTop: "3px", color: "#555" }}>الأهلية</div>
          </div>
        </div>

        {/* ── Title ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: 0, textDecoration: "underline", textUnderlineOffset: "5px" }}>
            صرف مبلغ
          </h1>
        </div>

        {/* ── Statement ──────────────────────────────────────────────── */}
        <div style={{ textAlign: "right", fontSize: "12px", fontWeight: "bold", lineHeight: "2.1", paddingRight: "6px", marginBottom: "14px" }}>
          تم صرف مبلغ ( <span style={{ fontSize: "13px", fontWeight: 900, fontFamily: "monospace" }}>{fmt(expense.amount)}</span> ) بتاريخ ( <span style={{ fontWeight: 900 }}>{getDate()}</span> ) وفي ما يلي التفاصيل
        </div>

        {/* ── Details ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px", paddingRight: "6px" }}>
          <div style={{ display: "flex", gap: "8px", fontSize: "12px", fontWeight: "bold" }}>
            <span style={{ minWidth: "90px" }}>باب الصرف :</span>
            <span style={{ fontWeight: 900 }}>{expense.type}</span>
          </div>
          <div style={{ display: "flex", gap: "8px", fontSize: "12px", fontWeight: "bold" }}>
            <span style={{ minWidth: "90px" }}>اسم المستلم :</span>
            <span style={{ fontWeight: 900 }}>{expense.receiver || "غير محدد"}</span>
          </div>
          {expense.title && expense.title !== expense.type && (
            <div style={{ display: "flex", gap: "8px", fontSize: "12px", fontWeight: "bold" }}>
              <span style={{ minWidth: "90px" }}>البيان :</span>
              <span style={{ fontWeight: 900 }}>{expense.title}</span>
            </div>
          )}
          {expense.notes && (
            <div style={{ fontSize: "12px", fontWeight: "bold" }}>
              <div>ملاحظات :</div>
              <div style={{ paddingRight: "14px", fontSize: "11px", fontWeight: 900, marginTop: "3px", lineHeight: "1.5" }}>{expense.notes}</div>
            </div>
          )}
        </div>

        {/* ── Signatures ─────────────────────────────────────────────── */}
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", fontWeight: 900 }}>توقيع المستلم</div>
            <div style={{ marginTop: "28px", borderTop: "1.5px solid #000", width: "90px" }}></div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", fontWeight: 900 }}>الحسابات</div>
            <div style={{ marginTop: "28px", borderTop: "1.5px solid #000", width: "90px" }}></div>
          </div>
        </div>
      </div>
    );
  }



  // ════════════════════════════════════════════════════════════════════════
  // تصميم حراري بسيط — يدعم 58mm و 80mm، أبيض وأسود، طول مفتوح
  // ════════════════════════════════════════════════════════════════════════
  const expPaper = PAPER_SIZES[paperSize] || PAPER_SIZES.A8;
  const expSep = (
    <div style={{ borderBottom: "1px dashed #000", margin: "4px 0", height: 0 }} />
  );
  return (
    <div
      id="expense-receipt-to-print"
      dir="rtl"
      style={{
        backgroundColor: "#ffffff",
        color: "#000000",
        padding: expPaper.padding,
        width: expPaper.width,
        margin: "0 auto",
        boxSizing: "border-box",
        fontFamily: "'Cairo', monospace, system-ui, sans-serif",
        fontSize: expPaper.bodyFS,
        lineHeight: 1.5,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: printPaperCSS(paperSize, "#expense-receipt-to-print") }} />

      {/* School name */}
      <div style={{ textAlign: "center", fontWeight: 900, fontSize: expPaper.titleSize, margin: "2px 0" }}>
        {schoolName}
      </div>

      {expSep}

      {/* Title */}
      <div style={{ textAlign: "center", fontWeight: 900, fontSize: expPaper.bannerFS, margin: "2px 0", letterSpacing: "1px" }}>
        وصل صرف
      </div>

      {expSep}

      {/* Meta */}
      <div style={{ margin: "1px 0", fontWeight: 600 }}>رقم الوصل: <b style={{ fontWeight: 900 }}>{rid}</b></div>
      <div style={{ margin: "1px 0", fontWeight: 600 }}>التاريخ: {getDate()}</div>
      <div style={{ margin: "1px 0", fontWeight: 600 }}>الساعة: {getTime()}</div>

      {expSep}

      {/* Body */}
      <div style={{ margin: "1px 0", fontWeight: 600 }}>باب الصرف: <b style={{ fontWeight: 900 }}>{expense.type}</b></div>
      <div style={{ margin: "1px 0", fontWeight: 600 }}>المستلم: <b style={{ fontWeight: 900 }}>{expense.receiver || "غير محدد"}</b></div>
      {expense.title && expense.title !== expense.type && (
        <div style={{ margin: "1px 0", fontWeight: 600 }}>البيان: {expense.title}</div>
      )}

      {expSep}

      {/* Amount */}
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: expPaper.bodyFS, marginTop: "3px" }}>
        المبلغ المصروف
      </div>
      <div style={{ textAlign: "center", fontWeight: 900, fontSize: paperSize === "Thermal80" ? "20px" : "16px", margin: "3px 0" }}>
        {fmt(expense.amount)} د.ع
      </div>

      {expSep}

      {/* Status */}
      {expense.status && (
        <>
          <div style={{ textAlign: "center", fontWeight: 800, fontSize: expPaper.bodyFS, margin: "2px 0" }}>
            الحالة: {expense.status === "paid" ? "مدفوع" : "غير مدفوع"}
          </div>
          {expSep}
        </>
      )}

      {/* Notes */}
      {expense.notes && (
        <>
          <div style={{ fontWeight: 600, fontSize: expPaper.headerFS, margin: "2px 0" }}>ملاحظة: {expense.notes}</div>
          {expSep}
        </>
      )}

      {/* Signatures */}
      <div style={{ margin: "3px 0", fontWeight: 600 }}>توقيع المستلم: ....................</div>
      <div style={{ margin: "3px 0", fontWeight: 600 }}>توقيع المحاسب: ....................</div>

      {expSep}

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: expPaper.footerFS, fontWeight: 700, margin: "3px 0" }}>
        النظام المالي المتكامل
      </div>
    </div>
  );
}

export default ExpenseReceiptPrint;

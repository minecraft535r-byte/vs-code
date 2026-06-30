/**
 * ReceiptPrint.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React from "react";
import { GraduationCap, School } from "lucide-react";
import type { Student, Payment, PrintSettings } from "@/types";
import { printPaperCSS } from "@/utils/print";
import { PAPER_SIZES } from "@/constants";

const ReceiptPrint = ({
  student,
  payment,
  systemSettings,
}: {
  student: Student;
  payment: Payment;
  systemSettings?: {
    schoolName: string;
    schoolLogo: string | null;
    academicYear?: string;
    printSettings?: PrintSettings;
  };
}) => {
  const schoolName = systemSettings?.schoolName || "مدرسة المختار الابتدائية";
  const schoolLogo = systemSettings?.schoolLogo || null;
  const paperSize = systemSettings?.printSettings?.receiptSize || "A4";

  // ── helpers ──────────────────────────────────────────────────────────────
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  const fmtDate = (d: string) => {
    if (!d) return "";
    const clean = d.split("T")[0];
    const p = clean.split(/[-/]/);
    return p.length === 3 ? `${p[0]}\\${+p[1]}\\${+p[2]}` : d.replace(/[-\/]/g, "\\");
  };
  const nowTime = () => {
    const n = new Date(); let h = n.getHours();
    const m = String(n.getMinutes()).padStart(2, "0");
    h = h % 12 || 12; return `${h}:${m}`;
  };
  const totalPaid  = (student.payments || []).filter((p: any) => !p.isWithdrawn).reduce((s, p) => s + p.amount, 0);
  const remaining  = Math.max(0, student.tuition - (student.discount || 0) - totalPaid);
  const rid        = /^\d+$/.test(String(payment.id)) ? String(payment.id).padStart(4, "0") : String(payment.id);
  const payList    = student.payments || [];

  // ════════════════════════════════════════════════════════════════════════
  // تصميم A4 — كامل مع جدول السجل
  // ════════════════════════════════════════════════════════════════════════
  if (paperSize === "A4") {
    const bx = (label: string, value: string, vw = 150, lw = 110) => (
      <div style={{ display: "flex", border: "1.5px solid #000", backgroundColor: "#ffffff" }}>
        <div style={{ padding: "7px 18px", fontWeight: 900, borderRight: "1.5px solid #000", minWidth: `${vw}px`, textAlign: "center", fontSize: "16px", textDecoration: "underline", textUnderlineOffset: "3px" }}>{value}</div>
        <div style={{ padding: "7px 12px", fontWeight: "bold", minWidth: `${lw}px`, textAlign: "center", fontSize: "14px" }}>{label}</div>
      </div>
    );
    return (
      <div id="receipt-to-print" dir="rtl" style={{ backgroundColor: "#ffffff", color: "#000000", padding: "15mm", width: "210mm", margin: "0 auto", border: "1px solid #000000", boxSizing: "border-box", fontFamily: "'Cairo', system-ui, sans-serif" }}>
        <style dangerouslySetInnerHTML={{ __html: printPaperCSS("A4", "#receipt-to-print") }} />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", marginTop: "8px" }}>
          <div style={{ textAlign: "right", lineHeight: "1.9", width: "35%", fontWeight: "bold", fontSize: "14px" }}>
            <div>رقم الوصل: {rid}</div>
            <div>التاريخ: {fmtDate(payment.date)}</div>
            <div>الساعة: {nowTime()}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "30%" }}>
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", padding: "4px" }}>
              {schoolLogo
                ? <img src={schoolLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} referrerPolicy="no-referrer" />
                : <GraduationCap size={36} />}
            </div>
          </div>
          <div style={{ textAlign: "right", width: "35%" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>{schoolName}</h2>
            <p style={{ fontSize: "13px", fontWeight: "bold", color: "#555555", margin: "3px 0 0 0" }}>الأهلية</p>
          </div>
        </div>

        {/* ── Banner ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", margin: "18px 0" }}>
          <div style={{ backgroundColor: "#ffccd5", padding: "6px 55px", fontWeight: 950, fontSize: "22px", border: "1.5px solid #000000", textAlign: "center" }}>
            وصل قبض
          </div>
        </div>

        {/* ── Statement text ─────────────────────────────────────────── */}
        <div style={{ fontSize: "17px", fontWeight: "bold", lineHeight: "2.4", margin: "22px 0", color: "#000000" }}>
          تم استلام مبلغ ( <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 900 }}>{fmt(payment.amount)}</span> ) بتاريخ ( <span style={{ fontWeight: 900 }}>{fmtDate(payment.date)}</span> ) كبدل من ( <span style={{ fontWeight: 900 }}>{payment.notes || "اقساط"}</span> )
          <br />
          الطالب /ة ( <span style={{ fontWeight: 900, fontSize: "19px" }}>{student.name}</span> ) في الصف ( <span style={{ fontWeight: 900 }}>{student.grade || "—"}</span> )
        </div>

        {/* ── Summary boxes ──────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "22px 0", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", width: "100%" }}>
            {bx("الخصم", fmt(student.discount || 0), 120, 80)}
            {bx("القسط الكلي", fmt(student.tuition), 160, 130)}
          </div>
          <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", width: "100%" }}>
            {bx("الباقي", fmt(remaining), 120, 80)}
            {bx("المبالغ المدفوعة", fmt(totalPaid), 160, 130)}
          </div>
        </div>

        {/* ── Payment history table ──────────────────────────────────── */}
        <div style={{ marginTop: "28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid #000000", direction: "rtl" }}>
            <thead>
              <tr style={{ backgroundColor: "#ffffff", borderBottom: "1.5px solid #000000" }}>
                {[["ت","8%"], ["رقم الوصل","22%"], ["قيمة الوصل","24%"], ["تاريخ الوصل","24%"], ["الملاحظات","24%"]].map(([h, w], i) => (
                  <th key={i} style={{ border: "1.5px solid #000", padding: "8px 4px", fontSize: "14px", fontWeight: 900, textAlign: "center", width: w }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payList.length > 0 ? payList.map((p, i) => (
                <tr key={p.id || i} style={{ backgroundColor: "#ffffff" }}>
                  <td style={{ border: "1.5px solid #000", padding: "8px 4px", fontSize: "14px", fontWeight: 900, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ border: "1.5px solid #000", padding: "8px 6px", fontSize: "14px", fontWeight: 900, textAlign: "center" }}>{/^\d+$/.test(String(p.id)) ? String(p.id).padStart(4, "0") : p.id}</td>
                  <td style={{ border: "1.5px solid #000", padding: "8px 6px", fontSize: "14px", fontWeight: 900, textAlign: "center" }}>{fmt(p.amount)}</td>
                  <td style={{ border: "1.5px solid #000", padding: "8px 6px", fontSize: "14px", fontWeight: 900, textAlign: "center" }}>{fmtDate(p.date)}</td>
                  <td style={{ border: "1.5px solid #000", padding: "8px 6px", fontSize: "14px", fontWeight: 900, textAlign: "center" }}>{p.notes || "—"}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ border: "1.5px solid #000", padding: "16px", fontSize: "14px", fontWeight: "bold", textAlign: "center" }}>لا توجد وصولات سابقة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // تصميم A5 — نفس العناصر، مقاسات مناسبة لـ 148mm
  // ════════════════════════════════════════════════════════════════════════
  if (paperSize === "A5") {
    const bx5 = (label: string, value: string) => (
      <div style={{ display: "flex", border: "1px solid #000", backgroundColor: "#ffffff" }}>
        <div style={{ padding: "5px 10px", fontWeight: 900, borderRight: "1px solid #000", minWidth: "90px", textAlign: "center", fontSize: "11px", textDecoration: "underline" }}>{value}</div>
        <div style={{ padding: "5px 8px", fontWeight: "bold", minWidth: "60px", textAlign: "center", fontSize: "10px" }}>{label}</div>
      </div>
    );
    return (
      <div id="receipt-to-print" dir="rtl" style={{ backgroundColor: "#ffffff", color: "#000000", padding: "10mm", width: "148mm", margin: "0 auto", border: "1px solid #000000", boxSizing: "border-box", fontFamily: "'Cairo', system-ui, sans-serif" }}>
        <style dangerouslySetInnerHTML={{ __html: printPaperCSS("A5", "#receipt-to-print") }} />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", marginTop: "4px" }}>
          <div style={{ textAlign: "right", lineHeight: "1.8", width: "35%", fontWeight: "bold", fontSize: "10px" }}>
            <div>رقم الوصل: {rid}</div>
            <div>التاريخ: {fmtDate(payment.date)}</div>
            <div>الساعة: {nowTime()}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", width: "30%" }}>
            <div style={{ width: "58px", height: "58px", borderRadius: "50%", border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", padding: "3px" }}>
              {schoolLogo
                ? <img src={schoolLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} referrerPolicy="no-referrer" />
                : <GraduationCap size={22} />}
            </div>
          </div>
          <div style={{ textAlign: "right", width: "35%" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 900, margin: 0, lineHeight: "1.3" }}>{schoolName}</h2>
            <p style={{ fontSize: "10px", fontWeight: "bold", color: "#555555", margin: "2px 0 0 0" }}>الأهلية</p>
          </div>
        </div>

        {/* ── Banner ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
          <div style={{ backgroundColor: "#ffccd5", padding: "4px 30px", fontWeight: 950, fontSize: "16px", border: "1.5px solid #000000", textAlign: "center" }}>
            وصل قبض
          </div>
        </div>

        {/* ── Statement text ─────────────────────────────────────────── */}
        <div style={{ fontSize: "12px", fontWeight: "bold", lineHeight: "2.2", margin: "12px 0" }}>
          تم استلام مبلغ ( <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 900 }}>{fmt(payment.amount)}</span> ) بتاريخ ( <span style={{ fontWeight: 900 }}>{fmtDate(payment.date)}</span> ) كبدل من ( <span style={{ fontWeight: 900 }}>{payment.notes || "اقساط"}</span> )
          <br />
          الطالب /ة ( <span style={{ fontWeight: 900, fontSize: "13px" }}>{student.name}</span> ) في الصف ( <span style={{ fontWeight: 900 }}>{student.grade || "—"}</span> )
        </div>

        {/* ── Summary boxes ──────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "12px 0", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            {bx5("الخصم", fmt(student.discount || 0))}
            {bx5("القسط الكلي", fmt(student.tuition))}
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            {bx5("الباقي", fmt(remaining))}
            {bx5("المبالغ المدفوعة", fmt(totalPaid))}
          </div>
        </div>

        {/* ── Payment history table ──────────────────────────────────── */}
        <div style={{ marginTop: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000000", direction: "rtl" }}>
            <thead>
              <tr style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #000" }}>
                {["ت", "رقم الوصل", "قيمة الوصل", "تاريخ الوصل", "الملاحظات"].map((h, i) => (
                  <th key={i} style={{ border: "1px solid #000", padding: "5px 3px", fontSize: "10px", fontWeight: 900, textAlign: "center" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payList.length > 0 ? payList.map((p, i) => (
                <tr key={p.id || i} style={{ backgroundColor: "#ffffff" }}>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", fontSize: "10px", fontWeight: 900, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", fontSize: "10px", fontWeight: 900, textAlign: "center" }}>{/^\d+$/.test(String(p.id)) ? String(p.id).padStart(4, "0") : p.id}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", fontSize: "10px", fontWeight: 900, textAlign: "center" }}>{fmt(p.amount)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", fontSize: "10px", fontWeight: 900, textAlign: "center" }}>{fmtDate(p.date)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 3px", fontSize: "10px", fontWeight: 900, textAlign: "center" }}>{p.notes || "—"}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ border: "1px solid #000", padding: "10px", fontSize: "10px", fontWeight: "bold", textAlign: "center" }}>لا توجد وصولات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // تصميم حراري بسيط — يدعم 58mm و 80mm، أبيض وأسود فقط، طول مفتوح
  // ════════════════════════════════════════════════════════════════════════
  const thermalPaper = PAPER_SIZES[paperSize] || PAPER_SIZES.A8;
  const padId = (id: any) => /^\d+$/.test(String(id)) ? String(id).padStart(4, "0") : String(id);
  const sep = (
    <div style={{ borderBottom: "1px dashed #000", margin: "4px 0", height: 0 }} />
  );
  return (
    <div
      id="receipt-to-print"
      dir="rtl"
      style={{
        backgroundColor: "#ffffff",
        color: "#000000",
        padding: thermalPaper.padding,
        width: thermalPaper.width,
        margin: "0 auto",
        boxSizing: "border-box",
        fontFamily: "'Cairo', monospace, system-ui, sans-serif",
        fontSize: thermalPaper.bodyFS,
        lineHeight: 1.5,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: printPaperCSS(paperSize, "#receipt-to-print") }} />

      {/* School name */}
      <div style={{ textAlign: "center", fontWeight: 900, fontSize: thermalPaper.titleSize, margin: "2px 0" }}>
        {schoolName}
      </div>
      {systemSettings?.academicYear && (
        <div style={{ textAlign: "center", fontSize: thermalPaper.footerFS, fontWeight: 600 }}>
          السنة الدراسية {systemSettings.academicYear}
        </div>
      )}

      {sep}

      {/* Title */}
      <div style={{ textAlign: "center", fontWeight: 900, fontSize: thermalPaper.bannerFS, margin: "2px 0", letterSpacing: "1px" }}>
        وصل قبض
      </div>

      {sep}

      {/* Meta */}
      <div style={{ margin: "1px 0", fontWeight: 600 }}>رقم الوصل: <b style={{ fontWeight: 900 }}>{rid}</b></div>
      <div style={{ margin: "1px 0", fontWeight: 600 }}>التاريخ: {fmtDate(payment.date)}</div>
      <div style={{ margin: "1px 0", fontWeight: 600 }}>الساعة: {nowTime()}</div>

      {sep}

      {/* Student */}
      <div style={{ margin: "1px 0", fontWeight: 600 }}>الطالب: <b style={{ fontWeight: 900 }}>{student.name}</b></div>
      <div style={{ margin: "1px 0", fontWeight: 600 }}>الصف: {student.grade || "—"}{student.section ? " / " + student.section : ""}</div>

      {sep}

      {/* Amount — bold, larger, no box */}
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: thermalPaper.bodyFS, marginTop: "3px" }}>
        المبلغ المستلم
      </div>
      <div style={{ textAlign: "center", fontWeight: 900, fontSize: paperSize === "Thermal80" ? "20px" : "16px", margin: "3px 0" }}>
        {fmt(payment.amount)} د.ع
      </div>

      {sep}

      {/* Summary */}
      <div style={{ margin: "2px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "1px 0", fontWeight: 600 }}>
          <span>القسط الكلي</span><span>{fmt(student.tuition)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "1px 0", fontWeight: 600 }}>
          <span>الخصم</span><span>{fmt(student.discount || 0)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "1px 0", fontWeight: 800 }}>
          <span>إجمالي المدفوع</span><span>{fmt(totalPaid)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "1px 0", fontWeight: 800 }}>
          <span>الباقي</span><span>{fmt(remaining)}</span>
        </div>
      </div>

      {/* Payment history with RECEIPT NUMBERS */}
      {payList.length > 1 && (
        <>
          {sep}
          <div style={{ textAlign: "center", fontWeight: 800, fontSize: thermalPaper.headerFS, margin: "2px 0" }}>
            سجل الوصولات السابقة ({payList.length} وصولات)
          </div>
          {payList.map((p) => {
            const isCurrent = String(p.id) === String(payment.id);
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: thermalPaper.tableFS,
                  margin: "1px 0",
                  fontWeight: isCurrent ? 900 : 600,
                }}
              >
                <span>{isCurrent ? "‣ " : ""}#{padId(p.id)} • {fmtDate(p.date)}</span>
                <span>{fmt(p.amount)}</span>
              </div>
            );
          })}
        </>
      )}

      {/* Notes */}
      {payment.notes && (
        <>
          {sep}
          <div style={{ fontWeight: 600, fontSize: thermalPaper.headerFS }}>ملاحظة: {payment.notes}</div>
        </>
      )}

      {sep}

      {/* Signature */}
      <div style={{ margin: "3px 0", fontWeight: 600 }}>التوقيع: ................................</div>

      {sep}

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: thermalPaper.footerFS, fontWeight: 700, margin: "3px 0" }}>
        شكراً لتعاونكم معنا
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// وصل مصروفات — ثلاثة تصاميم مستقلة حسب حجم الورق
// ─────────────────────────────────────────────────────────────────────────────

export default ReceiptPrint;

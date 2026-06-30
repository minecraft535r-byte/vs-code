/**
 * InvestorPaymentReceiptPrint.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React from "react";
import { School } from "lucide-react";
import type { SystemSettings } from "@/types";
import { PAPER_SIZES } from "@/constants";

const InvestorPaymentReceiptPrint = ({
  payment,
  investorName,
  settings,
}: {
  payment: {
    amount: number;
    date: string;
    notes?: string;
    receiptNo?: number | string;
  };
  investorName: string;
  settings: SystemSettings | null;
}) => {
  const schoolName = settings?.schoolName || "مدارس مرتضى الأهلية";
  const schoolLogo = settings?.schoolLogo || null;
  const paperSize = settings?.printSettings?.receiptSize || "A4";
  const paper = PAPER_SIZES.A4; // investor profit receipt is exported as an image — keep full A4 quality

  const toArabicNumerals = (val: string | number): string => {
    return String(val);
  };

  const formattedAmount = new Intl.NumberFormat("en-US").format(payment.amount);

  return (
    <div
      id="investor-receipt-to-print"
      dir="rtl"
      className="receipt-a4-page"
      style={{
        backgroundColor: "#ffffff",
        color: "#000000",
        padding: paper.padding,
        width: paper.width,
        minHeight: "auto",
        margin: "0 auto",
        border: "1px solid #000000",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        position: "relative",
        fontSize: paper.fontSize,
      }}
    >
      {/* Top Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginTop: "10px",
          marginBottom: "30px",
          zIndex: 2,
          position: "relative",
        }}
      >
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "6px", width: "35%", color: "#000000", fontWeight: "bold", fontSize: "14px" }}>
          <div>رقم الوصل: {toArabicNumerals(payment.receiptNo || "0000")}</div>
          <div>التاريخ: {toArabicNumerals(payment.date.replace(/-/g, "/"))}</div>
          <div>الساعة: {toArabicNumerals(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).replace("ص", "AM").replace("م", "PM"))}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", width: "30%" }}>
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "1px solid #000000",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
          }}>
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo" style={{ maxWidth: "105px", maxHeight: "105px", objectFit: "contain" }} />
            ) : (
              <School size={65} style={{ color: "#000000" }} />
            )}
          </div>
        </div>

        <div style={{ textAlign: "right", width: "35%", color: "#000000" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "900", margin: 0, lineHeight: "1.4" }}>
            {schoolName}
          </h2>
          <div style={{ fontSize: "15px", fontWeight: "bold", marginTop: "4px" }}>
            الأهلية
          </div>
        </div>
      </div>

      {/* Centered Title */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "25px 0",
          zIndex: 2,
          position: "relative",
        }}
      >
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "900",
            color: "#000000",
            margin: 0,
            textDecoration: "underline",
            textUnderlineOffset: "8px",
          }}
        >
          وصل صرف أرباح مستثمر
        </h1>
      </div>

      {/* Sentence Section */}
      <div
        style={{
          textAlign: "right",
          fontSize: "17px",
          fontWeight: "bold",
          color: "#000000",
          lineHeight: "2.2",
          paddingRight: "10px",
          zIndex: 2,
          position: "relative",
          marginBottom: "25px",
        }}
      >
        تم صرف دفعة أرباح بقيمة ( <span style={{ fontSize: "20px", fontWeight: "900", fontFamily: "monospace" }}>{formattedAmount}</span> د.ع ) بتاريخ ( <span style={{ fontWeight: "900" }}>{toArabicNumerals(payment.date.replace(/-/g, "/"))}</span> ) وفي ما يلي التفاصيل:
      </div>

      {/* Detailed rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          margin: "20px 0",
          paddingRight: "10px",
          zIndex: 2,
          position: "relative",
          textAlign: "right",
          color: "#000000",
        }}
      >
        <div style={{ display: "flex", gap: "8px", fontSize: "17px", fontWeight: "bold" }}>
          <span style={{ minWidth: "150px" }}>اسم المستثمر / الشريك :</span>
          <span style={{ fontWeight: "900" }}>{investorName}</span>
        </div>

        <div style={{ display: "flex", gap: "8px", fontSize: "17px", fontWeight: "bold" }}>
          <span style={{ minWidth: "150px" }}>المبلغ المدفوع :</span>
          <span style={{ fontWeight: "900" }}>{formattedAmount} د.ع</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "17px", fontWeight: "bold" }}>
          <span>البيان والملاحظات :</span>
          {payment.notes && (
            <div style={{
              paddingRight: "20px",
              fontWeight: "900",
              whiteSpace: "pre-line",
              fontSize: "15px",
              color: "#000000",
              lineHeight: "1.6"
            }}>
              <div style={{ color: "#000000", fontFamily: "monospace", letterSpacing: "1px", margin: "2px 0 6px 0" }}>-------------</div>
              {payment.notes}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Signatures */}
      <div
        style={{
          marginTop: "80px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 2,
          position: "relative",
          padding: "0 60px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "17px", fontWeight: "900", color: "#000000" }}>توقيع الشريك / المستلم</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "17px", fontWeight: "900", color: "#000000" }}>الحسابات والمحاسب</span>
        </div>
      </div>
    </div>
  );
};

/// Investor Account Statement Modal for Printing

export default InvestorPaymentReceiptPrint;

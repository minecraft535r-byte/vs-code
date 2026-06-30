/**
 * AdditionalRevenueReceiptPrint.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React from "react";
import { TrendingUp, School } from "lucide-react";
import type { AdditionalRevenue, SystemSettings } from "@/types";
import { formatStudentCode } from "@/utils/format";
import { printPaperCSS } from "@/utils/print";
import { PAPER_SIZES } from "@/constants";

const AdditionalRevenueReceiptPrint = ({
  revenue,
  systemSettings,
}: {
  revenue: AdditionalRevenue;
  systemSettings?: SystemSettings | null;
}) => {
  const _arSettings = systemSettings || null;
  const paperSize = _arSettings?.printSettings?.receiptSize || "A4";
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const arFmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  // ── Thermal receipt — plain monochrome, supports 58mm and 80mm ──
  if (paper.compact) {
    const arSep = (
      <div style={{ borderBottom: "1px dashed #000", margin: "4px 0", height: 0 }} />
    );
    return (
      <div
        id="additional-revenue-receipt-to-print"
        dir="rtl"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          padding: paper.padding,
          width: paper.width,
          margin: "0 auto",
          boxSizing: "border-box",
          fontFamily: "'Cairo', monospace, system-ui, sans-serif",
          fontSize: paper.bodyFS,
          lineHeight: 1.5,
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: printPaperCSS(paperSize, "#additional-revenue-receipt-to-print") }} />

        {/* School name */}
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: paper.titleSize, margin: "2px 0" }}>
          {_arSettings?.schoolName || "مدارس مرتضى"}
        </div>

        {arSep}

        {/* Title */}
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: paper.bannerFS, margin: "2px 0", letterSpacing: "1px" }}>
          قبض إيرادات
        </div>

        {arSep}

        {/* Meta */}
        <div style={{ margin: "1px 0", fontWeight: 600 }}>رقم الوصل: <b style={{ fontWeight: 900 }}>{revenue.receiptNo || formatStudentCode(revenue.id)}</b></div>
        <div style={{ margin: "1px 0", fontWeight: 600 }}>التاريخ: {revenue.date || ""}</div>

        {arSep}

        {/* Body */}
        <div style={{ margin: "1px 0", fontWeight: 600 }}>البيان: <b style={{ fontWeight: 900 }}>{revenue.title}</b></div>
        <div style={{ margin: "1px 0", fontWeight: 600 }}>المسدد: <b style={{ fontWeight: 900 }}>{revenue.payer || "غير محدد"}</b></div>

        {arSep}

        {/* Amount */}
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: paper.bodyFS, marginTop: "3px" }}>
          المبلغ المستلم
        </div>
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: paperSize === "Thermal80" ? "20px" : "16px", margin: "3px 0" }}>
          {arFmt(revenue.amount)} د.ع
        </div>

        {arSep}

        {/* Notes */}
        {revenue.notes && (
          <>
            <div style={{ fontWeight: 600, fontSize: paper.headerFS, margin: "2px 0" }}>ملاحظة: {revenue.notes}</div>
            {arSep}
          </>
        )}

        {/* Signature */}
        <div style={{ margin: "3px 0", fontWeight: 600 }}>التوقيع: ................................</div>

        {arSep}

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: paper.footerFS, fontWeight: 700, margin: "3px 0" }}>
          شكراً لتعاونكم معنا
        </div>
      </div>
    );
  }

  // A5 keeps the full design but uniformly zoomed (~0.7) so it stays readable.
  const arZoom = paperSize === "A5" ? 0.70 : 1;
  return (
    <div
      id="additional-revenue-receipt-to-print"
      dir="rtl"
      style={{
        backgroundColor: "#ffffff",
        color: "#1e293b",
        padding: "48px",
        width: "210mm",
        minHeight: "148mm",
        margin: "0 auto",
        border: "2px solid #e2e8f0",
        borderRadius: "24px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        zoom: arZoom,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: printPaperCSS(paperSize, "#additional-revenue-receipt-to-print") }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "256px",
          height: "256px",
          borderRadius: "9999px",
          transform: "translate(50%, -50%)",
          backgroundColor: "rgba(5, 150, 105, 0.05)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "128px",
          height: "128px",
          borderRadius: "9999px",
          transform: "translate(-50%, 50%)",
          backgroundColor: "rgba(5, 150, 105, 0.05)",
        }}
      />

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #f1f5f9",
          paddingBottom: "32px",
          marginBottom: "32px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#059669",
              color: "#ffffff",
              boxShadow: "0 10px 15px -3px rgba(5, 150, 105, 0.2)",
            }}
          >
            <TrendingUp size={40} style={{ margin: "auto" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "30px",
                fontWeight: "900",
                color: "#0f172a",
                lineHeight: "1.2",
                margin: 0,
              }}
            >
              مستند قبض إيرادات
            </h1>
            <p
              style={{
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "12px",
                color: "#94a3b8",
                margin: 0,
              }}
            >
              Murtada Schools — Additional Revenue
            </p>
          </div>
        </div>
        <div
          style={{
            padding: "16px 24px",
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
            backgroundColor: "#ecfdf5",
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#059669",
              marginBottom: "4px",
              margin: 0,
            }}
          >
            رقم المستند
          </p>
          <p
            style={{
              fontSize: "20px",
              fontWeight: "900",
              color: "#047857",
              margin: 0,
            }}
          >
            REV-#{revenue.receiptNo || formatStudentCode(revenue.id)}
          </p>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "64px",
          marginBottom: "40px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <p
              style={{
                fontSize: "10px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#94a3b8",
                marginBottom: "4px",
                margin: 0,
              }}
            >
              نوع الإيراد / البيان
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: "#1e293b",
                margin: 0,
              }}
            >
              {revenue.title}
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#94a3b8",
                  marginBottom: "4px",
                  margin: 0,
                }}
              >
                المدرسة
              </p>
              <p style={{ fontWeight: "700", color: "#334155", margin: 0 }}>
                {revenue.school}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#94a3b8",
                  marginBottom: "4px",
                  margin: 0,
                }}
              >
                المسدد
              </p>
              <p style={{ fontWeight: "700", color: "#334155", margin: 0 }}>
                {revenue.payer || "غير محدد"}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "32px",
            borderRadius: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#059669",
            color: "#ffffff",
            boxShadow: "0 10px 15px -3px rgba(5, 150, 105, 0.2)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)",
              pointerEvents: "none",
            }}
          />
          <p
            style={{
              fontSize: "12px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: "#d1fae5",
              marginBottom: "12px",
              position: "relative",
              margin: 0,
            }}
          >
            المبلغ المستلم
          </p>
          <p
            style={{
              fontSize: "48px",
              fontWeight: "900",
              position: "relative",
              margin: 0,
            }}
          >
            {new Intl.NumberFormat("en-US").format(revenue.amount)}{" "}
            <span style={{ fontSize: "20px" }}>د.ع</span>
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: "48px",
          paddingTop: "32px",
          borderTop: "2px solid #f1f5f9",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "32px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#94a3b8",
              marginBottom: "4px",
              margin: 0,
            }}
          >
            تاريخ الاستحقاق
          </p>
          <p
            style={{
              fontWeight: "900",
              fontSize: "20px",
              color: "#1e293b",
              margin: 0,
            }}
          >
            {revenue.date}
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#94a3b8",
              marginBottom: "4px",
              margin: 0,
            }}
          >
            تاريخ الاستلام
          </p>
          <p
            style={{
              fontWeight: "900",
              fontSize: "20px",
              color: "#1e293b",
              margin: 0,
            }}
          >
            {revenue.receivedDate || "---"}
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#94a3b8",
              marginBottom: "4px",
              margin: 0,
            }}
          >
            طريقة القبض
          </p>
          <p
            style={{
              fontWeight: "900",
              fontSize: "20px",
              color: "#1e293b",
              margin: 0,
            }}
          >
            نقداً
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: "48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          opacity: 0.5,
        }}
      >
        <div
          style={{
            width: "128px",
            height: "4px",
            borderTop: "2px solid #e2e8f0",
            textAlign: "center",
            paddingTop: "10px",
          }}
        >
          توقيع المحاسب
        </div>
        <div
          style={{
            width: "128px",
            height: "4px",
            borderTop: "2px solid #e2e8f0",
            textAlign: "center",
            paddingTop: "10px",
          }}
        >
          توقيع المستلم
        </div>
      </div>
    </div>
  );
}

export default AdditionalRevenueReceiptPrint;

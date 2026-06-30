import type { SystemSettings, PaperSpec } from "@/types";

let _settingsCache: SystemSettings | null = null;

export function setSettingsCache(s: SystemSettings) { _settingsCache = s; }
export function getStoredSettings(): SystemSettings | null { return _settingsCache; }

export function getStoredReceiptSize(): string {
  return _settingsCache?.printSettings?.receiptSize || "A4";
}

export function getStoredStatementSize(): string {
  return _settingsCache?.printSettings?.statementSize || "A4";
}

export function printPaperCSS(size: string, containerId?: string): string {
  const PAPER_SIZES: Record<string, any> = {
    A4: { width: "210mm", height: "297mm", margin: "10mm" },
    A5: { width: "148mm", height: "210mm", margin: "8mm" },
    "58mm": { width: "58mm", height: "auto", margin: "2mm" },
    "80mm": { width: "80mm", height: "auto", margin: "3mm" },
  };
  const spec = PAPER_SIZES[size];
  if (!spec) return "";
  const sel = containerId ? ` ${containerId}` : "";
  return `@page { size: ${spec.width} ${spec.height}; margin: ${spec.margin || "10mm"}; }${sel ? `\n${sel} { width: ${spec.width}; }` : ""}`;
}

export function printDocument(elementId: string, paperSize?: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const size = paperSize || getStoredReceiptSize();
  printWindow.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>* { font-family: 'Cairo', sans-serif; box-sizing: border-box; } body { margin: 0; padding: 0; }
    ${printPaperCSS(size)} @media print { .no-print { display: none !important; } }</style></head>
    <body>${el.innerHTML}</body></html>`);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
}

export async function saveElementAsImage(elementId: string, filename?: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#fff" });
    const link = document.createElement("a");
    link.download = filename || "receipt.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    console.error("Failed to save as image:", e);
  }
}

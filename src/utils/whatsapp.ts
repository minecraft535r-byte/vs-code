function normalizeIraqiPhone(phone: string): string {
  let p = phone.replace(/[\s\-\(\)]/g, "");
  if (p.startsWith("0")) p = "964" + p.slice(1);
  if (!p.startsWith("964")) p = "964" + p;
  return p;
}

export function sendWhatsAppReceipt(phone: string, studentName?: string, amount?: number) {
  const normalized = normalizeIraqiPhone(phone);
  let message = "تم استلام الدفعة";
  if (studentName) message += " للطالب " + studentName;
  if (amount) message += " بمبلغ " + amount.toLocaleString() + " د.ع";
  const encoded = encodeURIComponent(message);
  window.open("https://wa.me/" + normalized + "?text=" + encoded, "_blank");
}

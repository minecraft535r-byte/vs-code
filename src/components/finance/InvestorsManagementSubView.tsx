/**
 * InvestorsManagementSubView.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Users, FileText, History, TrendingUp, CreditCard, Plus, ArrowRight, X, Trash2, Info, Edit, Check, Printer, Download } from "lucide-react";
import { Area } from "recharts";
import html2canvas from "html2canvas";
import type { Payment, SystemSettings, Investor } from "@/types";
import { formatWithCommas, handleDirectMoneyChange } from "@/utils/format";
import { notify } from "@/utils/notify";
import { verifyDeletePassword } from "@/utils/security";
import InvestorPaymentReceiptPrint from "@/components/print/InvestorPaymentReceiptPrint";
import InvestorAccountStatementModal from "@/components/print/InvestorAccountStatementModal";

const InvestorsManagementSubView = ({
  onBack,
  systemSettings,
  onUpdateSettings,
  netProfit = 0,
  incrementReceiptCounter,
}: {
  onBack: () => void;
  systemSettings: SystemSettings;
  onUpdateSettings: (s: SystemSettings, silent?: boolean) => void;
  netProfit?: number;
  incrementReceiptCounter: () => number;
}) => {
  const [newInvestorName, setNewInvestorName] = useState("");
  const [newInvestorPercentage, setNewInvestorPercentage] = useState("");

  // Editing state for rows
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempPercentage, setTempPercentage] = useState("");

  // Payment states
  const [payingInvestor, setPayingInvestor] = useState<Investor | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("2026-05-25");
  const [payNotes, setPayNotes] = useState("");

  // Expanded payments log list
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Printing state
  interface ActivePrintPayment {
    investorName: string;
    amount: number;
    date: string;
    notes: string;
    receiptNo: string | number;
  }
  const [printPayment, setPrintPayment] = useState<ActivePrintPayment | null>(null);
  const [showAllInvestorsReport, setShowAllInvestorsReport] = useState(false);
  const investorReceiptRef = useRef<HTMLDivElement>(null);

  // Account statement state
  const [statementInvestor, setStatementInvestor] = useState<Investor | null>(null);

  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const investors = systemSettings.investors || [];

  const totalPercentage = investors.reduce(
    (acc, inv) => acc + inv.percentage,
    0,
  );

  const handleAddInvestor = () => {
    const trimmedName = newInvestorName.trim();
    if (!trimmedName) return;
    const percentage = parseFloat(newInvestorPercentage) || 0;

    if (percentage <= 0 || percentage > 100) {
      notify("الرجاء إدخال نسبة مئوية صحيحة بين 1 و 100", "warning");
      return;
    }

    if (totalPercentage + percentage > 100) {
      notify("عذراً، مجموع النسب الموزعة لا يمكن أن يتجاوز 100%", "warning");
      return;
    }

    const newInvestor: Investor = {
      id: Date.now().toString(),
      name: trimmedName,
      percentage,
      payments: [],
    };

    const updatedInvestors = [...investors, newInvestor];
    onUpdateSettings(
      {
        ...systemSettings,
        investors: updatedInvestors,
      },
      false,
    );

    setNewInvestorName("");
    setNewInvestorPercentage("");
  };

  const handleDeleteInvestor = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستثمر؟")) {
      const __ok = await verifyDeletePassword(); if (!__ok) return;
      const updatedInvestors = investors.filter((inv) => inv.id !== id);
      onUpdateSettings(
        {
          ...systemSettings,
          investors: updatedInvestors,
        },
        false,
      );
    }
  };

  const handleStartEdit = (inv: Investor) => {
    setEditingId(inv.id);
    setTempName(inv.name);
    setTempPercentage(inv.percentage.toString());
  };

  const handleSaveEdit = (id: string) => {
    const trimmedName = tempName.trim();
    if (!trimmedName) return;
    const percentage = parseFloat(tempPercentage) || 0;

    if (percentage <= 0 || percentage > 100) {
      notify("الرجاء إدخال نسبة مئوية صحيحة بين 1 و 100", "warning");
      return;
    }

    const otherTotal = investors
      .filter((inv) => inv.id !== id)
      .reduce((acc, inv) => acc + inv.percentage, 0);

    if (otherTotal + percentage > 100) {
      notify("عذراً، مجموع النسب الموزعة لا يمكن أن يتجاوز 100%", "warning");
      return;
    }

    const updatedInvestors = investors.map((inv) => {
      if (inv.id === id) {
        return { ...inv, name: trimmedName, percentage };
      }
      return inv;
    });

    onUpdateSettings(
      {
        ...systemSettings,
        investors: updatedInvestors,
      },
      false,
    );

    setEditingId(null);
  };

  // Payment Confirmation & Print Flow
  const handleConfirmPayment = async () => {
    if (!payingInvestor) return;
    const amountNum = parseFloat(payAmount.replace(/,/g, "")) || 0;
    if (amountNum <= 0) {
      notify("يرجى إدخال مبلغ صحيح أكبر من الصفر.", "warning");
      return;
    }

    const investorPercentage = payingInvestor.percentage;
    const totalShare = (netProfit * investorPercentage) / 100;
    const totalPaid = (payingInvestor.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const maxAllowed = totalShare - totalPaid;

    if (amountNum > maxAllowed) {
      const confirmExceed = window.confirm(
        `تنبيه: المبلغ المدخل (${formatIQD(amountNum)} د.ع) يتجاوز حصته المتبقية حالياً (${formatIQD(maxAllowed)} د.ع). هل ترغب في الاستمرار على أي حال؟`
      );
      if (!confirmExceed) return;
    }

    // Generate receipt number
    const newReceiptNo = incrementReceiptCounter();

    const paymentRecord = {
      id: Date.now().toString(),
      amount: amountNum,
      date: payDate,
      notes: payNotes,
      receiptNo: newReceiptNo,
    };

    const updatedInvestors = investors.map((inv) => {
      if (inv.id === payingInvestor.id) {
        return {
          ...inv,
          payments: [...(inv.payments || []), paymentRecord],
        };
      }
      return inv;
    });

    onUpdateSettings(
      {
        ...systemSettings,
        investors: updatedInvestors,
      },
      false,
    );

    const paymentDetailsToPrint = {
      investorName: payingInvestor.name,
      amount: amountNum,
      date: payDate,
      notes: payNotes,
      receiptNo: newReceiptNo,
    };

    setPayingInvestor(null);
    setPayAmount("");
    setPayNotes("");

    // Trigger Print image generation
    handlePrintReceipt(paymentDetailsToPrint);
  };

  const handleDeletePayment = async (investorId: string, paymentId: string) => {
    if (window.confirm("هل أنت متأكد من حذف دفعة الصرف هذه وتراجع الحساب؟")) {
      const __ok = await verifyDeletePassword(); if (!__ok) return;

      const updatedInvestors = investors.map((inv) => {
        if (inv.id === investorId) {
          const updatedPayments = (inv.payments || []).filter((p) => p.id !== paymentId);
          return {
            ...inv,
            payments: updatedPayments,
          };
        }
        return inv;
      });

      onUpdateSettings(
        {
          ...systemSettings,
          investors: updatedInvestors,
        },
        false,
      );
    }
  };

  const handlePrintReceipt = async (paymentDetails: ActivePrintPayment) => {
    setPrintPayment(paymentDetails);
    // Wait for the state to render in DOM
    setTimeout(async () => {
      if (investorReceiptRef.current) {
        try {
          const canvas = await html2canvas(investorReceiptRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            imageTimeout: 0,
            onclone: (clonedDoc) => {
              const elements = clonedDoc.getElementsByTagName("*");
              for (let i = 0; i < elements.length; i++) {
                const el = elements[i] as HTMLElement;
                el.style.transition = "none";
                el.style.animation = "none";

                // Strip classes that might use oklch to prevent html2canvas errors
                const classesToRemove = Array.from(el.classList).filter(
                  (cls) =>
                    cls.includes("bg-") ||
                    cls.includes("text-") ||
                    cls.includes("border-") ||
                    cls.includes("shadow-"),
                );
                classesToRemove.forEach((cls) => el.classList.remove(cls));
              }
              const receiptEl = clonedDoc.getElementById("investor-receipt-to-print");
              if (receiptEl) {
                receiptEl.style.fontFamily = "Arial, sans-serif";
                receiptEl.style.display = "block";
                receiptEl.style.visibility = "visible";
                receiptEl.style.boxShadow = "none";
                receiptEl.style.border = "2px solid #000000";
                receiptEl.style.backgroundColor = "#ffffff";
                receiptEl.style.color = "#000000";
              }
            },
          });
          const image = canvas.toDataURL("image/png", 1.0);
          const link = document.createElement("a");
          link.href = image;
          link.download = `وصل_صرف_مستثمر_${paymentDetails.investorName}_رقم_${paymentDetails.receiptNo}.png`;
          link.click();
        } catch (err) {
          console.error("Error generating receipt image:", err);
        } finally {
          setPrintPayment(null);
        }
      }
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #fffbeb, #fef3c7)" }}
      dir="rtl"
    >
      {/* ── Modern light header ─────────────────────────────── */}
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30"
            >
              <TrendingUp size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">المستثمرون ونسب الأرباح</h1>
              <p className="text-[10px] font-bold text-slate-400">{investors.length} مستثمر • {totalPercentage}% موزّع من 100%</p>
            </div>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => setShowAllInvestorsReport(true)}
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 text-xs font-black transition-all">
          <Printer size={14} /><span className="hidden sm:inline">طباعة كشف كل المستثمرين</span>
        </motion.button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 scrollbar-hide">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* ── Quick stats hero (replaces big intro card) ────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-3xl p-5 md:p-6 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" }}
          >
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-xl"/>
            <div className="absolute -bottom-20 -right-10 w-60 h-60 rounded-full bg-white/5 blur-2xl"/>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-white/70 text-[11px] font-black uppercase tracking-widest mb-2">صافي رصيد الصندوق</p>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl md:text-4xl font-black text-white tabular-nums">{formatIQD(netProfit)}</h2>
                  <span className="text-white/80 text-base font-black">د.ع</span>
                </div>
                <p className="text-white/60 text-[10px] font-bold mt-1">قابل للتوزيع على المستثمرين</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 self-stretch md:self-auto min-w-[220px]">
                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-2">مجموع النسب الموزّعة</p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-black text-white tabular-nums">{totalPercentage}%</span>
                  <span className="text-white/60 text-xs font-bold">/ 100%</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: Math.min(totalPercentage, 100) + "%" }}
                    transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
                <p className="text-white/70 text-[10px] font-bold mt-2">
                  {totalPercentage === 100 ? "✓ تم التوزيع كاملاً" : totalPercentage < 100 ? `متبقي للصندوق: ${100 - totalPercentage}%` : "⚠ تجاوز 100%"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Add new investor card ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 bg-amber-500 rounded-full"/>
              <h3 className="text-sm font-black text-slate-700">إضافة مستثمر جديد</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 flex items-center gap-1.5">
                  <User size={11}/> اسم المستثمر
                </label>
                <input
                  type="text"
                  value={newInvestorName}
                  onChange={(e) => setNewInvestorName(e.target.value)}
                  placeholder="مثال: مرتضى محمد"
                  className="w-full h-11 bg-slate-50 py-2 px-4 rounded-xl border border-slate-100 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-200 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 flex items-center gap-1.5">
                  <TrendingUp size={11}/> نسبة الأرباح (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">%</span>
                  <input
                    type="number"
                    value={newInvestorPercentage}
                    onChange={(e) => setNewInvestorPercentage(e.target.value)}
                    placeholder="مثال: 15"
                    className="w-full h-11 bg-slate-50 py-2 pl-9 pr-4 rounded-xl border border-slate-100 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-200 focus:bg-white transition-all"
                    dir="ltr"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleAddInvestor}
                className="text-white font-black rounded-xl shadow-lg shadow-amber-500/30 transition-all text-xs h-11 flex items-center justify-center gap-2 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)" }}
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="inline-flex"
                >
                  <Plus size={14} strokeWidth={3}/>
                </motion.span>
                <span>إضافة المستثمر</span>
              </motion.button>
            </div>
          </motion.div>

          {/* ── Investors list ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-amber-500 rounded-full"/>
                <h3 className="text-sm font-black text-slate-700">قائمة المستثمرين وحسابات أرباحهم</h3>
              </div>
              <span className="text-[10px] bg-amber-50 px-2.5 py-1 text-amber-700 font-black rounded-lg border border-amber-100">
                إجمالي الشركاء: {investors.length}
              </span>
            </div>

            {investors.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold space-y-2">
                <Users size={40} className="mx-auto text-slate-300" />
                <p>لا يوجد شركاء أو مستثمرون مضافون حالياً.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {investors.map((inv, index) => {
                  const isEditing = editingId === inv.id;
                  
                  // Calculations
                  const totalPaid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
                  const totalShare = (netProfit * inv.percentage) / 100;
                  const remainingShare = totalShare - totalPaid;

                  return (
                    <div
                      key={inv.id}
                      className={`rounded-[2rem] transition-all border p-6 flex flex-col gap-4 ${
                        isEditing
                          ? "ring-2 ring-amber-500 bg-amber-50/10 border-amber-200"
                          : "bg-slate-50/40 border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Top Row: Info / Edit */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xs font-black text-slate-400 bg-slate-200/50 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>

                          {isEditing ? (
                            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full items-center">
                              <div className="relative flex-1 w-full">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                  الاسم :
                                </span>
                                <input
                                  type="text"
                                  value={tempName}
                                  onChange={(e) => setTempName(e.target.value)}
                                  className="w-full bg-white border border-slate-200 text-slate-700 py-3 pl-3 pr-14 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-200 h-11"
                                />
                              </div>
                              <div className="relative w-36 shrink-0">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                  النسبة :
                                </span>
                                <input
                                  type="number"
                                  value={tempPercentage}
                                  onChange={(e) =>
                                    setTempPercentage(e.target.value)
                                  }
                                  className="w-full bg-white border border-slate-200 text-slate-700 py-3 pl-8 pr-14 rounded-xl font-bold text-left focus:outline-none focus:ring-2 focus:ring-amber-200 h-11"
                                  dir="ltr"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                                  %
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between flex-1">
                              <span className="font-extrabold text-slate-700 text-base">
                                {inv.name}
                              </span>
                              <span className="font-black text-amber-600 bg-amber-50 border border-amber-100/60 px-3 py-1.5 rounded-xl text-xs leading-none shrink-0 font-mono">
                                النسبة: {inv.percentage}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Top Area Actions */}
                        <div className="flex items-center gap-2 mt-2 lg:mt-0 shrink-0 select-none">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(inv.id)}
                                className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <Check size={14} />
                                <span>حفظ</span>
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <X size={14} />
                                <span>إلغاء</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Pay Button */}
                              <button
                                onClick={() => setPayingInvestor(inv)}
                                className="px-4 h-10 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all active:scale-90 flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                              >
                                <CreditCard size={14} />
                                <span>دفع مستحقات</span>
                              </button>

                              {/* Account Statement Button */}
                              <button
                                onClick={() => setStatementInvestor(inv)}
                                className="px-4 h-10 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl transition-all active:scale-90 flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                              >
                                <FileText size={14} />
                                <span>كشف حساب</span>
                              </button>

                              {/* Log toggle */}
                              <button
                                onClick={() => setExpandedLogId(expandedLogId === inv.id ? null : inv.id)}
                                className={`w-10 h-10 flex items-center justify-center border rounded-xl transition-all active:scale-90 cursor-pointer ${
                                  expandedLogId === inv.id 
                                    ? "bg-amber-100/50 border-amber-200 text-amber-600" 
                                    : "text-slate-500 hover:text-amber-500 hover:bg-amber-50/50 border-slate-200"
                                }`}
                                title="سجل الوصولات والمدفوعات"
                              >
                                <History size={16} />
                              </button>

                              <button
                                onClick={() => handleStartEdit(inv)}
                                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50/50 border border-slate-200 rounded-xl transition-all active:scale-90 cursor-pointer"
                                title="تعديل نسبة المستثمر"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteInvestor(inv.id)}
                                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 border border-slate-200 rounded-xl transition-all active:scale-90 cursor-pointer"
                                title="حذف المستثمر"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Calculations Panel (Deducted logic visualizer) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white/80 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 font-extrabold mb-1">إجمالي الحصة المستحقة ({inv.percentage}%)</span>
                          <span className="text-sm font-black text-slate-700 font-mono">{formatIQD(totalShare)} د.ع</span>
                        </div>
                        <div className="bg-amber-50/20 p-4 rounded-2xl border border-amber-100/30 flex flex-col justify-center">
                          <span className="text-[10px] text-amber-600/70 font-extrabold mb-1">المبالغ المدفوعة (تم سحبها)</span>
                          <span className="text-sm font-black text-amber-700 font-mono">{formatIQD(totalPaid)} د.ع</span>
                        </div>
                        <div className={`p-4 rounded-2xl border flex flex-col justify-center ${
                          remainingShare < 0 
                            ? "bg-rose-50/30 border-rose-100/40 text-rose-700" 
                            : "bg-emerald-50/30 border-emerald-100/40 text-emerald-700"
                        }`}>
                          <span className="text-[10px] font-extrabold mb-1">المستحق المتبقي (الصافي)</span>
                          <span className="text-sm font-black font-mono">{formatIQD(remainingShare)} د.ع</span>
                        </div>
                      </div>

                      {/* Expandable Payments Log */}
                      {expandedLogId === inv.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-100 pt-4 mt-2 overflow-hidden"
                        >
                          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <h4 className="text-xs font-black text-slate-500 flex items-center gap-1.5">
                              <History size={13} />
                              <span>السجل التاريخي للمسحوبات والوصولات الرسمية</span>
                            </h4>

                            {(!inv.payments || inv.payments.length === 0) ? (
                              <p className="text-xs font-bold text-slate-400 text-center py-4 bg-white/70 rounded-xl border border-slate-50/80">
                                لا توجد دفعات منصرفة لهذا الشريك حالياً.
                              </p>
                            ) : (
                              <div className="overflow-x-auto -mx-3 sm:mx-0">
                                <table className="w-full text-right text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200/50 text-slate-400 font-extrabold">
                                      <th className="pb-2">رقم الوصل</th>
                                      <th className="pb-2">تاريخ الدفع</th>
                                      <th className="pb-2">المبلغ المدفوع</th>
                                      <th className="pb-2">الملاحظات</th>
                                      <th className="pb-2 text-left">الخيارات</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inv.payments.map((p) => (
                                      <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-white/40 font-bold text-slate-600">
                                        <td className="py-2.5 font-mono text-slate-500">#{p.receiptNo || "---"}</td>
                                        <td className="py-2.5">{p.date}</td>
                                        <td className="py-2.5 text-emerald-600 font-mono">{formatIQD(p.amount)} د.ع</td>
                                        <td className="py-2.5 text-slate-400 max-w-xs truncate">{p.notes || "-"}</td>
                                        <td className="py-2.5 text-left space-x-1 space-x-reverse">
                                          <button
                                            onClick={() => handlePrintReceipt({
                                              investorName: inv.name,
                                              amount: p.amount,
                                              date: p.date,
                                              notes: p.notes || "",
                                              receiptNo: p.receiptNo || p.id.slice(-4),
                                            })}
                                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors inline-flex cursor-pointer"
                                            title="إعادة طباعة الوصل"
                                          >
                                            <Printer size={14} />
                                          </button>
                                          <button
                                            onClick={() => handleDeletePayment(inv.id, p.id)}
                                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors inline-flex cursor-pointer"
                                            title="حذف القيد"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Pay Investor Modal */}
      {payingInvestor && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <CreditCard size={22} className="text-emerald-500" />
                <span>صرف دفعة أرباح للشريك</span>
              </h2>
              <button 
                onClick={() => setPayingInvestor(null)} 
                className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-500 flex flex-col gap-1">
                <div>الشريك المستحق: <span className="text-slate-800 font-extrabold">{payingInvestor.name}</span></div>
                <div>النسبة المئوية: <span className="text-slate-800 font-extrabold font-mono">{payingInvestor.percentage}%</span></div>
                <div>الحد الأقصى المتاح حالياً:{" "}
                  <span className="text-emerald-600 font-black font-mono">
                    {formatIQD(((netProfit * payingInvestor.percentage) / 100) - (payingInvestor.payments || []).reduce((sum, p) => sum + p.amount, 0))} د.ع
                  </span>
                </div>
              </div>

              {/* Amount field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 mr-2">المبلغ المطلوب صرفه (د.ع) :</label>
                <input
                  type="text"
                  value={formatWithCommas(payAmount)}
                  onChange={(e) => handleDirectMoneyChange(e, setPayAmount)}
                  placeholder="مثال: 500,000"
                  className="w-full h-12 bg-slate-50 py-3 px-5 rounded-2xl border border-slate-100 font-black text-lg text-slate-800 text-left focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:bg-white"
                  dir="ltr"
                />
              </div>

              {/* Date field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 mr-2">تاريخ الدفع والصرف :</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full h-12 bg-slate-50 py-3 px-5 rounded-2xl border border-slate-100 font-bold text-slate-700 text-right focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:bg-white"
                />
              </div>

              {/* Notes field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 mr-2 font- Cairo">تفاصيل وملاحظات الصرف :</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="مثال: صرف حصة الأرباح المستحقة عن شهر نيسان"
                  rows={3}
                  className="w-full bg-slate-50 py-3 px-5 rounded-2xl border border-slate-100 font-bold text-slate-700 text-right focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:bg-white max-h-24 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmPayment}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/10 transition-colors text-sm cursor-pointer"
              >
                تأكيد الدفع وطباعة الوصل الرسمية
              </button>
              <button
                onClick={() => setPayingInvestor(null)}
                className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-colors text-sm cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hidden container for printing to capture with html2canvas */}
      {printPayment && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div ref={investorReceiptRef}>
            <InvestorPaymentReceiptPrint
              payment={printPayment}
              investorName={printPayment.investorName}
              settings={systemSettings}
            />
          </div>
        </div>
      )}

      {/* Investor Account Statement Modal */}
      <AnimatePresence>
        {statementInvestor && (
          <InvestorAccountStatementModal
            investor={statementInvestor}
            netProfit={netProfit}
            onClose={() => setStatementInvestor(null)}
            systemSettings={systemSettings}
          />
        )}
      </AnimatePresence>

      {/* ── All Investors Group Statement (Simple B&W) ──────── */}
      {showAllInvestorsReport && (() => {
        const investors = systemSettings?.investors || [];
        const invData = investors.map((inv: any) => {
          const share = (netProfit * inv.percentage) / 100;
          const paid = (inv.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
          return { inv, share, paid, remaining: share - paid, payCount: (inv.payments || []).length };
        });
        const totalShare = invData.reduce((s, d) => s + d.share, 0);
        const totalPaid = invData.reduce((s, d) => s + d.paid, 0);
        return (
          <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-amber-600 p-4 text-white flex justify-between items-center shrink-0">
                <h2 className="font-black text-lg">كشف حسابات جميع المستثمرين</h2>
                <div className="flex gap-2">
                  <button onClick={() => { const el = document.getElementById("all-investors-statement-print"); if(el){const w=window.open("","_blank"); if(w){w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><style>*{font-family:Cairo,sans-serif;box-sizing:border-box}body{margin:0;padding:0}@page{size:A4;margin:10mm}@media print{.no-print{display:none!important}}</style></head><body>'+el.innerHTML+'</body></html>'); w.document.close(); setTimeout(()=>{w.print();w.close()},500);}} }} className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-bold hover:bg-white/30 flex items-center gap-1"><Printer size={14}/>طباعة</button>
                  <button onClick={() => setShowAllInvestorsReport(false)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20"><X size={18}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div id="all-investors-statement-print" style={{ fontFamily: "Cairo, sans-serif", direction: "rtl", padding: "20px", color: "#000" }}>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>{systemSettings?.schoolName || "مدارس المرتضى"}</h2>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "4px 0", borderBottom: "2px solid #000", display: "inline-block", paddingBottom: "4px" }}>كشف حسابات المستثمرين</h3>
                    <p style={{ fontSize: "11px", color: "#666", margin: "4px 0" }}>صافي الأرباح: {formatIQD(netProfit)} د.ع | عدد المستثمرين: {investors.length}</p>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #000" }}>
                    <thead>
                      <tr style={{ background: "#f0f0f0" }}>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>ت</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>اسم المستثمر</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>النسبة %</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>حصته من الأرباح</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>المدفوع</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>المتبقي</th>
                        <th style={{ border: "1px solid #000", padding: "6px", fontWeight: 900 }}>الدفعات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invData.map((d, idx) => (
                        <tr key={d.inv.id}>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{idx + 1}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", fontWeight: 700 }}>{d.inv.name}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{d.inv.percentage}%</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{formatIQD(d.share)}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{formatIQD(d.paid)}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center", fontWeight: 700 }}>{formatIQD(d.remaining)}</td>
                          <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>{d.payCount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#f0f0f0", fontWeight: 900 }}>
                        <td colSpan={3} style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>المجموع</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{formatIQD(totalShare)}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{formatIQD(totalPaid)}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{formatIQD(totalShare - totalPaid)}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{invData.reduce((s, d) => s + d.payCount, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div style={{ marginTop: "16px", fontSize: "12px", borderTop: "2px solid #000", paddingTop: "8px" }}>
                    <table style={{ width: "50%", margin: "0 auto", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr><td style={{ padding: "4px 8px", fontWeight: 700 }}>صافي الأرباح:</td><td style={{ padding: "4px 8px", fontWeight: 900 }}>{formatIQD(netProfit)} د.ع</td></tr>
                        <tr><td style={{ padding: "4px 8px", fontWeight: 700 }}>إجمالي الحصص:</td><td style={{ padding: "4px 8px", fontWeight: 900 }}>{formatIQD(totalShare)} د.ع</td></tr>
                        <tr><td style={{ padding: "4px 8px", fontWeight: 700 }}>إجمالي المدفوع:</td><td style={{ padding: "4px 8px", fontWeight: 900 }}>{formatIQD(totalPaid)} د.ع</td></tr>
                        <tr style={{ borderTop: "1px solid #000" }}><td style={{ padding: "4px 8px", fontWeight: 900 }}>نسبة الصرف:</td><td style={{ padding: "4px 8px", fontWeight: 900 }}>{totalShare > 0 ? Math.round((totalPaid / totalShare) * 100) : 0}%</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </motion.div>
  );
}

export default InvestorsManagementSubView;

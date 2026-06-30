/**
 * PreviousDebtsSubView.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, DollarSign, Plus, ArrowRight, X, Trash2, AlertCircle, Download, Check } from "lucide-react";
import type { Student, AppUser, PreviousDebt } from "@/types";
import { formatStudentCode, formatWithCommas } from "@/utils/format";
import { notify } from "@/utils/notify";
import { verifyDeletePassword } from "@/utils/security";
import PrintReport from "@/components/print/PrintReport";

const PreviousDebtsSubView = ({
  onBack,
  students = [],
  onUpdateStudents,
  currentUser,
}: {
  onBack: () => void;
  students: Student[];
  onUpdateStudents: (updated: Student[]) => void;
  currentUser: AppUser | null;
}) => {
  const formatIQD = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const allDebts = useMemo(() => {
    const list: { student: Student; debt: PreviousDebt }[] = [];
    students.forEach((s) => {
      if (s.previousDebts && Array.isArray(s.previousDebts)) {
        s.previousDebts.forEach((d) => {
          list.push({ student: s, debt: d });
        });
      }
    });
    return list;
  }, [students]);

  const totalDebtsAmount = useMemo(() => {
    return allDebts.reduce((sum, item) => sum + item.debt.amount, 0);
  }, [allDebts]);

  const totalPaidAmount = useMemo(() => {
    return allDebts.reduce((sum, item) => sum + (item.debt.paid || 0), 0);
  }, [allDebts]);

  const totalRemainingAmount = totalDebtsAmount - totalPaidAmount;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paying" | "not_paying">("all");
  const [yearFilter, setYearFilter] = useState("الكل");

  // Modals status
  const [showPrint, setShowPrint] = useState(false);
  const [addDebtModalOpen, setAddDebtModalOpen] = useState(false);
  const [payDebtModalOpen, setPayDebtModalOpen] = useState(false);

  // Add Debt fields
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudentSearchText, setSelectedStudentSearchText] = useState("");
  const [newDebtYear, setNewDebtYear] = useState("2024-2025");
  const [newDebtAmount, setNewDebtAmount] = useState("");
  const [newDebtIsPaying, setNewDebtIsPaying] = useState(true);

  // Pay Debt fields
  const [activePayingDebt, setActivePayingDebt] = useState<{ student: Student; debt: PreviousDebt } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPassword, setPaymentPassword] = useState("");

  const studentSearchResults = useMemo(() => {
    if (!selectedStudentSearchText.trim()) return [];
    return students.filter((s) =>
      s.name.toLowerCase().includes(selectedStudentSearchText.toLowerCase()) ||
      s.id.includes(selectedStudentSearchText)
    ).slice(0, 5);
  }, [students, selectedStudentSearchText]);

  const filteredDebts = useMemo(() => {
    return allDebts.filter((item) => {
      const matchSearch = item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.student.id.includes(searchTerm);
      const matchStatus = statusFilter === "all" ? true :
                         statusFilter === "paying" ? item.debt.isPaying === true :
                         item.debt.isPaying === false;
      const matchYear = yearFilter === "الكل" ? true : item.debt.year === yearFilter;
      return matchSearch && matchStatus && matchYear;
    });
  }, [allDebts, searchTerm, statusFilter, yearFilter]);

  const allYears = useMemo(() => {
    const yearsSet = new Set<string>();
    allDebts.forEach(item => {
      if (item.debt.year) yearsSet.add(item.debt.year);
    });
    return Array.from(yearsSet);
  }, [allDebts]);

  const handleTogglePayingStatus = (studentId: string, debtId: string) => {
    const updated = students.map((s) => {
      if (s.id === studentId && s.previousDebts) {
        return {
          ...s,
          previousDebts: s.previousDebts.map((d) =>
            d.id === debtId ? { ...d, isPaying: !d.isPaying } : d
          ),
        };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  const handleAddDebt = () => {
    if (!selectedStudentId) {
      notify("يرجى اختيار طالب أولاً.", "warning");
      return;
    }
    const amt = parseFloat(newDebtAmount);
    if (isNaN(amt) || amt <= 0) {
      notify("يرجى إدخال مبلغ دين صحيح.", "warning");
      return;
    }
    const targetStudent = students.find(s => s.id === selectedStudentId);
    if (!targetStudent) return;

    const updated = students.map((s) => {
      if (s.id === selectedStudentId) {
        const currentDebts = s.previousDebts || [];
        if (currentDebts.some((d) => d.year === newDebtYear)) {
          notify(`هذا الطالب لديه دين مسجل بالفعل لسنة ${newDebtYear}!`, "info");
          return s;
        }
        const newEntry: PreviousDebt = {
          id: Math.random().toString(36).substring(2, 9),
          year: newDebtYear,
          amount: amt,
          paid: 0,
          isPaying: newDebtIsPaying,
        };
        return {
          ...s,
          previousDebts: [...currentDebts, newEntry],
        };
      }
      return s;
    });

    onUpdateStudents(updated);
    notify("تم إضافة الدين السابق بنجاح.", "success");
    setAddDebtModalOpen(false);
    setSelectedStudentId("");
    setSelectedStudentSearchText("");
    setNewDebtAmount("");
  };

  const handlePayDebt = () => {
    if (!activePayingDebt) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      notify("يرجى إدخال مبلغ تسديد صحيح.", "warning");
      return;
    }
    const remaining = activePayingDebt.debt.amount - (activePayingDebt.debt.paid || 0);
    if (amt > remaining) {
      notify(`المبلغ المدخل أكبر من المتبقي للتسديد (${formatIQD(remaining)} د.ع).`, "warning");
      return;
    }

    if (!paymentPassword) {
      notify("يرجى إدخال كلمة مرور الحساب لتأكيد الدفع.", "warning");
      return;
    }
    if (paymentPassword !== currentUser?.password) {
      notify("رمز تأكيد الحساب غير صحيح.", "warning");
      return;
    }

    const updated = students.map((s) => {
      if (s.id === activePayingDebt.student.id) {
        const currentDebts = s.previousDebts || [];
        const updatedDebts = currentDebts.map((d) => {
          if (d.id === activePayingDebt.debt.id) {
            return {
              ...d,
              paid: (d.paid || 0) + amt,
            };
          }
          return d;
        });

        const newPaymentEntry = {
          id: `REC-${Date.now()}`,
          amount: amt,
          date: new Date().toISOString().split("T")[0],
          schoolYear: activePayingDebt.debt.year,
          notes: `تسديد دين سابق لسنة (${activePayingDebt.debt.year})`,
        };

        return {
          ...s,
          previousDebts: updatedDebts,
          payments: [...(s.payments || []), newPaymentEntry],
        };
      }
      return s;
    });

    onUpdateStudents(updated);
    notify("تم تسديد المبلغ بنجاح وتوثيقه في الواردات كـ قسط لسنة " + activePayingDebt.debt.year, "success");
    setPayDebtModalOpen(false);
    setActivePayingDebt(null);
    setPaymentAmount("");
    setPaymentPassword("");
  };

  const handleDeleteDebt = async (studentId: string, debtId: string) => {
    if (window.confirm("هل أنت متأكد من حذف سجل الديون السابقة هذا؟")) {
      const __ok = await verifyDeletePassword(); if (!__ok) return;

      const updated = students.map((s) => {
        if (s.id === studentId && s.previousDebts) {
          return {
            ...s,
            previousDebts: s.previousDebts.filter((d) => d.id !== debtId),
          };
        }
        return s;
      });
      onUpdateStudents(updated);
      notify("تم حذف سجل الديون السابقة بنجاح.", "success");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[70] bg-slate-50 flex flex-col"
      dir="rtl"
    >
      <header className="h-16 bg-rose-500 text-white flex items-center justify-between px-6 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="cursor-pointer">
            <ArrowRight size={20} />
          </button>
          <h1 className="font-black text-sm">الديون السابقة للطلاب</h1>
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
            onClick={()=>setShowPrint(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all mr-2">
            <Download size={13}/><span className="hidden sm:inline">طباعة</span>
          </motion.button>
        </div>
        <button
          onClick={() => {
            setSelectedStudentId("");
            setSelectedStudentSearchText("");
            setNewDebtAmount("");
            setAddDebtModalOpen(true);
          }}
          className="bg-white text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={14} />
          <span>إضافة دين سابق</span>
        </button>
      </header>

      {/* Debts Print Report */}
      {showPrint && (() => {
        return (
          <PrintReport
            title="كشف الديون السابقة"
            columns={[
              {label:"اسم الطالب",key:"studentName",width:"22%",align:"right"},
              {label:"المدرسة",key:"school",width:"15%",align:"right"},
              {label:"المرحلة",key:"grade",width:"8%",align:"center"},
              {label:"السنة الدراسية",key:"year",width:"12%",align:"center"},
              {label:"مبلغ الدين (د.ع)",key:"amountFmt",width:"14%",align:"center"},
              {label:"المسدَّد (د.ع)",key:"paidFmt",width:"14%",align:"center"},
              {label:"المتبقي (د.ع)",key:"remFmt",width:"15%",align:"center"},
            ]}
            rows={filteredDebts.map(item=>{
              const rem = item.debt.amount-(item.debt.paid||0);
              return {
                studentName:item.student.name, school:item.student.school, grade:item.student.grade,
                year:item.debt.year,
                amountFmt:new Intl.NumberFormat("en-US").format(item.debt.amount),
                paidFmt:new Intl.NumberFormat("en-US").format(item.debt.paid||0),
                remFmt:rem>0?new Intl.NumberFormat("en-US").format(rem):"مسدَّد",
                __colors:{paidFmt:"#16a34a",remFmt:rem>0?"#dc2626":"#16a34a"}
              };
            })}
            totals={{
              amountFmt:new Intl.NumberFormat("en-US").format(filteredDebts.reduce((a,d)=>a+d.debt.amount,0)),
              paidFmt:new Intl.NumberFormat("en-US").format(filteredDebts.reduce((a,d)=>a+(d.debt.paid||0),0)),
              remFmt:new Intl.NumberFormat("en-US").format(filteredDebts.reduce((a,d)=>a+Math.max(0,d.debt.amount-(d.debt.paid||0)),0))
            }}
            onClose={()=>setShowPrint(false)}
          />
        );
      })()}

      {/* Stats Board */}
      <div className="bg-white border-b border-slate-100 p-6 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-rose-50 pr-6 pl-4 py-4 rounded-2xl border border-rose-100/50 flex flex-col justify-center">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">
              إجمالي الديون السابقة
            </span>
            <span className="text-xl font-black text-rose-700 font-mono tabular-nums leading-none">
              {formatIQD(totalDebtsAmount)} د.ع
            </span>
          </div>

          <div className="bg-emerald-50 pr-6 pl-4 py-4 rounded-2xl border border-emerald-100/50 flex flex-col justify-center">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">
              الديون المحصلة (المسددة)
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono tabular-nums leading-none">
              {formatIQD(totalPaidAmount)} د.ع
            </span>
          </div>

          <div className="bg-amber-50 pr-6 pl-4 py-4 rounded-2xl border border-amber-100/50 flex flex-col justify-center">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">
              الديون المتبقية
            </span>
            <span className="text-xl font-black text-amber-700 font-mono tabular-nums leading-none">
              {formatIQD(totalRemainingAmount)} د.ع
            </span>
          </div>

          <div className="bg-slate-50 pr-6 pl-4 py-4 rounded-2xl border border-slate-200/50 flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
              عدد الطلاب المطالبين
            </span>
            <span className="text-xl font-black text-slate-700 font-mono tabular-nums leading-none">
              {allDebts.length} طالب
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-100/80 p-6 border-b border-slate-250 flex flex-col md:flex-row gap-4 items-center shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="ابحث باسم الطالب أو كود الطالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white py-3 pr-12 pl-4 rounded-xl text-xs font-bold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">حالة التسديد:</span>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-white px-4 py-3 rounded-xl border border-slate-200 font-bold text-xs"
            >
              <option value="all">الكل</option>
              <option value="paying">يسدد</option>
              <option value="not_paying">لا يسدد</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">السنة الدراسية:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-white px-4 py-3 rounded-xl border border-slate-200 font-bold text-xs font-mono"
            >
              <option value="الكل">الكل</option>
              {allYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          {filteredDebts.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <AlertCircle size={48} className="mx-auto text-slate-200" />
              <p className="text-slate-400 font-bold text-sm">لا توجد ديون سابقة تتطابق مع البحث حالياً.</p>
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 text-xs font-black border-b-2 border-slate-200">
                  <th className="py-4 px-6">كود الطالب</th>
                  <th className="py-4 px-6">اسم الطالب</th>
                  <th className="py-4 px-6 text-center">السنة الدراسية للدين</th>
                  <th className="py-4 px-6 text-left">مبلغ الدين الكلي</th>
                  <th className="py-4 px-6 text-left">المسدد</th>
                  <th className="py-4 px-6 text-left">المتبقي</th>
                  <th className="py-4 px-6 text-center">حالة السداد</th>
                  <th className="py-4 px-6 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDebts.map(({ student, debt }) => {
                  const rem = debt.amount - (debt.paid || 0);
                  return (
                    <tr key={debt.id} className="hover:bg-slate-50/80 transition-colors text-xs font-bold text-slate-700">
                      <td className="py-3 px-6 text-slate-400 font-mono text-[10px]">
                        #{formatStudentCode(student.id)}
                      </td>
                      <td className="py-3 px-6 font-extrabold text-slate-900 text-sm">
                        <div className="flex flex-col">
                          <span>{student.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{student.grade} - {student.section}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center font-mono">
                        {debt.year}
                      </td>
                      <td className="py-3 px-6 text-left font-mono text-slate-800 tabular-nums">
                        {formatIQD(debt.amount)} د.ع
                      </td>
                      <td className="py-3 px-6 text-left font-mono text-emerald-600 tabular-nums">
                        {formatIQD(debt.paid || 0)} د.ع
                      </td>
                      <td className="py-3 px-6 text-left font-mono text-rose-600 tabular-nums">
                        {formatIQD(rem)} د.ع
                      </td>
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => handleTogglePayingStatus(student.id, debt.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black cursor-pointer border transition-all hover:scale-105 active:scale-95 ${
                            debt.isPaying
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${debt.isPaying ? "bg-emerald-500" : "bg-rose-500"}`} />
                          <span>{debt.isPaying ? "يسدد" : "لا يسدد"}</span>
                        </button>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex justify-end items-center gap-2">
                          {rem > 0 ? (
                            <button
                              onClick={() => {
                                setActivePayingDebt({ student, debt });
                                setPaymentAmount(rem.toString());
                                setPaymentPassword("");
                                setPayDebtModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1"
                            >
                              <DollarSign size={13} />
                              <span>تسديد الدين</span>
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 bg-slate-50 border border-dashed text-slate-400 text-xs rounded-lg flex items-center gap-1">
                              <Check size={12} className="text-emerald-500" />
                              <span>تم التسديد بالكامل</span>
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteDebt(student.id, debt.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="حذف سجل الدين"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Debt Modal */}
      {addDebtModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100"
          >
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-lg font-black text-slate-900">إضافة دين سابق من سنة وراء</h3>
              <button
                onClick={() => setAddDebtModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-wide">
                  البحث عن طالب
                </label>
                <input
                  type="text"
                  placeholder="اكتب اسم الطالب للبحث..."
                  value={selectedStudentSearchText}
                  onChange={(e) => {
                    setSelectedStudentSearchText(e.target.value);
                    setSelectedStudentId("");
                  }}
                  className="w-full bg-slate-50 py-3.5 px-4 rounded-xl border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-200"
                />

                {/* Candidate Dropdown list */}
                {studentSearchResults.length > 0 && !selectedStudentId && (
                  <div className="absolute top-[100%] right-0 left-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 mt-1 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {studentSearchResults.map((stu) => (
                      <button
                        key={stu.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(stu.id);
                          setSelectedStudentSearchText(stu.name);
                        }}
                        className="w-full text-right p-3 hover:bg-slate-50 transition-colors block text-xs font-bold text-slate-700"
                      >
                        <span className="text-slate-900 block font-extrabold">{stu.name}</span>
                        <span className="text-[10px] text-slate-400 block">{stu.grade} - {stu.section}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedStudentId && (
                  <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl border border-emerald-100 text-[10px] font-black flex justify-between items-center mt-2">
                    <span>طالب محدد: {selectedStudentSearchText}</span>
                    <button
                      onClick={() => {
                        setSelectedStudentId("");
                        setSelectedStudentSearchText("");
                      }}
                      className="text-emerald-900 hover:text-rose-600"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-wide">
                    السنة الدراسية للدين
                  </label>
                  <select
                    value={newDebtYear}
                    onChange={(e) => setNewDebtYear(e.target.value)}
                    className="w-full bg-slate-50 py-3.5 px-4 rounded-xl border border-slate-100 text-xs font-bold"
                  >
                    <option value="2024-2025">2024-2025</option>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2022-2023">2022-2023</option>
                    <option value="2021-2022">2021-2022</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-wide">
                    المبلغ المطلوب (د.ع)
                  </label>
                  <input
                    type="text"
                    placeholder="مبلغ الدين بالدينار..."
                    value={formatWithCommas(newDebtAmount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                        setNewDebtAmount(raw);
                      }
                    }}
                    className="w-full bg-slate-50 py-3.5 px-4 rounded-xl border border-slate-100 text-xs font-bold font-mono text-left"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                <span className="text-xs font-extrabold text-slate-600">هل الطالب يسدد حالياً؟</span>
                <button
                  type="button"
                  onClick={() => setNewDebtIsPaying(!newDebtIsPaying)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${
                    newDebtIsPaying
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}
                >
                  {newDebtIsPaying ? "نعم - يسدد" : "لا - متوقف"}
                </button>
              </div>

              <div className="flex gap-4 pt-6 mt-4 border-t">
                <button
                  onClick={handleAddDebt}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white py-3.5 rounded-2xl font-black text-xs shadow-md shadow-rose-600/10 transition-all cursor-pointer"
                >
                  إضافة الدين
                </button>
                <button
                  onClick={() => setAddDebtModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-xs transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pay Previous Debt Modal */}
      {payDebtModalOpen && activePayingDebt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100"
          >
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-lg font-black text-slate-900">تسديد دين سابق</h3>
              <button
                onClick={() => setPayDebtModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-50 flex flex-col gap-1.5 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 font-bold ml-1">اسم الطالب:</span>
                  <span className="font-extrabold text-slate-800">{activePayingDebt.student.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold ml-1">السنة الدراسية:</span>
                  <span className="font-mono text-slate-800">{activePayingDebt.debt.year}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold ml-1">المتبقي الكلي من الدين:</span>
                  <span className="font-mono font-black text-rose-600">
                    {formatIQD(activePayingDebt.debt.amount - (activePayingDebt.debt.paid || 0))} د.ع
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-wide">
                  المبلغ المراد دفعه (د.ع)
                </label>
                <input
                  type="number"
                  placeholder="أدخل مبلغ السداد..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 py-3.5 px-4 rounded-xl border border-slate-100 text-xs font-bold text-left font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-rose-500 mr-2 uppercase tracking-wide">
                  رمز تأكيد الحساب
                </label>
                <input
                  type="password"
                  placeholder="أدخل الرمز السري لحسابك لتأكيد الصرف..."
                  value={paymentPassword}
                  onChange={(e) => setPaymentPassword(e.target.value)}
                  className="w-full bg-slate-50 py-3.5 px-4 rounded-xl border border-rose-100 text-xs font-bold text-right"
                />
              </div>

              <div className="flex gap-4 pt-6 mt-4 border-t">
                <button
                  onClick={handlePayDebt}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-3.5 rounded-2xl font-black text-xs shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                >
                  تأكيد تسديد الدين
                </button>
                <button
                  onClick={() => setPayDebtModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-xs transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// ── ProfileView — user profile (display name + avatar) ──────────────────
// ════════════════════════════════════════════════════════════════════════

export default PreviousDebtsSubView;

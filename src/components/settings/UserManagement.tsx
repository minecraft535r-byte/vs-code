/**
 * UserManagement.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Settings, ShieldCheck, Users, UserPlus, ArrowRight, Trash2 } from "lucide-react";
import type { AppUser } from "@/types";
import { notify } from "@/utils/notify";
import { PERMISSIONS } from "@/constants";
import FormInput from "@/components/ui/FormInput";

const UserManagement = ({
  onBack,
  users,
  onAddUser,
  onDeleteUser,
  onEditUser,
  schools,
  isMainAdmin = false,
}: {
  onBack: () => void;
  users: AppUser[];
  onAddUser: (u: AppUser) => void | boolean;
  onDeleteUser: (id: string) => void;
  onEditUser?: (u: AppUser) => void;
  schools: string[];
  isMainAdmin?: boolean;
}) => {
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    password: "",
    permissions: [] as string[],
    allowedSchools: [] as string[],
    notes: "",
  });

  const startEditing = (u: AppUser) => {
    setEditingUser(u);
    setFormData({
      fullname: u.fullname,
      username: u.username,
      password: u.password,
      permissions: [...u.permissions],
      allowedSchools: u.allowedSchools ? [...u.allowedSchools] : (u.linkedSchool ? [u.linkedSchool] : []),
      notes: u.notes || "",
    });
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setFormData({ fullname: "", username: "", password: "", permissions: [], allowedSchools: [], notes: "" });
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePermission = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter((p) => p !== id)
        : [...prev.permissions, id],
    }));
  };

  const toggleSchool = (school: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedSchools: prev.allowedSchools.includes(school)
        ? prev.allowedSchools.filter((s) => s !== school)
        : [...prev.allowedSchools, school],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.fullname || !formData.username || !formData.password) {
      notify("يرجى ملء جميع الحقول المطلوبة", "warning");
      return;
    }

    if (editingUser) {
      // ── EDIT MODE ──
      if (onEditUser) {
        const updated: AppUser = {
          ...editingUser,
          fullname: formData.fullname,
          username: formData.username,
          password: formData.password,
          permissions: formData.permissions,
          allowedSchools: formData.allowedSchools,
          linkedSchool: formData.allowedSchools[0] || editingUser.linkedSchool || "",
          notes: formData.notes,
        };
        onEditUser(updated);
        notify("تم تعديل بيانات المستخدم بنجاح", "success");
      }
      cancelEditing();
      return;
    }

    // ── ADD MODE ──
    const added = onAddUser({
      ...formData,
      id: Date.now().toString(),
      linkedSchool: formData.allowedSchools[0] || "",
    });

    // Don't clear the form if the username was rejected (already taken etc.)
    if (added === false) return;

    setFormData({
      fullname: "",
      username: "",
      password: "",
      permissions: [],
      allowedSchools: [],
      notes: "",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #f8fafc, #eff6ff)" }}
    >
      {/* ── Modern light header ─────────────────────────────── */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between" dir="rtl">
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"
            >
              <User size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">إدارة مستخدمي النظام</h1>
              <p className="text-[10px] font-bold text-slate-400">{users.length} مستخدم مسجل • صلاحيات وأذونات قابلة للتخصيص</p>
            </div>
          </div>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 scrollbar-hide"
        dir="rtl"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
          <div className="space-y-5">

            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 pr-1"
            >
              <div className={`w-1.5 h-5 rounded-full ${editingUser ? "bg-amber-500" : "bg-indigo-500"}`} />
              <h2 className="text-sm font-black text-slate-700">
                {editingUser ? `تعديل حساب: ${editingUser.fullname}` : "إضافة مستخدم جديد"}
              </h2>
              <span className="text-[10px] font-bold text-slate-400">— الحقول المُعلَّمة بنجمة مطلوبة</span>
            </motion.div>

            {editingUser && (
              <motion.div
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3"
              >
                <Settings size={16} className="text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-800 leading-relaxed">
                  أنت تعدّل حساب <span className="font-black">@{editingUser.username}</span> — غيّر ما تريد واضغط "حفظ التعديلات"
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormInput
                    label="الاسم الثلاثي :"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    placeholder="الاسم الكامل للمستخدم"
                    required
                  />
                  <FormInput
                    label="اسم المستخدم :"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="username"
                    required
                  />
                  <FormInput
                    label="كلمة المرور :"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    type="password"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 mr-2">
                    الصلاحيات :
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {PERMISSIONS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePermission(p.id)}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                          formData.permissions.includes(p.id)
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                            : "bg-white text-slate-400 border-slate-100 hover:border-blue-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 mr-2">
                    الملاحظات :
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="اكتب ملاحظاتك هنا"
                    className="w-full h-24 bg-slate-50/50 py-4 px-6 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all border border-slate-100 font-bold resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full text-white font-black py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all relative overflow-hidden"
                  style={{ background: editingUser
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                >
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="inline-flex"
                  >
                    {editingUser ? <Settings size={18} strokeWidth={3} /> : <UserPlus size={18} strokeWidth={3} />}
                  </motion.span>
                  <span>{editingUser ? "حفظ التعديلات" : "إضافة المستخدم وتفعيل الصلاحيات"}</span>
                </motion.button>

                {editingUser && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="w-full py-3 rounded-2xl border-2 border-slate-200 text-slate-500 font-black hover:bg-slate-50 transition-all"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </form>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-2 pr-1"
            >
              <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
              <h2 className="text-sm font-black text-slate-700">المستخدمون المضافون</h2>
              <span className="text-[10px] font-bold text-slate-400">— {users.length} حساب</span>
            </motion.div>
            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                  <Users className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="text-slate-400 font-bold">
                    لا يوجد مستخدمين مضافين حالياً
                  </p>
                </div>
              ) : (
                users.map((u) => {
                  const isActive = u.isActive !== false; // default true
                  const activeDays = u.activatedAt
                    ? Math.floor((Date.now() - new Date(u.activatedAt).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  const handleToggleActive = () => {
                    if (!onEditUser) return;
                    const updated: AppUser = {
                      ...u,
                      isActive: !isActive,
                      ...(isActive
                        ? { deactivatedAt: new Date().toISOString() }
                        : { deactivatedAt: undefined, activatedAt: u.activatedAt || new Date().toISOString() }),
                    };
                    onEditUser(updated);
                    notify(isActive ? `تم تعطيل حساب ${u.fullname}` : `تم تفعيل حساب ${u.fullname}`, isActive ? "warning" : "success");
                  };

                  const handleRenew = (plan: "monthly" | "yearly") => {
                    if (!onEditUser) return;
                    const now = new Date();
                    // Start from expiry if not expired yet, otherwise from now
                    const base = u.expiresAt && new Date(u.expiresAt) > now ? new Date(u.expiresAt) : now;
                    const expiry = new Date(base);
                    if (plan === "yearly") expiry.setFullYear(expiry.getFullYear() + 1);
                    else expiry.setMonth(expiry.getMonth() + 1);
                    onEditUser({
                      ...u,
                      isActive: true,
                      subscriptionPlan: plan,
                      expiresAt: expiry.toISOString(),
                      deactivatedAt: undefined,
                    });
                    notify(`تم تجديد اشتراك ${u.fullname} (${plan === "yearly" ? "سنوي" : "شهري"}) حتى ${expiry.toLocaleDateString("ar-IQ")}`, "success");
                  };

                  const isExpired = u.expiresAt ? new Date(u.expiresAt) < new Date() : false;
                  const daysLeft = u.expiresAt ? Math.ceil((new Date(u.expiresAt).getTime() - Date.now()) / 86400000) : null;

                  return (
                  <motion.div
                    layout
                    key={u.id}
                    className={`bg-white p-5 rounded-3xl shadow-sm border space-y-4 group hover:shadow-xl transition-all ${
                      isActive ? "border-slate-100" : "border-rose-200 bg-rose-50/30"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                          isActive ? "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500" : "bg-rose-100 text-rose-400"
                        }`}>
                          <User size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-800">{u.fullname}</h3>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-100 text-rose-700 border border-rose-200"
                            }`}>
                              {isActive ? "✓ مفعّل" : "✕ معطّل"}
                            </span>
                          </div>
                          <p className="text-xs text-blue-500 font-bold tracking-wider">
                            @{u.username}
                          </p>
                          {activeDays !== null && isActive && (
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              مفعّل منذ {activeDays} يوم
                            </p>
                          )}
                          {!isActive && u.deactivatedAt && (
                            <p className="text-[10px] text-rose-400 font-bold mt-0.5">
                              معطّل منذ {Math.floor((Date.now() - new Date(u.deactivatedAt).getTime()) / (1000 * 60 * 60 * 24))} يوم
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleToggleActive}
                          className={`w-8 h-8 flex items-center justify-center transition-colors rounded-full ${
                            isActive ? "text-slate-300 hover:text-rose-500 hover:bg-rose-50" : "text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                        >
                          {isActive ? <ShieldCheck size={15} /> : <ShieldCheck size={15} />}
                        </button>
                        <button
                          onClick={() => startEditing(u)}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-amber-600 transition-colors rounded-full hover:bg-amber-50"
                          title="تعديل الحساب"
                        >
                          <Settings size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50"
                          title="حذف الحساب"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 space-y-3">
                      {/* Subscription bar */}
                      <div className={`flex items-center justify-between p-3 rounded-xl text-xs font-black ${
                        isExpired ? "bg-rose-50 border border-rose-200 text-rose-700"
                        : daysLeft !== null && daysLeft <= 7 ? "bg-amber-50 border border-amber-200 text-amber-700"
                        : "bg-emerald-50 border border-emerald-100 text-emerald-700"
                      }`}>
                        <span>
                          {isExpired ? `⚠ منتهي منذ ${Math.abs(daysLeft || 0)} يوم`
                           : daysLeft !== null ? `✓ متبقي ${daysLeft} يوم (${u.subscriptionPlan === "yearly" ? "سنوي" : "شهري"})`
                           : "بدون اشتراك"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleRenew("monthly")}
                            className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-[9px] font-black transition-all">
                            +شهر
                          </button>
                          <button onClick={() => handleRenew("yearly")}
                            className="px-2 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[9px] font-black transition-all">
                            +سنة
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block w-full mb-1">
                          الصلاحيات:
                        </span>
                        {u.permissions.map((pId) => {
                          const p = PERMISSIONS.find((item) => item.id === pId);
                          return (
                            <span
                              key={pId}
                              className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg"
                            >
                              {p?.label}
                            </span>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block w-full mb-1">
                          المدرسة المرتبطة:
                        </span>
                        {(u.linkedSchool || u.allowedSchools?.[0]) ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-black rounded-lg border border-emerald-100">
                            🏫 {u.linkedSchool || u.allowedSchools?.[0]}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold">غير محدد</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default UserManagement;

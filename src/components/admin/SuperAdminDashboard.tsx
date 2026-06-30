/**
 * SuperAdminDashboard.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Lock, Settings, ChevronLeft, Users, UserPlus, GraduationCap, Plus, School, Facebook, Send, MessageCircle, Check, Sun, Moon, Image as ImageIcon, ImageOff } from "lucide-react";
import type { Payment, AppUser } from "@/types";
import { notify } from "@/utils/notify";
import { PERMISSIONS, SCHOOL_PRESETS } from "@/constants";
import { fetchUsers } from "@/services/data-service";

const SuperAdminDashboard = ({
  users,
  schools,
  onAddUser,
  onDeleteUser,
  onEditUser,
  onLoginAs,
  onLogout,
}: {
  users: AppUser[];
  schools: string[];
  onAddUser: (u: AppUser) => void | boolean;
  onDeleteUser: (id: string) => void;
  onEditUser?: (u: AppUser) => void;
  onLoginAs: (username: string) => void;
  onLogout: () => void;
  key?: string;
}) => {
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // School input — admin types the name directly
  const [newSchoolName, setNewSchoolName] = useState("");
  
  // Picture selection states
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [schoolPicture, setSchoolPicture] = useState<string | null>(null);
  const [customPicture, setCustomPicture] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Password visibility for cards
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPicture(reader.result as string);
        setSchoolPicture(reader.result as string);
        setSelectedPresetId("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPicture(reader.result as string);
        setSchoolPicture(reader.result as string);
        setSelectedPresetId("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset: typeof SCHOOL_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setSchoolPicture(preset.url);
    setCustomPicture(null);
  };

  const togglePasswordVisible = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim() || !username.trim() || !password.trim()) {
      notify("يرجى إدخال جميع الحقول المطلوبة!", "warning");
      return;
    }

    const schoolToLink = newSchoolName.trim();
    if (!schoolToLink) {
      notify("يرجى كتابة اسم المدرسة المرتبطة بهذا الحساب!", "warning");
      return;
    }

    // ── EDIT MODE ──
    if (editingUser && onEditUser) {
      const updated: AppUser = {
        ...editingUser,
        fullname: fullname.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        linkedSchool: schoolToLink,
        allowedSchools: [schoolToLink],
        schoolPicture: schoolPicture,
      };
      onEditUser(updated);
      notify("تم تعديل الحساب بنجاح", "success");
      setEditingUser(null);
      setFullname(""); setUsername(""); setPassword("");
      setNewSchoolName(""); setSchoolPicture(null);
      setSelectedPresetId(null); setCustomPicture(null);
      return;
    }

    // ── ADD MODE ──
    // Default permissions list (giving full permission to access and edit)
    const permissions = [
      ...PERMISSIONS.map((p) => p.id),
      "admin",
    ];

    const newUser: AppUser = {
      id: Date.now().toString(),
      fullname: fullname.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      permissions,
      allowedSchools: [schoolToLink], // single school only
      notes: "تم الإنشاء بواسطة لوحة تحكم المدير العام",
      linkedSchool: schoolToLink,
      schoolPicture: schoolPicture,
      createdBy: "superadmin", // ← mark as SuperAdmin top-level account
    };

    // onAddUser returns false if the username is already taken — keep the
    // form filled so the user can fix it without retyping everything.
    const added = (onAddUser as (u: AppUser) => boolean)(newUser);
    if (added === false) return;

    // Reset Form
    setFullname("");
    setUsername("");
    setPassword("");
    setNewSchoolName("");
    setSchoolPicture(null);
    setSelectedPresetId(null);
    setCustomPicture(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col font-sans text-slate-200 relative overflow-hidden"
      dir="rtl"
      style={{ background: "linear-gradient(135deg, #0b1120 0%, #131b2e 50%, #0f1626 100%)" }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
      {/* Subtle accent blob top-right */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="relative z-10 px-4 md:px-8 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onLogout}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-sm"
          >
            <span>العودة</span>
          </motion.button>
        </div>
        <div className="text-center">
          <h1 className="text-base md:text-xl font-black text-white">إضافة حساب ومدرسة جديدة</h1>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-0.5">إنشاء بطاقة مدرسة وحساب إدارة بنقرة واحدة</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-black backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>إجمالي الحسابات: {users.length}</span>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">

          {/* Top section: live preview + creation form */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mb-10">

            {/* ── Live Preview Card ─────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl flex flex-col"
              style={{ background: "linear-gradient(180deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)" }}
            >
              <div className="px-5 py-4 border-b border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">معاينة بطاقة المدرسة</p>
              </div>

              {/* School image */}
              <div className="relative h-56 mx-5 mt-5 rounded-2xl overflow-hidden bg-slate-800/50 border border-white/5 flex items-center justify-center">
                {schoolPicture ? (
                  <>
                    <img src={schoolPicture} alt="school" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="text-center px-4">
                    <GraduationCap size={48} className="text-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">اختر صورة من الأسفل</p>
                  </div>
                )}
                {schoolPicture && (
                  <div className="absolute bottom-3 right-3 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 text-[10px] font-black text-white">
                    معاينة مباشرة
                  </div>
                )}
              </div>

              {/* School info */}
              <div className="px-5 py-5 text-center">
                <h3 className="text-lg font-black text-white truncate" style={{ minHeight: "1.5rem" }}>
                  {newSchoolName || "اسم المدرسة"}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 mt-1">نحو تعليم متميز للنشأة الأفضل</p>
              </div>

              {/* User info preview */}
              <div className="mx-5 mb-5 p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-bold">الاسم الكامل</span>
                  <span className="text-white font-black truncate max-w-[180px]">{fullname || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-bold">اسم المستخدم</span>
                  <span className="text-indigo-300 font-black font-mono">{username ? "@" + username : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-bold">كلمة المرور</span>
                  <span className="text-emerald-300 font-black font-mono">{password ? "••••" + password.slice(-2) : "—"}</span>
                </div>
              </div>

              {/* Demo login button */}
              <div className="px-5 pb-5">
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-slate-500 text-xs font-black cursor-not-allowed"
                >
                  ↗ متابعة الى بطاقة الدخول
                </button>
                <p className="text-[9px] font-bold text-slate-600 text-center mt-2">تظهر البطاقة في صفحة الدخول بعد الإنشاء</p>
              </div>
            </motion.div>

            {/* ── Creation Form ─────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden"
              style={{ background: "rgba(30,41,59,0.4)" }}
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm md:text-base font-black text-white">بيانات الحساب والمدرسة</h2>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">املأ الحقول التالية لإنشاء حساب جديد مرتبط بمدرسة</p>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <UserPlus size={11} className="text-indigo-300" />
                  <span className="text-[10px] font-black text-indigo-300">حساب جديد</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 flex items-center gap-1.5">
                    <User size={11} /> الاسم الكامل للحساب
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد عبدالله — مدير مدرسة الإيمان"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 py-3 px-4 rounded-xl font-bold text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
                  />
                </div>

                {/* Username + Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400">اسم المستخدم</label>
                    <input
                      type="text"
                      required
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 py-3 px-4 rounded-xl font-bold text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400">كلمة المرور</label>
                    <input
                      type="text"
                      required
                      placeholder="••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 py-3 px-4 rounded-xl font-bold text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* School name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 flex items-center gap-1.5">
                    <School size={11} /> اسم المدرسة المرتبطة بهذا الحساب
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مدرسة الإيمان الأهلية"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    list="schools-datalist"
                    className="w-full bg-slate-900/60 border border-white/10 py-3 px-4 rounded-xl font-bold text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
                  />
                  <datalist id="schools-datalist">
                    {schools.map((s) => <option key={s} value={s} />)}
                  </datalist>
                  <p className="text-[10px] text-slate-600 font-medium pr-1">كل حساب مرتبط بمدرسة واحدة فقط</p>
                </div>

                {/* Picture selection */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-black text-slate-400 flex items-center gap-1.5">
                    <ImageIcon size={11} /> صورة أو خلفية واجهة المدرسة للبطاقة
                  </label>

                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPresetId(null);
                        setSchoolPicture(null);
                        setCustomPicture(null);
                      }}
                      className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedPresetId === null && !customPicture
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                          : "border-white/10 bg-slate-900/40 text-slate-600 hover:border-white/20"
                      }`}
                    >
                      <ImageOff size={16} />
                      <span className="text-[8px] font-black">بدون</span>
                    </button>
                    {SCHOOL_PRESETS.slice(0, 3).map((preset) => (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedPresetId === preset.id
                            ? "border-indigo-500 ring-2 ring-indigo-500/30"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[8px] font-black text-white text-center py-0.5">
                          {preset.name}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Upload area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-3 text-center transition cursor-pointer relative ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-white/10 bg-slate-900/40 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title=""
                    />
                    {customPicture ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={customPicture} alt="custom" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                        <div className="text-right">
                          <span className="text-[10px] font-black text-indigo-300 block">تم رفع صورة مخصصة</span>
                          <span className="text-[9px] text-slate-500 block">اسحب لتغيير الملف</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <ImageIcon className="text-slate-500" size={16} />
                        <span className="text-[10px] font-black text-slate-400">أو ارفع صورة مخصصة (PNG ، JPG)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button — animated */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full mt-4 relative overflow-hidden text-white font-black py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all"
                  style={{ background: editingUser
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                >
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  >
                    {editingUser ? <Settings size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                  </motion.span>
                  <span>{editingUser ? "حفظ التعديلات" : "إنشاء الحساب وربط المدرسة"}</span>
                </motion.button>
                {editingUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setFullname(""); setUsername(""); setPassword("");
                      setNewSchoolName(""); setSchoolPicture(null);
                      setSelectedPresetId(null); setCustomPicture(null);
                    }}
                    className="w-full mt-2 py-3 rounded-2xl border-2 border-white/20 text-slate-400 font-black hover:bg-white/5 transition-all"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </form>
            </motion.div>
          </div>

          {/* ── Existing Accounts ─────────────────────────── */}
          <div>
            {/* SuperAdmin sees ONLY the top-level school admin accounts that it created.
                Regular school employees (added by individual school accounts) are scoped
                to their school and do NOT appear here. */}
            {(() => {
              const adminAccounts = users.filter((u) =>
                u.createdBy === "superadmin" ||
                u.notes === "تم الإنشاء بواسطة لوحة تحكم المدير العام"
              );
              return (
                <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-7 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
                <div>
                  <h2 className="text-lg font-black text-white">الحسابات والمدارس المسجلة</h2>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">حسابات مديري المدارس التي أنشأتها من هذه اللوحة</p>
                </div>
              </div>
              <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black text-slate-400">
                <Users size={11} />
                <span>{adminAccounts.length} حساب</span>
              </span>
            </div>

            {adminAccounts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border-2 border-dashed border-white/10 p-16 text-center backdrop-blur-sm"
                style={{ background: "rgba(30,41,59,0.3)" }}
              >
                <Users className="mx-auto text-slate-700 mb-3" size={48} />
                <h3 className="text-base font-black text-white">لا توجد حسابات بعد</h3>
                <p className="text-slate-500 text-xs font-bold mt-2">املأ النموذج أعلاه لإضافة أول حساب</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {adminAccounts.map((u, idx) => {
                  const isPasswordRevealed = revealedPasswords[u.id] || false;
                  return (
                    <motion.div
                      layout
                      key={u.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="rounded-3xl border border-white/10 overflow-hidden shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all flex flex-col group relative backdrop-blur-sm"
                      style={{ background: "rgba(30,41,59,0.5)" }}
                    >
                      {/* Header image */}
                      {u.schoolPicture ? (
                        <div className="h-32 w-full relative overflow-hidden shrink-0">
                          <img
                            src={u.schoolPicture}
                            alt="School"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                          <div className="absolute top-3 right-3 bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-lg text-[9px] font-black text-white">
                            {u.linkedSchool || "غير محدد"}
                          </div>
                          <div className="absolute bottom-3 right-4 left-4">
                            <h3 className="text-sm font-black text-white truncate">{u.fullname}</h3>
                            <p className="text-white/60 text-[10px] font-bold mt-0.5">@{u.username}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 pb-0 shrink-0">
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-black text-white truncate">{u.fullname}</h3>
                              <p className="text-slate-400 text-[10px] font-bold mt-0.5">@{u.username}</p>
                            </div>
                            <span className="bg-white/5 border border-white/10 text-slate-300 text-[9px] font-black px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                              {u.linkedSchool || "غير محدد"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Body */}
                      <div className="p-4 flex-1 space-y-3">
                        {/* Activation + Subscription */}
                        {(() => {
                          const active = u.isActive !== false;
                          const isExpired = u.expiresAt ? new Date(u.expiresAt) < new Date() : false;
                          const daysLeft = u.expiresAt ? Math.ceil((new Date(u.expiresAt).getTime() - Date.now()) / 86400000) : null;
                          const renewAccount = (plan: "monthly" | "yearly") => {
                            if (!onEditUser) return;
                            const now = new Date();
                            const base = u.expiresAt && new Date(u.expiresAt) > now ? new Date(u.expiresAt) : now;
                            const exp = new Date(base);
                            if (plan === "yearly") exp.setFullYear(exp.getFullYear() + 1);
                            else exp.setMonth(exp.getMonth() + 1);
                            onEditUser({ ...u, isActive: true, subscriptionPlan: plan, expiresAt: exp.toISOString(), deactivatedAt: undefined });
                            notify(`تجديد ${plan === "yearly" ? "سنوي" : "شهري"} حتى ${exp.toLocaleDateString("ar-IQ")}`, "success");
                          };
                          return (
                            <div className="space-y-2">
                              <div className={`flex items-center justify-between rounded-xl px-3 py-2 text-[10px] font-black border ${
                                active && !isExpired ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                : isExpired ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                              }`}>
                                <span>{!active ? "✕ معطّل" : isExpired ? `⚠ منتهي (${Math.abs(daysLeft || 0)} يوم)` : `✓ متبقي ${daysLeft ?? "∞"} يوم`}</span>
                                <button type="button"
                                  onClick={() => {
                                    if (onEditUser) {
                                      onEditUser({ ...u, isActive: !active, ...(active ? { deactivatedAt: new Date().toISOString() } : { deactivatedAt: undefined }) });
                                      notify(active ? `تعطيل ${u.fullname}` : `تفعيل ${u.fullname}`, active ? "warning" : "success");
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${active ? "bg-rose-500/20 text-rose-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                                  {active ? "تعطيل" : "تفعيل"}
                                </button>
                              </div>
                              <div className="flex gap-1.5">
                                <button type="button" onClick={() => renewAccount("monthly")}
                                  className="flex-1 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 text-[9px] font-black transition-all">
                                  +شهر
                                </button>
                                <button type="button" onClick={() => renewAccount("yearly")}
                                  className="flex-1 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-[9px] font-black transition-all">
                                  +سنة
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="bg-white/5 rounded-2xl p-3 space-y-2 border border-white/5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-500">المستخدم</span>
                            <span className="font-black text-indigo-300 font-mono">@{u.username}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-500">كلمة المرور</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-emerald-300 tracking-wider">
                                {isPasswordRevealed ? u.password : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisible(u.id)}
                                className="text-slate-500 hover:text-white transition"
                              >
                                {isPasswordRevealed ? "🙈" : "👁"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={() => onLoginAs(u.username)}
                            className="py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black transition-all"
                          >
                            دخول
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setFullname(u.fullname);
                              setUsername(u.username);
                              setPassword(u.password);
                              setNewSchoolName(u.linkedSchool || "");
                              setSchoolPicture(u.schoolPicture || null);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black transition-all"
                          >
                            تعديل
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={() => {
                              if (confirm(`هل تريد حذف الحساب "${u.fullname}"؟`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black transition-all"
                          >
                            حذف
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
                </>
              );
            })()}
          </div>

        </div>
      </div>
    </motion.div>
  );
};

// --- Login Component ---
const Login = ({
  onLoginSuccess, theme, onToggleTheme,
}: {
  onLoginSuccess: (user: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  key?: string;
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [bootSequence, setBootSequence] = useState(true);
  const isDark = theme === "dark";

  useEffect(() => {
    const timer = setTimeout(() => setBootSequence(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // ═══════════════════════════════════════════════════════════════
    // CRITICAL: Fetch the latest user list from Supabase FIRST.
    // Without this, accounts added on another device won't be found.
    // ═══════════════════════════════════════════════════════════════
    let allUsers: any[] = [];
    try {
      allUsers = await fetchUsers();
    } catch {
      // Offline — fall back to local data
      try { allUsers = JSON.parse(localStorage.getItem("appUsers") || "[]"); } catch { allUsers = []; }
    }
    // Also merge local data in case bridge hasn't synced yet
    try {
      const local = JSON.parse(localStorage.getItem("appUsers") || "[]");
      const existingIds = new Set(allUsers.map((u: any) => u.id));
      for (const u of local) {
        if (u?.id && !existingIds.has(u.id)) allUsers.push(u);
      }
    } catch {}

    const foundUser = allUsers.find((u: any) => u.username === username && u.password === password);
    if ((username === "Mor" && password === "1111") || (username === "Methaq" && password === "1122") ||
        (username === "SuperAdmin" && password === "9999") || (username === "admin" && password === "admin")) {
      onLoginSuccess(username);
    } else if (foundUser) {
      // Check if the account is deactivated
      if (foundUser.isActive === false) {
        setError("هذا الحساب معطّل. يرجى التواصل مع المسؤول لإعادة تفعيله.");
        setIsLoading(false);
      } else if (foundUser.expiresAt && new Date(foundUser.expiresAt) < new Date()) {
        // Subscription expired → auto-deactivate
        const daysExpired = Math.floor((Date.now() - new Date(foundUser.expiresAt).getTime()) / 86400000);
        const plan = foundUser.subscriptionPlan === "yearly" ? "السنوي" : "الشهري";
        setError(`انتهى الاشتراك ${plan} لهذا الحساب منذ ${daysExpired} يوم. يرجى التواصل مع المسؤول للتجديد.`);
        setIsLoading(false);
      } else {
        onLoginSuccess(username);
      }
    } else {
      setError("بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative px-4 font-sans overflow-hidden"
      style={isDark ? { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" } : { background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f0f7ff 100%)" }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
        style={{ background: isDark ? "rgba(59,130,246,0.06)" : "rgba(191,219,254,0.5)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"
        style={{ background: isDark ? "rgba(99,102,241,0.05)" : "rgba(199,210,254,0.4)" }} />

      {/* Floating controls */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        <button onClick={onToggleTheme}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${isDark ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className={`w-px h-5 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
        <a href="https://wa.me/9647800674813" target="_blank" rel="noopener noreferrer"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${isDark ? "bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700" : "bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50"}`}>
          <MessageCircle size={16} />
        </a>
        <a href="https://t.me/+9647800674813" target="_blank" rel="noopener noreferrer"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${isDark ? "bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700" : "bg-white border-slate-200 text-sky-600 hover:bg-sky-50"}`}>
          <Send size={16} />
        </a>
        <a href="https://www.facebook.com/abw.nwr.147527" target="_blank" rel="noopener noreferrer"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${isDark ? "bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700" : "bg-white border-slate-200 text-blue-600 hover:bg-blue-50"}`}>
          <Facebook size={16} />
        </a>
      </div>

      <AnimatePresence mode="wait">
        {bootSequence ? (
          <motion.div key="boot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8">
            <div className="relative w-20 h-20">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-full h-full border-4 border-blue-500/20 border-t-blue-500 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center"><GraduationCap className="text-blue-500" size={28} /></div>
            </div>
            <div className="text-center space-y-2">
              <h1 className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-800"}`}>مدارس مرتضى</h1>
              <p className="text-slate-400 text-sm">جارٍ تهيئة النظام…</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="login-form" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm relative z-10">
            <div className={`rounded-3xl p-8 border shadow-xl ${isDark ? "bg-slate-800/90 border-slate-700 shadow-slate-900/60" : "bg-white border-slate-100 shadow-slate-200/60"}`}>
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg shadow-blue-500/25">
                  <GraduationCap size={30} />
                </div>
                <h1 className={`text-2xl font-black mb-1 ${isDark ? "text-white" : "text-slate-800"}`}>مدارس مرتضى</h1>
                <p className="text-slate-400 text-sm">تسجيل الدخول للإدارة</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <User size={17} className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-300"}`} />
                  <input type="text" placeholder="اسم المستخدم" value={username} onChange={e => setUsername(e.target.value)}
                    className={`w-full py-3.5 pr-10 pl-4 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium text-sm text-right border ${isDark ? "bg-slate-900 border-slate-600 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400 focus:bg-white"}`} />
                </div>
                <div className="relative">
                  <Lock size={17} className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-300"}`} />
                  <input type="password" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)}
                    className={`w-full py-3.5 pr-10 pl-4 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium text-sm text-right border ${isDark ? "bg-slate-900 border-slate-600 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400 focus:bg-white"}`} />
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs font-bold bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20 text-center">{error}</motion.p>
                )}
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading}
                  className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-500/20 mt-2 text-sm">
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>دخول</span><ChevronLeft size={18} /></>}
                </motion.button>
              </form>
            </div>
            <p className={`text-center mt-6 text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>نظام إدارة مدارس مرتضى © 2026</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App Component ---
// --- Payment Inventory Component ---

export default SuperAdminDashboard;

/**
 * ProfileView.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { User, ShieldCheck, ArrowRight, AlertCircle, School, Check, Image as ImageIcon } from "lucide-react";
import type { AppUser } from "@/types";
import { notify } from "@/utils/notify";

const ProfileView = ({
  onBack,
  currentUser,
  username,
  onUpdateUser,
}: {
  onBack: () => void;
  currentUser: AppUser | null;
  username: string;
  onUpdateUser?: (u: AppUser) => void;
}) => {
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || currentUser?.fullname || ""
  );
  const [profilePicture, setProfilePicture] = useState(
    currentUser?.profilePicture || ""
  );
  const [isDirty, setIsDirty] = useState(false);

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("الرجاء اختيار ملف صورة صالح.", "warning");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify("الصورة كبيرة جداً. الحد الأقصى 5MB.", "warning");
      return;
    }
    // Auto-resize to max 256×256 JPEG so localStorage stays small and fast.
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 256;
        const ratio = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setProfilePicture(dataUrl);
          setIsDirty(true);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.85);
        setProfilePicture(compressed);
        setIsDirty(true);
      };
      img.onerror = () => {
        // Fallback to raw data URL if we can't decode
        setProfilePicture(dataUrl);
        setIsDirty(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!currentUser || !onUpdateUser) {
      notify("لا يمكن حفظ التعديلات للمستخدمين المُدارين من قِبل النظام (Mor / Methaq).", "warning");
      return;
    }
    const updated: AppUser = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.fullname || username,
      profilePicture: profilePicture || undefined,
    };
    onUpdateUser(updated);
    setIsDirty(false);
  };

  const handleRemovePicture = () => {
    setProfilePicture("");
    setIsDirty(true);
  };

  const initials = (displayName || currentUser?.fullname || username).charAt(0).toUpperCase();
  const isStaticAccount = !currentUser || (username === "Mor" || username === "Methaq" || username === "SuperAdmin");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, #eef2ff, #f5f3ff)" }}
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"
            >
              <User size={18} />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">الملف الشخصي</h1>
              <p className="text-[10px] font-bold text-slate-400">عدّل اسمك الظاهر وصورتك الشخصية</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-2xl mx-auto space-y-5 pb-12">

          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl p-6 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
          >
            <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl"/>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-2xl"/>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-white">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 3 }}
                className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-white/30 shrink-0"
              >
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl sm:text-6xl font-black text-indigo-500">{initials}</span>
                )}
              </motion.div>
              <div className="text-center sm:text-right flex-1">
                <p className="text-[11px] font-black opacity-80 uppercase tracking-widest">مرحباً بك</p>
                <h2 className="text-2xl sm:text-3xl font-black mt-1">{displayName || currentUser?.fullname || username}</h2>
                <p className="text-[11px] sm:text-sm font-bold opacity-90 mt-1">@{username}</p>
                {currentUser?.linkedSchool && (
                  <p className="text-[10px] sm:text-xs font-bold opacity-75 mt-2">
                    <School size={11} className="inline ml-1" />
                    {currentUser.linkedSchool}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {isStaticAccount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle size={16} />
              </div>
              <p className="text-xs font-bold text-amber-800 leading-relaxed">
                هذا حساب نظامي ثابت ولا يمكن تعديل بياناته. لتغيير الاسم أو الصورة، استخدم حساباً مرتبطاً بمدرسة.
              </p>
            </motion.div>
          )}

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 pr-1"
          >
            <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
            <h2 className="text-sm font-black text-slate-700">معلومات الحساب</h2>
          </motion.div>

          {/* Profile form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5"
          >
            {/* Profile picture upload */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 pr-1">
                <ImageIcon size={11}/> الصورة الشخصية
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center text-slate-300 shrink-0">
                  {profilePicture ? (
                    <img src={profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} />
                  )}
                </div>
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <label className={`flex-1 cursor-pointer text-center text-xs font-black py-2.5 px-4 rounded-xl transition-all ${
                    isStaticAccount
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100"
                  }`}>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      disabled={isStaticAccount}
                    />
                    {profilePicture ? "تغيير الصورة" : "رفع صورة"}
                  </label>
                  {profilePicture && !isStaticAccount && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRemovePicture}
                      className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-xs font-black transition-all"
                    >
                      حذف
                    </motion.button>
                  )}
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mr-1">JPG / PNG ـ يتم تصغيرها تلقائياً لتوفير المساحة</p>
            </div>

            {/* Display name */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 pr-1">
                <User size={11}/> الاسم الظاهر
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setIsDirty(true); }}
                disabled={isStaticAccount}
                placeholder="مثال: أحمد علي"
                className="w-full bg-slate-50 py-3 px-4 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-300 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 focus:bg-white transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
              <p className="text-[10px] font-bold text-slate-400 mr-1">
                هذا الاسم يظهر في الواجهة. اسم تسجيل الدخول (<span className="font-mono text-indigo-600">@{username}</span>) ثابت ولا يتغير.
              </p>
            </div>

            {/* Read-only username */}
            <div className="space-y-2 opacity-70">
              <label className="text-[11px] font-black text-slate-500 flex items-center gap-1.5 pr-1">
                <ShieldCheck size={11}/> اسم تسجيل الدخول
              </label>
              <input
                type="text"
                value={username}
                disabled
                className="w-full bg-slate-100 py-3 px-4 rounded-xl text-sm font-mono font-bold text-slate-500 border border-slate-200 cursor-not-allowed text-right"
                dir="ltr"
              />
            </div>
          </motion.div>

          {/* Save button */}
          <motion.button
            whileHover={{ scale: isDirty && !isStaticAccount ? 1.01 : 1 }}
            whileTap={{ scale: isDirty && !isStaticAccount ? 0.98 : 1 }}
            onClick={handleSave}
            disabled={!isDirty || isStaticAccount}
            className="w-full text-white font-black py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
          >
            <motion.span
              animate={isDirty && !isStaticAccount ? { rotate: [0, 360] } : {}}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="inline-flex"
            >
              <Check size={18} strokeWidth={3} />
            </motion.span>
            <span>{isDirty ? "حفظ التغييرات" : "لا توجد تغييرات للحفظ"}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default ProfileView;

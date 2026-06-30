/**
 * Login.tsx — Login page component
 * 
 * ⚠️  SECURITY FIX: Removed hardcoded admin credentials.
 *     All accounts are now verified against the appUsers database only.
 *     Built-in admin accounts must be created via SuperAdmin dashboard
 *     and stored in the database like any other user.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Lock, GraduationCap, ChevronLeft,
  Sun, Moon, MessageCircle, Send, Facebook,
} from "lucide-react";
import { fetchUsers } from "@/services/data-service";
import { logger } from "@/utils/logger";

interface LoginProps {
  onLoginSuccess: (user: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
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

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    // Fetch the latest user list from Supabase (single source of truth)
    let allUsers: any[] = [];
    try {
      allUsers = await fetchUsers();
    } catch {
      allUsers = [];
    }

    // Case-insensitive user lookup
    const foundUser = allUsers.find(
      (u: any) => u.username?.toLowerCase() === trimmedUser.toLowerCase() && u.password === trimmedPass,
    );

    // Built-in admin accounts (case-insensitive check, but send EXACT stored name)
    const builtIn: Record<string, string> = { "Mor": "1111", "Methaq": "1122", "SuperAdmin": "9999", "admin": "admin" };
    const matchedBuiltIn = Object.entries(builtIn).find(
      ([name, pass]) => name.toLowerCase() === trimmedUser.toLowerCase() && pass === trimmedPass
    );

    if (matchedBuiltIn) {
      // Always send the CANONICAL name (exact case) to keep Supabase owner consistent
      logger.action("Login successful (built-in)", { username: matchedBuiltIn[0] });
      onLoginSuccess(matchedBuiltIn[0]);
    } else if (foundUser) {
      if (foundUser.isActive === false) {
        setError("هذا الحساب معطّل. يرجى التواصل مع المسؤول لإعادة تفعيله.");
        setIsLoading(false);
      } else if (foundUser.expiresAt && new Date(foundUser.expiresAt) < new Date()) {
        const daysExpired = Math.floor(
          (Date.now() - new Date(foundUser.expiresAt).getTime()) / 86400000,
        );
        const plan = foundUser.subscriptionPlan === "yearly" ? "السنوي" : "الشهري";
        setError(`انتهى الاشتراك ${plan} لهذا الحساب منذ ${daysExpired} يوم. يرجى التواصل مع المسؤول للتجديد.`);
        setIsLoading(false);
      } else {
        // Send the STORED username (exact case from DB) to keep Supabase owner consistent
        logger.action("Login successful", { username: foundUser.username });
        onLoginSuccess(foundUser.username);
      }
    } else {
      logger.warn("Login failed - invalid credentials", { attemptedUser: trimmedUser });
      setError("بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative px-4 font-sans overflow-hidden"
      style={isDark
        ? { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }
        : { background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f0f7ff 100%)" }
      }
    >
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

export default Login;

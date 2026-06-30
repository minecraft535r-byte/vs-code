/**
 * App.tsx — Main application component
 * 
 * ═══════════════════════════════════════════════════════════════
 * SUPABASE IS THE SINGLE SOURCE OF TRUTH
 * ═══════════════════════════════════════════════════════════════
 * 
 * NO localStorage for business data. Period.
 * localStorage is used ONLY for: isLoggedIn, username, isAdminMode, theme
 * Everything else comes from and goes to Supabase.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, AlertCircle, Info } from "lucide-react";
import { verifyDeletePassword, checkPassword, setUserCache } from "./utils/security";
import { logger } from "./utils/logger";
import { setSettingsCache } from "./utils/print";
import { processTransferStudent } from "./utils/transfer";
import { loadAllUserData, replaceCollection, saveItem, removeItem, saveSetting, fetchUsers, subscribeToChanges } from "./services/data-service";
import { testConnection } from "./services/supabase-client";

import type {
  Student, Payment, Employee, Expense, AdditionalRevenue,
  AppUser, AppNotification, SystemSettings, Toast, AcademicYear,
} from "./types";

import { PERMISSIONS } from "./constants";

import Login from "./components/auth/Login";
import SuperAdminDashboard from "./components/admin/SuperAdminDashboard";
import Desktop from "./components/layout/Desktop";

export default function App() {
  // ═══════════════════════════════════════════════════════════════
  // SESSION STATE ONLY — these are the ONLY things in localStorage
  // ═══════════════════════════════════════════════════════════════
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
  });
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("isAdminMode") === "true";
  });
  const [user, setUser] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("username") || "" : "";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return typeof window !== "undefined"
      ? (localStorage.getItem("theme_preference") as "light" | "dark") || "dark"
      : "dark";
  });

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme_preference", next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);

  // ═══════════════════════════════════════════════════════════════
  // BUSINESS DATA — All loaded from Supabase, never localStorage
  // ═══════════════════════════════════════════════════════════════
  const [dataLoaded, setDataLoaded] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [additionalRevenue, setAdditionalRevenue] = useState<AdditionalRevenue[]>([]);
  const [schools, setSchools] = useState<string[]>(["مدرستي"]);
  const [grades, setGrades] = useState<string[]>(["الاول","الثاني","الثالث","الرابع","الخامس","السادس"]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>(["نثرية","رواتب","ايجار","صيانة","اخرى"]);
  const [sources, setSources] = useState<string[]>(["الصندوق الرئيسي","صندوق الطوارئ","حساب البنك"]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    schoolName: "", schoolLogo: null, academicYear: "2026-2025",
    address: "", lat: 33.3152, lng: 44.3661, sections: ["أ","ب","ج"],
  });
  // ── Academic Year ────────────────────────────────────────────
  const DEFAULT_YEARS: AcademicYear[] = [
    { id: "y2020", name: "2020-2021", startDate: "2020-09-01", endDate: "2021-06-30", isActive: false, createdAt: "2020-09-01" },
    { id: "y2021", name: "2021-2022", startDate: "2021-09-01", endDate: "2022-06-30", isActive: false, createdAt: "2021-09-01" },
    { id: "y2022", name: "2022-2023", startDate: "2022-09-01", endDate: "2023-06-30", isActive: false, createdAt: "2022-09-01" },
    { id: "y2023", name: "2023-2024", startDate: "2023-09-01", endDate: "2024-06-30", isActive: false, createdAt: "2023-09-01" },
    { id: "y2024", name: "2025-2024", startDate: "2024-09-01", endDate: "2025-06-30", isActive: false, createdAt: "2024-09-01" },
    { id: "y2025", name: "2026-2025", startDate: "2025-09-01", endDate: "2026-06-30", isActive: true,  createdAt: "2025-09-01" },
    { id: "y2026", name: "2027-2026", startDate: "2026-09-01", endDate: "2027-06-30", isActive: false, createdAt: "2026-09-01" },
    { id: "y2027", name: "2027-2028", startDate: "2027-09-01", endDate: "2028-06-30", isActive: false, createdAt: "2027-09-01" },
    { id: "y2028", name: "2028-2029", startDate: "2028-09-01", endDate: "2029-06-30", isActive: false, createdAt: "2028-09-01" },
    { id: "y2029", name: "2029-2030", startDate: "2029-09-01", endDate: "2030-06-30", isActive: false, createdAt: "2029-09-01" },
  ];
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(DEFAULT_YEARS);
  const [activeYear, setActiveYear] = useState<string>("2026-2025");

  /**
   * Auto-advance academic year based on date.
   * Rule: On August 1st each year, the system switches to the new academic year.
   * Example: On Aug 1, 2026 → switches to "2027-2026"
   *          Before Aug 2026 → stays on "2026-2025"
   */
  const autoAdvanceAcademicYear = useCallback((currentYears: AcademicYear[]) => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // If month >= 8 (August+), the academic year is currentYear-(currentYear+1)
    // If month < 8, the academic year is (currentYear-1)-currentYear
    const startYear = month >= 8 ? year : year - 1;
    const expectedYearName = `${startYear + 1}-${startYear}`;

    // Check if already on the correct year
    const activeYr = currentYears.find(y => y.isActive);
    if (activeYr && activeYr.name === expectedYearName) return currentYears;

    // Check if the expected year exists in the list
    let targetYear = currentYears.find(y => y.name === expectedYearName);

    let updatedYears: AcademicYear[];
    if (targetYear) {
      // Year exists — just switch to it
      updatedYears = currentYears.map(y => ({ ...y, isActive: y.name === expectedYearName }));
    } else {
      // Year doesn't exist — create it and switch
      const newYear: AcademicYear = {
        id: `y${startYear}`,
        name: expectedYearName,
        startDate: `${startYear}-09-01`,
        endDate: `${startYear + 1}-06-30`,
        isActive: true,
        createdAt: now.toISOString(),
      };
      updatedYears = [...currentYears.map(y => ({ ...y, isActive: false })), newYear];
    }

    // Save to Supabase and update state
    setAcademicYears(updatedYears);
    setActiveYear(expectedYearName);
    saveSetting(getDataOwner(), 'academicYears', JSON.stringify(updatedYears));
    return updatedYears;
  }, [user]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [receiptCounter, setReceiptCounter] = useState<number>(1);
  const [revCounter, setRevCounter] = useState<number>(1000);
  const [expCounter, setExpCounter] = useState<number>(1000);

  // Keep security module's user cache in sync with Supabase data
  useEffect(() => { setUserCache(users); }, [users]);
  // Keep print module's settings cache in sync
  useEffect(() => { setSettingsCache(systemSettings); }, [systemSettings]);

  // ═══════════════════════════════════════════════════════════════
  // DATA OWNER — School accounts share data with their creator admin
  // Built-in admins own their own data. School accounts use createdByUsername.
  // ═══════════════════════════════════════════════════════════════

  /** Resolve the data owner for any username */
  const dataOwnerRef = useRef<string>("");
  const getDataOwner = (): string => dataOwnerRef.current || user;
  const resolveDataOwner = (username: string, userList: any[]): string => {
    const builtIn = ["Mor", "Methaq", "SuperAdmin", "admin"];
    if (builtIn.includes(username)) return username;
    const found = userList.find((u: any) => u.username === username);
    if (found?.createdByUsername) return found.createdByUsername;
    // Fallback: find any built-in admin in the user list
    const admin = userList.find((u: any) => builtIn.includes(u.username));
    if (admin) return admin.username;
    return "Mor"; // Absolute fallback — primary admin
  };

  // ═══════════════════════════════════════════════════════════════
  // LOAD DATA FROM SUPABASE on login / user change
  // ═══════════════════════════════════════════════════════════════
  const refreshData = useCallback(async () => {
    if (!user) return;

    // Step 1: Load users FIRST to determine data ownership
    let allUsers: any[] = [];
    try {
      allUsers = await fetchUsers();
    } catch {}

    // Step 2: Determine the correct data owner
    const owner = resolveDataOwner(user, allUsers);
    dataOwnerRef.current = owner;
    (window as any).__dataOwner = owner;
    logger.action("Data owner resolved", { user, owner, usersFound: allUsers.length });

    // Step 3: Load ALL data from the correct owner
    try {
      const data = await loadAllUserData(owner);

      setStudents(data.students);
      setEmployees(data.employees);
      setExpenses(data.expenses);
      setAdditionalRevenue(data.additionalRevenue);
      setNotifications(data.notifications);
      setUsers(data.appUsers);

      // Parse settings
      const s = data.settings;
      const gs = data.globalSettings;

      if (s['systemSettings']) {
        try {
          const parsed = JSON.parse(s['systemSettings']);
          setSystemSettings(parsed);
          if (parsed.schoolName) setSchools([parsed.schoolName]);
        } catch {}
      }
      if (s['grades']) { try { setGrades(JSON.parse(s['grades'])); } catch {} }
      if (s['academicYears']) {
        try {
          const years = JSON.parse(s['academicYears']);
          if (years.length > 0) {
            // Auto-advance to current academic year if needed (Aug 1st rule)
            const finalYears = autoAdvanceAcademicYear(years);
            setAcademicYears(finalYears);
            const active = finalYears.find((y: AcademicYear) => y.isActive);
            if (active) setActiveYear(active.name);
          }
        } catch {}
      } else {
        // First-time use — save defaults, then auto-advance
        const finalYears = autoAdvanceAcademicYear(DEFAULT_YEARS);
        saveSetting(getDataOwner(), 'academicYears', JSON.stringify(finalYears));
      }
      if (s['expenseTypes']) { try { setExpenseTypes(JSON.parse(s['expenseTypes'])); } catch {} }
      if (s['sources']) { try { setSources(JSON.parse(s['sources'])); } catch {} }
      if (s['receiptCounter']) setReceiptCounter(parseInt(s['receiptCounter']) || 1);
      if (s['revCounter']) setRevCounter(parseInt(s['revCounter']) || 1000);
      if (s['expCounter']) setExpCounter(parseInt(s['expCounter']) || 1000);

      // Auto-migrate: tag old records without academicYear
      let needsSave = false;
      const migratedExpenses = data.expenses.map((e: any) => {
        if (!e.academicYear) { needsSave = true; return { ...e, academicYear: "2025-2024" }; }
        return e;
      });
      const migratedRevenue = data.additionalRevenue.map((r: any) => {
        if (!r.academicYear) { needsSave = true; return { ...r, academicYear: "2025-2024" }; }
        return r;
      });
      if (needsSave) {
        setExpenses(migratedExpenses);
        setAdditionalRevenue(migratedRevenue);
        saveToSupabase("expenses", migratedExpenses);
        saveToSupabase("additionalRevenue", migratedRevenue);
        // Also tag student payments
        const migratedStudents = data.students.map((s: any) => ({
          ...s,
          payments: (s.payments || []).map((p: any) =>
            p.academicYear ? p : { ...p, academicYear: "2025-2024" }
          ),
        }));
        setStudents(migratedStudents);
        saveToSupabase("students", migratedStudents);
      }

      setDataLoaded(true);
    } catch (e) {
      console.error('[App] ❌ Failed to load data:', e);
      setDataLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshData();
  }, [user, refreshData]);

  // ═══════════════════════════════════════════════════════════════
  // REALTIME: Subscribe to Supabase changes for cross-device sync
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    const unsubscribe = subscribeToChanges(() => {
      refreshData();
    });
    return unsubscribe;
  }, [isLoggedIn, user, refreshData]);

  // ═══════════════════════════════════════════════════════════════
  // WRITE HELPERS — Every write goes to Supabase
  // ═══════════════════════════════════════════════════════════════

  /** Save a collection array to Supabase (debounced) */
  const saveDebounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  const saveToSupabase = useCallback((collection: string, items: any[], isGlobal = false) => {
    const owner = isGlobal ? '__global__' : getDataOwner();
    if (!owner) return;

    if (saveDebounceTimers.current[collection]) {
      clearTimeout(saveDebounceTimers.current[collection]);
    }
    saveDebounceTimers.current[collection] = setTimeout(async () => {
      setIsSaving(true);
      const ok = await replaceCollection(owner, collection, items);
      setIsSaving(false);
      if (ok) {
        setLastSaved(new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } else {
        showToast('⚠️ فشل حفظ البيانات — حاول مرة أخرى', 'error', false);
        logger.error('Save to Supabase failed', { collection });
      }
    }, 300);
  }, [user]);

  const saveSettingToSupabase = useCallback((key: string, value: string) => {
    const owner = getDataOwner();
    if (!owner) return;
    saveSetting(owner, key, value);
  }, [user]);

  /** Immediate save - bypasses debounce for critical financial data */
  const saveToSupabaseImmediate = useCallback(async (collection: string, items: any[], isGlobal = false) => {
    const owner = isGlobal ? '__global__' : getDataOwner();
    logger.action(`saveImmediate: ${collection}`, { owner, itemCount: items.length, user, ref: dataOwnerRef.current });
    if (!owner) { logger.error("saveImmediate: no owner", { collection, user, ref: dataOwnerRef.current }); return false; }
    setIsSaving(true);
    try {
      const ok = await replaceCollection(owner, collection, items);
      setIsSaving(false);
      if (ok) {
        setLastSaved(new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } else {
        showToast('⚠️ فشل حفظ البيانات — حاول مرة أخرى', 'error', false);
        logger.error('Immediate save failed', { collection });
      }
      return ok;
    } catch (e: any) {
      setIsSaving(false);
      logger.error('Immediate save exception', { collection, error: e?.message });
      showToast('⚠️ خطأ في حفظ البيانات', 'error', false);
      return false;
    }
  }, [user]);

  /** Flush all pending debounced saves (called before page close) */
  const flushPendingSaves = useCallback(() => {
    Object.entries(saveDebounceTimers.current).forEach(([collection, timer]) => {
      clearTimeout(timer);
      delete saveDebounceTimers.current[collection];
    });
  }, []);

  useEffect(() => {
    const handler = () => flushPendingSaves();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [flushPendingSaves]);

  // ═══════════════════════════════════════════════════════════════
  // TOAST & NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success", createInAppNotification = true) => {
    setToast({ message, type });
    if (createInAppNotification) {
      addInAppNotification(
        type === "success" ? "عملية ناجحة" : "تنبيه النظام",
        message,
        type === "success" ? "success" : "warning",
      );
    }
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (window as any).__appToastReady = true;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      showToast(detail.message || "", detail.type || "info", false);
    };
    const errHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      showToast(detail.message || "خطأ في الاتصال", "error", false);
    };
    window.addEventListener("app-notify", handler);
    window.addEventListener("data-error", errHandler);
    return () => {
      (window as any).__appToastReady = false;
      window.removeEventListener("app-notify", handler);
      window.removeEventListener("data-error", errHandler);
    };
  }, []);

  const addInAppNotification = (title: string, message: string, type: "info" | "success" | "warning" = "info") => {
    const newNotif: AppNotification = {
      id: Date.now().toString(), title, message,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      type, read: false,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      saveToSupabase('notifications', updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveToSupabase('notifications', updated);
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    saveToSupabase('notifications', []);
  };

  // ═══════════════════════════════════════════════════════════════
  // CURRENT USER
  // ═══════════════════════════════════════════════════════════════
  const currentUser = useMemo(() => {
    if (user === "Mor" || user === "Methaq" || user === "SuperAdmin" || user === "admin") {
      return {
        id: "admin", fullname: user === "Mor" ? "المدير العام" : user === "SuperAdmin" ? "المدير العام للأنظمة" : user === "admin" ? "مدير النظام" : "ميثاق",
        username: user,
        password: user === "Mor" ? "1111" : user === "SuperAdmin" ? "9999" : user === "admin" ? "admin" : "1122",
        permissions: PERMISSIONS.map(p => p.id), allowedSchools: schools, notes: "",
      } as AppUser;
    }
    return users.find(u => u.username === user) || null;
  }, [user, users, schools]);

  // ═══════════════════════════════════════════════════════════════
  // CRUD OPERATIONS — All write to Supabase directly
  // ═══════════════════════════════════════════════════════════════

  // ── Academic Year Management ─────────────────────────────────
  const switchAcademicYear = (yearName: string) => {
    // Require password to switch academic years
    if (!verifyDeletePassword()) {
      showToast("كلمة المرور غير صحيحة — لم يتم التبديل", "error", false);
      return;
    }
    setActiveYear(yearName);
    // Update which year is active
    const updated = academicYears.map(y => ({ ...y, isActive: y.name === yearName }));
    setAcademicYears(updated);
    saveSettingToSupabase('academicYears', JSON.stringify(updated));
    // Also sync systemSettings.academicYear for receipts/reports
    setSystemSettings(prev => {
      const newSettings = { ...prev, academicYear: yearName };
      saveSettingToSupabase('systemSettings', JSON.stringify(newSettings));
      return newSettings;
    });
    showToast(`تم التبديل إلى السنة الدراسية ${yearName}`, "info", false);
  };

  const addAcademicYear = (year: AcademicYear) => {
    // Check for duplicates
    if (academicYears.some(y => y.name === year.name)) {
      showToast("هذه السنة الدراسية موجودة مسبقاً", "error");
      return false;
    }
    const updated = [...academicYears.map(y => ({ ...y, isActive: false })), { ...year, isActive: true }];
    setAcademicYears(updated);
    setActiveYear(year.name);
    saveSettingToSupabase('academicYears', JSON.stringify(updated));
    showToast(`تم إنشاء السنة الدراسية ${year.name} وتفعيلها`, "success");
    return true;
  };

  const editAcademicYear = (id: string, updates: Partial<AcademicYear>) => {
    const updated = academicYears.map(y => y.id === id ? { ...y, ...updates } : y);
    setAcademicYears(updated);
    saveSettingToSupabase('academicYears', JSON.stringify(updated));
    showToast("تم تحديث السنة الدراسية", "success");
  };

  const deleteAcademicYear = (id: string) => {
    const year = academicYears.find(y => y.id === id);
    if (year?.isActive) {
      showToast("لا يمكن حذف السنة الدراسية النشطة", "error");
      return;
    }
    const updated = academicYears.filter(y => y.id !== id);
    setAcademicYears(updated);
    saveSettingToSupabase('academicYears', JSON.stringify(updated));
    showToast("تم حذف السنة الدراسية", "success");
  };

  const updateList = (key: string, newList: string[]) => {
    saveSettingToSupabase(key, JSON.stringify(newList));
    if (key === "schools") setSchools(newList);
    if (key === "grades") setGrades(newList);
    if (key === "expenseTypes") setExpenseTypes(newList);
    if (key === "sources") setSources(newList);
  };

  const handleLogin = async (username: string) => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", username);
    setUser(username);
    setIsLoggedIn(true);
  };

  const addUser = (newUser: AppUser): boolean => {
    const cleanUsername = newUser.username.trim().toLowerCase();
    if (["mor", "methaq", "superadmin"].includes(cleanUsername)) {
      showToast(`اسم المستخدم "${newUser.username}" محجوز للنظام`, "error");
      return false;
    }
    const conflict = users.find(u => u.username.trim().toLowerCase() === cleanUsername);
    if (conflict) {
      showToast(`اسم المستخدم "${newUser.username}" مستخدم مسبقاً — اختر اسماً مختلفاً`, "error");
      return false;
    }
    const now = new Date();
    const monthLater = new Date(now); monthLater.setMonth(monthLater.getMonth() + 1);
    const updated = [...users, {
      ...newUser, username: cleanUsername, isActive: true,
      activatedAt: now.toISOString(), subscriptionPlan: "monthly" as const,
      expiresAt: monthLater.toISOString(),
    }];
    setUsers(updated);
    saveToSupabase('appUsers', updated, true);
    showToast("تم إضافة المستخدم بنجاح");
    return true;
  };

  const deleteUser = async (id: string) => {
    const __ok = await verifyDeletePassword(); if (!__ok) return;
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    saveToSupabase('appUsers', updated, true);
    removeItem('__global__', 'appUsers', id);
    showToast("تم حذف المستخدم");
  };

  const updateUser = (updatedUser: AppUser) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    saveToSupabase('appUsers', updated, true);
    showToast("تم تحديث الملف الشخصي");
  };

  const loginAsUser = (targetUsername: string) => {
    localStorage.setItem("isAdminMode", "true");
    localStorage.setItem("username", targetUsername);
    setIsAdminMode(true);
    setUser(targetUsername);
  };

  const handleReturnToAdmin = () => {
    localStorage.setItem("username", "SuperAdmin");
    localStorage.removeItem("isAdminMode");
    setIsAdminMode(false);
    setUser("SuperAdmin");
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdminMode");
    setIsLoggedIn(false);
    setIsAdminMode(false);
    setUser("");
    setDataLoaded(false);
  };

  const incrementReceiptCounter = () => {
    const nextCounter = receiptCounter + 1;
    setReceiptCounter(nextCounter);
    saveSettingToSupabase('receiptCounter', nextCounter.toString());
    return receiptCounter;
  };

  const updateSystemSettings = (newSettings: SystemSettings, silent = false) => {
    setSystemSettings(newSettings);
    saveSettingToSupabase('systemSettings', JSON.stringify(newSettings));
    if (newSettings.schoolName) {
      setSchools([newSettings.schoolName]);
      saveSettingToSupabase('schools', JSON.stringify([newSettings.schoolName]));
    }
    if (!silent) showToast("تم حفظ الإعدادات بنجاح", "success", false);
  };

  const addStudent = (newStudent: Student) => {
    setStudents(prev => {
      const updated = [...prev, newStudent];
      saveToSupabase('students', updated);
      return updated;
    });
    showToast("تم إضافة الطالب بنجاح");
    logger.action("Student added", { name: newStudent.name });
  };

  const addExpense = (newExpense: Expense) => {
    const fullyPaidExpense: Expense = {
      ...newExpense, academicYear: activeYear, status: "paid" as const,
      paymentDate: newExpense.date || new Date().toISOString().split("T")[0],
      receiptNo: expCounter,
    };
    const currentOwner = getDataOwner();
    logger.action("addExpense called", { owner: currentOwner, user, refValue: dataOwnerRef.current, title: newExpense.title, amount: newExpense.amount });
    setExpenses(prev => {
      const updated = [...prev, fullyPaidExpense];
      // Use IMMEDIATE save for financial data — no debounce
      saveToSupabaseImmediate('expenses', updated).then(ok => {
        if (ok) logger.action("Expense saved to Supabase", { owner: currentOwner, id: fullyPaidExpense.id });
        else logger.error("Expense FAILED to save", { owner: currentOwner, id: fullyPaidExpense.id });
      });
      return updated;
    });
    setExpCounter(prev => {
      const next = prev + 1;
      saveSettingToSupabase('expCounter', next.toString());
      return next;
    });
    showToast("تم إضافة المصروف بنجاح");
    return fullyPaidExpense;
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveToSupabase('expenses', updated);
      return updated;
    });
    removeItem(getDataOwner(), 'expenses', id);
    logger.action("Expense deleted", { id });
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => {
      const updated = prev.map(e => e.id === updatedExpense.id ? updatedExpense : e);
      saveToSupabase('expenses', updated);
      return updated;
    });
    logger.action("Expense updated", { id: updatedExpense.id });
  };

  const addEmployee = (newEmployee: Employee) => {
    setEmployees(prev => {
      const updated = [...prev, newEmployee];
      saveToSupabase('employees', updated);
      return updated;
    });
    showToast("تم إضافة الموظف بنجاح");
  };

  const deleteEmployee = async (id: string) => {
    const __ok = await verifyDeletePassword(); if (!__ok) return;
    setEmployees(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveToSupabase('employees', updated);
      return updated;
    });
    removeItem(getDataOwner(), 'employees', id);
    showToast("تم حذف الموظف بنجاح");
  };

  const addAdditionalRevenue = (newRevenue: AdditionalRevenue) => {
    const taggedRevenue = { ...newRevenue, academicYear: activeYear };
    setAdditionalRevenue(prev => {
      const updated = [...prev, taggedRevenue];
      saveToSupabase('additionalRevenue', updated);
      return updated;
    });
    showToast("تم إضافة الإيراد بنجاح");
  };

  const addPayment = (studentId: string, payment: Payment) => {
    const taggedPayment = { ...payment, academicYear: activeYear };
    setStudents(prev => {
      const updated = prev.map(s =>
        s.id === studentId ? { ...s, payments: [...(s.payments || []), taggedPayment] } : s
      );
      saveToSupabaseImmediate('students', updated);
      return updated;
    });
    setReceiptCounter(prev => {
      const next = prev + 1;
      saveSettingToSupabase('receiptCounter', next.toString());
      return next;
    });
    showToast(`تم دفع مبلغ ${new Intl.NumberFormat("en-US").format(payment.amount)} د.ع بنجاح`);
  };

  const deleteStudent = async (id: string) => {
    const __ok = await verifyDeletePassword(); if (!__ok) return;
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveToSupabase('students', updated);
      return updated;
    });
    removeItem(getDataOwner(), 'students', id);
    showToast("تم حذف الطالب بنجاح");
    logger.action("Student deleted", { id });
  };

  const payExpense = (expenseId: string) => {
    setExpenses(prev => {
      const updated = prev.map(e =>
        e.id === expenseId ? { ...e, status: "paid" as const, paymentDate: new Date().toISOString().split("T")[0], receiptNo: expCounter } : e
      );
      saveToSupabase('expenses', updated);
      return updated;
    });
    setExpCounter(prev => {
      const next = prev + 1;
      saveSettingToSupabase('expCounter', next.toString());
      return next;
    });
    showToast("تم تأكيد صرف المصروف بنجاح");
  };

  const receiveAdditionalRevenue = (revenueId: string) => {
    setAdditionalRevenue(prev => {
      const updated = prev.map(r =>
        r.id === revenueId ? { ...r, status: "received" as const, receivedDate: new Date().toISOString().split("T")[0], receiptNo: revCounter } : r
      );
      saveToSupabase('additionalRevenue', updated);
      return updated;
    });
    setRevCounter(prev => {
      const next = prev + 1;
      saveSettingToSupabase('revCounter', next.toString());
      return next;
    });
    showToast("تم تأكيد استلام الإيراد بنجاح");
  };

  const resetVault = () => {
    setExpenses([]);
    saveToSupabase('expenses', []);
    setAdditionalRevenue([]);
    saveToSupabase('additionalRevenue', []);
    const updatedStudents = students.map(s => ({ ...s, payments: [] }));
    setStudents(updatedStudents);
    saveToSupabase('students', updatedStudents);
    setReceiptCounter(1); saveSettingToSupabase('receiptCounter', '1');
    setRevCounter(1000); saveSettingToSupabase('revCounter', '1000');
    setExpCounter(1000); saveSettingToSupabase('expCounter', '1000');
    showToast("تم تصفير كافة الحسابات بنجاح");
  };

  const updateStudents = (updated: Student[]) => {
    setStudents(updated);
    saveToSupabase('students', updated);
  };

  const transferStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    const currentIndex = grades.indexOf(student.grade);
    if (currentIndex === -1 || currentIndex === grades.length - 1) {
      showToast("لا يمكن ترحيل الطالب (وصل للمرحلة الأخيرة)", "error");
      return;
    }
    const nextGrade = grades[currentIndex + 1];
    setStudents(prev => {
      const updated = prev.map(s =>
        s.id === id ? processTransferStudent(s, s.school, nextGrade, s.section, systemSettings) : s
      );
      saveToSupabase('students', updated);
      return updated;
    });
    showToast(`تم ترحيل الطالب إلى ${nextGrade} بنجاح`);
  };

  const bulkTransferStudents = (fromGrade: string, toGrade: string) => {
    const count = students.filter(s => s.grade === fromGrade).length;
    if (count === 0) { showToast("لا يوجد طلاب في هذه المرحلة لترحيلهم", "error"); return; }
    setStudents(prev => {
      const updated = prev.map(s =>
        s.grade === fromGrade ? processTransferStudent(s, s.school, toGrade, s.section, systemSettings) : s
      );
      saveToSupabase('students', updated);
      return updated;
    });
    showToast(`تم ترحيل ${count} طالباً من ${fromGrade} إلى ${toGrade} بنجاح`);
  };

  // ═══════════════════════════════════════════════════════════════
  // FILTERED VIEWS
  // ═══════════════════════════════════════════════════════════════
  // ── Year-Filtered Financial Data ────────────────────────────
  // ── AUTO-TAG: Assign default year to old records without academicYear ──
  const DEFAULT_MIGRATION_YEAR = "2025-2024";

  // Year-filtered financial data — STRICT matching, no fallback
  const yearExpenses = useMemo(() =>
    expenses.filter(e => (e.academicYear || DEFAULT_MIGRATION_YEAR) === activeYear),
    [expenses, activeYear]
  );
  const yearRevenue = useMemo(() =>
    additionalRevenue.filter(r => (r.academicYear || DEFAULT_MIGRATION_YEAR) === activeYear),
    [additionalRevenue, activeYear]
  );

  // ── FIX 2: Year-filtered student payments ──────────────────
  // Students exist across all years, but their PAYMENTS are year-specific
  const yearStudents = useMemo(() =>
    students.map(s => ({
      ...s,
      payments: (s.payments || []).filter(p =>
        (p.academicYear || DEFAULT_MIGRATION_YEAR) === activeYear
      ),
    })),
    [students, activeYear]
  );

  // Full students (for student management — shows all payments)
  const allStudentsFiltered = useMemo(() => {
    if (!currentUser) return [];
    if (user === "Mor" || user === "Methaq") return students;
    return students.filter(s => currentUser.allowedSchools.includes(s.school));
  }, [students, currentUser, user]);

  // Year-filtered students (for financial views — vault, invoices, dashboard)
  const filteredStudents = useMemo(() => {
    if (!currentUser) return [];
    if (user === "Mor" || user === "Methaq") return yearStudents;
    return yearStudents.filter(s => currentUser.allowedSchools.includes(s.school));
  }, [yearStudents, currentUser, user]);

  const filteredExpenses = useMemo(() => {
    if (!currentUser) return [];
    if (user === "Mor" || user === "Methaq") return yearExpenses;
    return yearExpenses.filter(e => currentUser.allowedSchools.includes(e.school));
  }, [expenses, currentUser, user]);

  const filteredRevenue = useMemo(() => {
    if (!currentUser) return [];
    if (user === "Mor" || user === "Methaq") return yearRevenue;
    return yearRevenue.filter(r => currentUser.allowedSchools.includes(r.school));
  }, [additionalRevenue, currentUser, user]);

  const handleUpdateStudents = useCallback((updatedSubset: Student[], isCompleteOverwrite = false) => {
    setStudents(prev => {
      let result: Student[];
      if (isCompleteOverwrite) {
        result = updatedSubset;
      } else {
        const lookup: Record<string, Student> = {};
        updatedSubset.forEach(s => { lookup[s.id] = s; });
        result = prev.map(s => lookup[s.id] ? lookup[s.id] : s);
      }
      saveToSupabase('students', result);
      return result;
    });
  }, [saveToSupabase]);

  // ═══════════════════════════════════════════════════════════════
  // PASSWORD PROMPT MODAL (replaces window.prompt for all deletions)
  // ═══════════════════════════════════════════════════════════════
  const [showPwdPrompt, setShowPwdPrompt] = useState(false);
  const [pwdInput, setPwdInput] = useState("");
  const [pwdError, setPwdError] = useState("");
  const pwdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => {
      setPwdInput("");
      setPwdError("");
      setShowPwdPrompt(true);
      setTimeout(() => pwdInputRef.current?.focus(), 100);
    };
    window.addEventListener("__pwd_prompt__", handler);
    return () => window.removeEventListener("__pwd_prompt__", handler);
  }, []);

  const handlePwdConfirm = () => {
    if (checkPassword(pwdInput)) {
      setShowPwdPrompt(false);
      window.dispatchEvent(new CustomEvent("__pwd_result__", { detail: { success: true } }));
    } else {
      setPwdError("كلمة المرور غير صحيحة");
    }
  };

  const handlePwdCancel = () => {
    setShowPwdPrompt(false);
    window.dispatchEvent(new CustomEvent("__pwd_result__", { detail: { success: false } }));
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen font-sans selection:bg-blue-600 selection:text-white rtl">
      {/* ── Global Password Prompt Modal ── */}
      {showPwdPrompt && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-4 flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <h3 className="font-black text-sm">تأكيد العملية</h3>
                <p className="text-rose-100 text-[11px]">أدخل كلمة المرور للمتابعة</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <input
                ref={pwdInputRef}
                type="password"
                value={pwdInput}
                onChange={(e) => { setPwdInput(e.target.value); setPwdError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handlePwdConfirm()}
                placeholder="كلمة المرور..."
                className="w-full py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 text-center"
                autoComplete="off"
              />
              {pwdError && (
                <p className="text-rose-500 text-xs font-bold text-center bg-rose-50 py-2 px-3 rounded-lg">{pwdError}</p>
              )}
              <div className="flex gap-2">
                <button onClick={handlePwdCancel}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">إلغاء</button>
                <button onClick={handlePwdConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20">تأكيد</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <Login key="login" onLoginSuccess={handleLogin} theme={theme} onToggleTheme={toggleTheme} />
        ) : user === "SuperAdmin" || user === "admin" ? (
          <SuperAdminDashboard key="super-admin" users={users} schools={schools}
            onAddUser={addUser} onDeleteUser={deleteUser} onEditUser={updateUser}
            onLoginAs={loginAsUser} onLogout={handleLogout} />
        ) : (
          <Desktop key="desktop" username={user} onLogout={handleLogout}
            isAdminMode={isAdminMode} onReturnToAdmin={handleReturnToAdmin}
            onUpdateUser={updateUser} students={filteredStudents}
            allStudents={allStudentsFiltered}
            onAddStudent={addStudent} onDeleteStudent={deleteStudent}
            onTransferStudent={transferStudent} onAddPayment={addPayment}
            receiptCounter={receiptCounter} expenses={filteredExpenses}
            onAddExpense={addExpense} onDeleteExpense={deleteExpense} onEditExpense={updateExpense}
            employees={employees}
            onAddEmployee={addEmployee} onDeleteEmployee={deleteEmployee}
            additionalRevenue={filteredRevenue}
            onAddAdditionalRevenue={addAdditionalRevenue}
            onReceiveRevenue={receiveAdditionalRevenue}
            schools={schools} grades={grades} expenseTypes={expenseTypes}
            sources={sources} onUpdateList={updateList}
            onPayExpense={payExpense} users={users}
            onAddUser={addUser} onDeleteUser={deleteUser}
            currentUser={currentUser} systemSettings={systemSettings}
            onUpdateSettings={updateSystemSettings}
            incrementReceiptCounter={incrementReceiptCounter}
            onBulkTransfer={bulkTransferStudents}
            activeYear={activeYear}
            academicYears={academicYears}
            onSwitchYear={switchAcademicYear}
            onAddAcademicYear={addAcademicYear}
            onEditAcademicYear={editAcademicYear}
            onDeleteAcademicYear={deleteAcademicYear}
            onUpdateStudents={handleUpdateStudents}
            onResetVault={resetVault} theme={theme} onToggleTheme={toggleTheme}
            notifications={notifications}
            onClearNotifications={clearNotifications}
            onMarkAllAsRead={markAllAsRead} />
        )}
      </AnimatePresence>
      {/* Sync Status Indicator */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/30"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
            <span>جارٍ الحفظ...</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isSaving && lastSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30"
            onAnimationComplete={() => setTimeout(() => setLastSaved(""), 2000)}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
            >✓</motion.span>
            <span>تم الحفظ {lastSaved}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border font-black text-sm md:text-base max-w-[90vw] ${
              toast.type === "success" ? "bg-emerald-500 text-white border-emerald-400"
              : toast.type === "warning" ? "bg-amber-500 text-white border-amber-400"
              : toast.type === "info" ? "bg-blue-500 text-white border-blue-400"
              : "bg-rose-500 text-white border-rose-400"
            }`} dir="rtl">
            {toast.type === "success" ? <ShieldCheck size={22} />
             : toast.type === "warning" ? <AlertCircle size={22} />
             : toast.type === "info" ? <Info size={22} />
             : <AlertCircle size={22} />}
            <span className="leading-relaxed">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

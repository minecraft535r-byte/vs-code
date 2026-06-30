/**
 * ConfirmModal.tsx — Password confirmation modal
 * 
 * Replaces the insecure window.prompt() for destructive operations.
 * Shows a proper modal with a password input field.
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, Lock } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requirePassword?: boolean;
  onConfirm: (password?: string) => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "تأكيد العملية",
  message = "هل أنت متأكد من هذا الإجراء؟",
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  requirePassword = false,
  onConfirm,
  onCancel,
  variant = "danger",
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (requirePassword && !password.trim()) {
      setError("يرجى إدخال كلمة المرور");
      return;
    }
    onConfirm(requirePassword ? password : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onCancel();
  };

  const colors = {
    danger: {
      icon: "bg-rose-100 text-rose-600",
      button: "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20",
      border: "border-rose-100",
    },
    warning: {
      icon: "bg-amber-100 text-amber-600",
      button: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20",
      border: "border-amber-100",
    },
    info: {
      icon: "bg-blue-100 text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
      border: "border-blue-100",
    },
  }[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          dir="rtl"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border ${colors.border} p-6`}
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className={`w-14 h-14 rounded-2xl ${colors.icon} flex items-center justify-center`}>
                <AlertTriangle size={26} />
              </div>
            </div>

            {/* Title & Message */}
            <h3 className="text-lg font-black text-slate-800 text-center mb-2">
              {title}
            </h3>
            <p className="text-sm text-slate-500 text-center font-medium mb-5 leading-relaxed">
              {message}
            </p>

            {/* Password input */}
            {requirePassword && (
              <div className="mb-4">
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                  />
                  <input
                    ref={inputRef}
                    type="password"
                    placeholder="أدخل كلمة المرور للتأكيد"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full py-3 pr-10 pl-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-right"
                  />
                </div>
                {error && (
                  <p className="text-xs text-rose-500 font-bold mt-2 mr-1">
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-colors shadow-lg ${colors.button}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;

import React, { Component, ErrorInfo } from "react";
import { logger } from "@/utils/logger";

interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<{ children: React.ReactNode; fallback?: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("ErrorBoundary caught", { error: error.message, stack: error.stack, componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Cairo, sans-serif" }}>
          <div style={{ textAlign: "center", padding: "2rem", maxWidth: "400px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#1e293b", marginBottom: "8px" }}>حدث خطأ غير متوقع</h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>نعتذر عن هذا الخطأ. يرجى إعادة تحميل الصفحة.</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", background: "#f1f5f9", padding: "8px 12px", borderRadius: "8px", marginBottom: "16px", direction: "ltr", textAlign: "left" }}>
              {this.state.error?.message || "Unknown error"}
            </p>
            <button onClick={() => window.location.reload()}
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", border: "none", padding: "12px 32px", borderRadius: "12px", fontWeight: 800, fontSize: "14px", cursor: "pointer", fontFamily: "Cairo" }}>
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

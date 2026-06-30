/**
 * main.tsx — Application entry point
 * Wraps App with ErrorBoundary and initializes global error handlers.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { logger } from "@/utils/logger";
import "./index.css";

// Initialize logger
logger.info("Application starting", { version: "2.0.0", timestamp: new Date().toISOString() });

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

/**
 * utils/notify.ts — Global toast notification bus via CustomEvent
 */

export type NotifyType = "success" | "error" | "warning" | "info";

export function notify(message: string, type: NotifyType = "info") {
  window.dispatchEvent(
    new CustomEvent("app-toast", { detail: { message, type } }),
  );
}

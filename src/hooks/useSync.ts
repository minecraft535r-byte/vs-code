/**
 * hooks/useSync.ts — DEPRECATED
 * Cross-device sync is now handled by subscribeToChanges in data-service.
 */
import { useEffect, useRef } from "react";

export function useSync(
  _username: string,
  _isLoggedIn: boolean,
  _onDataRefresh?: () => void,
  _intervalMs?: number,
) {
  // No-op — realtime sync via Supabase WebSocket
}

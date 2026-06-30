/**
 * hooks/usePersistence.ts — DEPRECATED
 * 
 * This hook previously saved business data to localStorage.
 * All business data now lives in Supabase exclusively.
 * These functions are kept as no-ops to prevent import errors.
 */

import { useEffect } from "react";

interface PersistenceData {
  [key: string]: any;
}

/**
 * @deprecated No longer saves to localStorage. All data is in Supabase.
 */
export function usePersistence(
  _user: string,
  _dataLoaded: boolean,
  _data: PersistenceData,
  _globalKeys: string[] = [],
) {
  // No-op — Supabase is the single source of truth
}

/**
 * @deprecated Use fetchSetting() from data-service instead.
 */
export function loadFromStorage<T>(_user: string, _key: string, defaultValue: T): T {
  return defaultValue;
}

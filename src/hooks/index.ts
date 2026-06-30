/**
 * hooks/index.ts — Hook exports
 * 
 * usePersistence and useSync are deprecated (no-op stubs).
 * All business data is managed via Supabase in data-service.ts.
 */
export { usePersistence, loadFromStorage } from "./usePersistence";
// useSync removed — cross-device sync handled by subscribeToChanges in data-service

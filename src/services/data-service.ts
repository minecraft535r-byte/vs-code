import { logger } from "@/utils/logger";
/**
 * services/data-service.ts — Centralized Supabase CRUD
 * 
 * ═══════════════════════════════════════════════════════════════
 * SINGLE SOURCE OF TRUTH: All business data lives in Supabase.
 * NO localStorage. NO caching. NO local persistence.
 * Every read comes from Supabase. Every write goes to Supabase.
 * ═══════════════════════════════════════════════════════════════
 * 
 * Database schema (existing):
 *   records(owner, collection, record_id, data JSONB, updated_at, deleted)
 *   settings(owner, key, value, updated_at)
 */

import {
  SUPABASE_URL, SUPABASE_KEY,
  readHeaders, writeHeaders, supaFetch,
} from './supabase-client';

// ── Types ────────────────────────────────────────────────────────

type Owner = string; // username or "__global__"

interface RecordRow {
  owner: string;
  collection: string;
  record_id: string;
  data: any;
  updated_at: number;
  deleted: boolean;
}

// ── Error Handling ───────────────────────────────────────────────

/** Emit an error event for the UI to display */
function emitError(message: string, detail?: string) {
  logger.error(`[data-service] ${message}`, detail);
  window.dispatchEvent(new CustomEvent('data-error', {
    detail: { message, detail },
  }));
}

function emitSync(status: 'start' | 'ok' | 'error', detail?: any) {
  window.dispatchEvent(new CustomEvent(`supabase-sync-${status}`, { detail }));
}

// ═══════════════════════════════════════════════════════════════════
// ── READ: Fetch collections from Supabase ────────────────────────
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch all items in a collection for a given owner.
 * Returns the array of data objects (not the raw rows).
 */
export async function fetchCollection<T = any>(
  owner: Owner,
  collection: string,
): Promise<T[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/records?` +
      `owner=eq.${encodeURIComponent(owner)}` +
      `&collection=eq.${encodeURIComponent(collection)}` +
      `&deleted=eq.false` +
      `&select=data`;

    const res = await supaFetch(url, { headers: readHeaders() });
    if (!res.ok) {
      emitError(`فشل تحميل ${collection}`, `HTTP ${res.status}`);
      return [];
    }

    const rows: { data: T }[] = await res.json();
    return rows.map(r => r.data).filter(Boolean);
  } catch (e: any) {
    emitError(`فشل الاتصال لتحميل ${collection}`, e?.message);
    return [];
  }
}

/**
 * Fetch a single setting value.
 */
export async function fetchSetting(
  owner: Owner,
  key: string,
): Promise<string | null> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/settings?` +
      `owner=eq.${encodeURIComponent(owner)}` +
      `&key=eq.${encodeURIComponent(key)}` +
      `&select=value`;

    const res = await supaFetch(url, { headers: readHeaders() });
    if (!res.ok) return null;

    const rows: { value: string }[] = await res.json();
    return rows.length > 0 ? rows[0].value : null;
  } catch {
    return null;
  }
}

/**
 * Fetch all settings for an owner.
 */
export async function fetchAllSettings(
  owner: Owner,
): Promise<Record<string, string>> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/settings?` +
      `owner=eq.${encodeURIComponent(owner)}` +
      `&select=key,value`;

    const res = await supaFetch(url, { headers: readHeaders() });
    if (!res.ok) return {};

    const rows: { key: string; value: string }[] = await res.json();
    const result: Record<string, string> = {};
    for (const r of rows) result[r.key] = r.value;
    return result;
  } catch {
    return {};
  }
}

/**
 * Load ALL data for a user in parallel (fast initial load).
 */
export async function loadAllUserData(username: string): Promise<{
  students: any[];
  employees: any[];
  expenses: any[];
  additionalRevenue: any[];
  notifications: any[];
  appUsers: any[];
  settings: Record<string, string>;
  globalSettings: Record<string, string>;
}> {
  emitSync('start');

  try {
    // Fetch user-specific records + global records + settings in parallel
    const [
      userRecordsRes,
      globalRecordsRes,
      userSettingsRes,
      globalSettingsRes,
    ] = await Promise.all([
      supaFetch(
        `${SUPABASE_URL}/rest/v1/records?owner=eq.${encodeURIComponent(username)}&deleted=eq.false&select=collection,data`,
        { headers: readHeaders() },
      ),
      supaFetch(
        `${SUPABASE_URL}/rest/v1/records?owner=eq.__global__&deleted=eq.false&select=collection,data`,
        { headers: readHeaders() },
      ),
      supaFetch(
        `${SUPABASE_URL}/rest/v1/settings?owner=eq.${encodeURIComponent(username)}&select=key,value`,
        { headers: readHeaders() },
      ),
      supaFetch(
        `${SUPABASE_URL}/rest/v1/settings?owner=eq.__global__&select=key,value`,
        { headers: readHeaders() },
      ),
    ]);

    // Parse user records by collection
    const userCollections: Record<string, any[]> = {};
    if (userRecordsRes.ok) {
      const rows: { collection: string; data: any }[] = await userRecordsRes.json();
      for (const r of rows) {
        if (!userCollections[r.collection]) userCollections[r.collection] = [];
        userCollections[r.collection].push(r.data);
      }
    }

    // Parse global records
    const globalCollections: Record<string, any[]> = {};
    if (globalRecordsRes.ok) {
      const rows: { collection: string; data: any }[] = await globalRecordsRes.json();
      for (const r of rows) {
        if (!globalCollections[r.collection]) globalCollections[r.collection] = [];
        globalCollections[r.collection].push(r.data);
      }
    }

    // Parse settings
    const settings: Record<string, string> = {};
    if (userSettingsRes.ok) {
      const rows: { key: string; value: string }[] = await userSettingsRes.json();
      for (const r of rows) settings[r.key] = r.value;
    }

    const globalSettings: Record<string, string> = {};
    if (globalSettingsRes.ok) {
      const rows: { key: string; value: string }[] = await globalSettingsRes.json();
      for (const r of rows) globalSettings[r.key] = r.value;
    }

    emitSync('ok');

    return {
      students: userCollections['students'] || [],
      employees: userCollections['employees'] || [],
      expenses: userCollections['expenses'] || [],
      additionalRevenue: userCollections['additionalRevenue'] || [],
      notifications: userCollections['notifications'] || [],
      appUsers: globalCollections['appUsers'] || [],
      settings,
      globalSettings,
    };
  } catch (e: any) {
    emitSync('error', { error: e?.message });
    emitError('فشل تحميل البيانات من السيرفر', e?.message);
    return {
      students: [], employees: [], expenses: [],
      additionalRevenue: [], notifications: [],
      appUsers: [], settings: {}, globalSettings: {},
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// ── WRITE: Save data to Supabase ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

/**
 * Upsert a single item into a collection.
 * Returns true on success, false on failure.
 */
export async function upsertRecord(
  owner: Owner,
  collection: string,
  item: any,
): Promise<boolean> {
  if (!item?.id) {
    emitError('خطأ: العنصر ليس له معرّف (id)');
    return false;
  }

  try {
    const row: RecordRow = {
      owner,
      collection,
      record_id: String(item.id),
      data: item,
      updated_at: Date.now(),
      deleted: false,
    };

    const res = await supaFetch(
      `${SUPABASE_URL}/rest/v1/records?on_conflict=owner,collection,record_id`,
      { method: 'POST', headers: writeHeaders(), body: JSON.stringify([row]) },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      emitError(`فشل حفظ البيانات`, `${collection}: HTTP ${res.status} ${errText}`);
      return false;
    }
    return true;
  } catch (e: any) {
    emitError(`فشل الاتصال لحفظ البيانات`, e?.message);
    return false;
  }
}

/**
 * Upsert multiple items in a collection (batch).
 * Used for saving entire arrays efficiently.
 */
export async function upsertRecords(
  owner: Owner,
  collection: string,
  items: any[],
): Promise<boolean> {
  if (!items.length) return true;

  try {
    const rows: RecordRow[] = items
      .filter(item => item?.id)
      .map(item => ({
        owner,
        collection,
        record_id: String(item.id),
        data: item,
        updated_at: Date.now(),
        deleted: false,
      }));

    // Batch in chunks of 50
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const res = await supaFetch(
        `${SUPABASE_URL}/rest/v1/records?on_conflict=owner,collection,record_id`,
        { method: 'POST', headers: writeHeaders(), body: JSON.stringify(chunk) },
      );

      if (!res.ok) {
        emitError(`فشل حفظ ${collection}`, `HTTP ${res.status}`);
        return false;
      }
    }
    return true;
  } catch (e: any) {
    emitError(`فشل الاتصال لحفظ ${collection}`, e?.message);
    return false;
  }
}

/**
 * Soft-delete a record (mark as deleted, don't remove from DB).
 */
export async function deleteRecord(
  owner: Owner,
  collection: string,
  recordId: string,
): Promise<boolean> {
  try {
    const row: RecordRow = {
      owner,
      collection,
      record_id: recordId,
      data: {},
      updated_at: Date.now(),
      deleted: true,
    };

    const res = await supaFetch(
      `${SUPABASE_URL}/rest/v1/records?on_conflict=owner,collection,record_id`,
      { method: 'POST', headers: writeHeaders(), body: JSON.stringify([row]) },
    );

    if (!res.ok) {
      emitError(`فشل حذف العنصر`, `HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (e: any) {
    emitError(`فشل الاتصال لحذف العنصر`, e?.message);
    return false;
  }
}

/**
 * Save a setting to Supabase.
 */
export async function saveSetting(
  owner: Owner,
  key: string,
  value: string,
): Promise<boolean> {
  try {
    const row = {
      owner,
      key,
      value,
      updated_at: Date.now(),
    };

    const res = await supaFetch(
      `${SUPABASE_URL}/rest/v1/settings?on_conflict=owner,key`,
      { method: 'POST', headers: writeHeaders(), body: JSON.stringify([row]) },
    );

    if (!res.ok) {
      emitError(`فشل حفظ الإعداد ${key}`, `HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (e: any) {
    emitError(`فشل الاتصال لحفظ الإعداد`, e?.message);
    return false;
  }
}

/**
 * Replace an entire collection with new items.
 * Deletes items not in the new array, upserts those in it.
 */
export async function replaceCollection(
  owner: Owner,
  collection: string,
  newItems: any[],
): Promise<boolean> {
  try {
    logger.action(`replaceCollection: ${collection}`, { owner, newCount: newItems.length });
    // 1. Fetch current IDs from cloud
    const currentItems = await fetchCollection(owner, collection);
    const newIds = new Set(newItems.filter(i => i?.id).map(i => String(i.id)));
    
    // 2. Find items to delete (in cloud but not in new array)
    const toDelete = currentItems
      .filter((item: any) => item?.id && !newIds.has(String(item.id)));
    
    logger.action(`replaceCollection diff: ${collection}`, { current: currentItems.length, new: newItems.length, toDelete: toDelete.length });
    
    // 3. Delete removed items
    for (const item of toDelete) {
      await deleteRecord(owner, collection, String(item.id));
    }
    
    // 4. Upsert all new items
    const result = await upsertRecords(owner, collection, newItems);
    logger.action(`replaceCollection result: ${collection}`, { success: result, owner });
    return result;
  } catch (e: any) {
    logger.error(`replaceCollection failed: ${collection}`, { error: e?.message, owner });
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ── REALTIME: Subscribe to changes ───────────────────────────────
// ═══════════════════════════════════════════════════════════════════

/**
 * Subscribe to changes on the records table.
 * Calls onUpdate whenever any record changes.
 * Returns an unsubscribe function.
 */
export function subscribeToChanges(
  onUpdate: () => void,
): () => void {
  if (!SUPABASE_URL || !SUPABASE_KEY) return () => {};

  // Use Supabase Realtime via WebSocket
  const wsUrl = SUPABASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  const channel = `realtime:public:records`;

  let ws: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout>;
  let stopped = false;

  function connect() {
    if (stopped) return;
    
    try {
      ws = new WebSocket(
        `${wsUrl}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`
      );

      ws.onopen = () => {
        // Join the channel
        ws?.send(JSON.stringify({
          topic: channel,
          event: 'phx_join',
          payload: {
            config: {
              broadcast: { self: false },
              postgres_changes: [
                { event: '*', schema: 'public', table: 'records' },
                { event: '*', schema: 'public', table: 'settings' },
              ],
            },
          },
          ref: '1',
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          // postgres_changes events trigger a data refresh
          if (msg.event === 'postgres_changes') {
            onUpdate();
          }
          // Keep-alive
          if (msg.event === 'phx_reply' || msg.event === 'heartbeat') {
            // Send heartbeat back
          }
        } catch {}
      };

      ws.onerror = () => {
        logger.warn('[realtime] WebSocket error');
      };

      ws.onclose = () => {
        if (!stopped) {
          retryTimer = setTimeout(connect, 5000);
        }
      };
    } catch {
      if (!stopped) {
        retryTimer = setTimeout(connect, 5000);
      }
    }
  }

  connect();

  // Also use visibility change as a fallback sync mechanism
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      onUpdate();
    }
  };
  document.addEventListener('visibilitychange', onVisible);

  // Periodic fallback: check every 30 seconds
  const interval = setInterval(onUpdate, 30000);

  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisible);
    if (ws) {
      ws.close();
      ws = null;
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// ── CONVENIENCE: Higher-level operations ─────────────────────────
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch fresh user list (global collection).
 */
export async function fetchUsers(): Promise<any[]> {
  return fetchCollection('__global__', 'appUsers');
}

/**
 * Save an entire array (students, employees, etc.) to Supabase.
 * This is the WRITE equivalent of the old localStorage.setItem.
 */
export async function saveArray(
  owner: Owner,
  collection: string,
  items: any[],
): Promise<boolean> {
  return upsertRecords(owner, collection, items);
}

/**
 * Save a single item and return success/failure.
 */
export async function saveItem(
  owner: Owner,
  collection: string,
  item: any,
): Promise<boolean> {
  return upsertRecord(owner, collection, item);
}

/**
 * Remove a single item from a collection.
 */
export async function removeItem(
  owner: Owner,
  collection: string,
  itemId: string,
): Promise<boolean> {
  return deleteRecord(owner, collection, itemId);
}

// server/src/whatsapp/client.js
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

// ====== CONSTANTS ======
const DEFAULT_CLIENT_ID = 'codinovo';
const SESS_BASE = path.join(process.cwd(), '.wwebjs_auth');

// ====== IN-MEMORY STATE ======
/** In-memory registry */
const state = {
  defaults: {
    client: null,
    ready: false,
    lastError: null,
    lastQR: null,
    initializing: false,   // single-flight guard
    // NEW: timestamps
    lastReadyAt: null,
    lastEventAt: null,
  },
  // clientId -> { client, ready, lastError, lastQR, initializing, lastReadyAt, lastEventAt }
  pool: new Map(),

  // -------- Global sender pool (round-robin) --------
  global: {
    // clientId -> { weight, enabled }
    entries: new Map(),
    rrList: [],   // expanded list of clientIds by weight
    rrIdx: 0,
  },
};

// ====== HELPERS ======
function nowTs() { return Date.now(); }
function digitsOnly(s) { return String(s || '').replace(/\D/g, ''); }
function sessionDirFor(clientId) { return path.join(SESS_BASE, `session-${clientId}`); }

/** Remove Chrome's stale lock files so a new browser can boot cleanly */
function cleanChromeLocks(clientId) {
  try {
    const dir = sessionDirFor(clientId);
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith('Singleton')) {
        try { fs.rmSync(path.join(dir, f), { force: true }); } catch {}
      }
    }
  } catch {}
}

/** Build LocalAuth with deterministic folder */
function mkAuth(clientId) {
  return new LocalAuth({ clientId });
}

/** Build WhatsApp client (optionally pin web version) */
function mkClient(clientId) {
  const execPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const opts = {
    authStrategy: mkAuth(clientId),
    puppeteer: {
      headless: true,
      executablePath: execPath && execPath.length ? execPath : undefined,
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'],
      timeout: 60000,
    },
  };
  if (process.env.WWEBJS_WEB_VERSION) {
    opts.webVersion = process.env.WWEBJS_WEB_VERSION;
    opts.webVersionCache = { type: 'local' };
  }
  return new Client(opts);
}

// ====== DISK UTILITIES (NEW) ======
/** list all clientIds that have a LocalAuth folder on disk */
function listAuthSessionClientIds() {
  try {
    if (!fs.existsSync(SESS_BASE)) return [];
    const dirs = fs.readdirSync(SESS_BASE)
      .filter(name => name.startsWith('session-'))
      .map(name => name.replace(/^session-/, ''))
      .filter(Boolean);
    return Array.from(new Set(dirs));
  } catch { return []; }
}

/** get total size and latest mtime of a folder tree */
function folderStats(p) {
  let size = 0;
  let mtime = 0;
  try {
    if (!fs.existsSync(p)) return { size, mtime };
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir)) {
        const fp = path.join(dir, f);
        const st = fs.statSync(fp);
        mtime = Math.max(mtime, st.mtimeMs || 0);
        if (st.isDirectory()) walk(fp);
        else size += st.size || 0;
      }
    };
    walk(p);
  } catch {}
  return { size, mtime };
}

/** recursively delete a folder (safe) */
async function deleteFolderRecursive(p) {
  try { await fs.promises.rm(p, { recursive: true, force: true }); } catch {}
}

// ====== EVENT ATTACHMENT (UPDATED) ======
/** Attach listeners; do not throw from here */
function attach(clientId, holder) {
  const label = clientId === DEFAULT_CLIENT_ID ? 'default' : clientId;
  const { client } = holder;

  client.on('qr', (qr) => {
    try {
      holder.lastQR = qr;
      holder.lastEventAt = nowTs(); // NEW
      console.log(`[WA:${label}] Scan this QR to login:`);
      qrcode.generate(qr, { small: true });
    } catch {}
  });

  client.on('ready', () => {
    try {
      holder.ready = true;
      holder.lastError = null;
      holder.initializing = false;
      holder.lastReadyAt = nowTs();   // NEW
      holder.lastEventAt = holder.lastReadyAt; // NEW
      console.log(`[WA:${label}] ready`);
    } catch {}
  });

  client.on('auth_failure', (msg) => {
    try {
      holder.ready = false;
      holder.initializing = false;
      holder.lastError = String(msg || 'auth_failure');
      holder.lastEventAt = nowTs(); // NEW
      console.error(`[WA:${label}] auth_failure:`, msg);
    } catch {}
  });

  client.on('disconnected', (reason) => {
    try {
      holder.ready = false;
      holder.initializing = false;
      holder.lastError = String(reason || 'disconnected');
      holder.lastEventAt = nowTs(); // NEW
      console.warn(`[WA:${label}] disconnected:`, reason);
      // Leave not-ready; higher layers will fallback (dedicated->global->default)
    } catch {}
  });
}

/** Single-flight initialize: avoids multiple Chromium launches */
async function initializeOnce(clientId, holder) {
  if (holder.initializing || holder.ready) return; // already in progress or ready
  holder.initializing = true;
  cleanChromeLocks(clientId);
  try {
    await holder.client.initialize();
  } catch (e) {
    holder.initializing = false;
    holder.lastError = String(e?.message || e);
    // swallow to avoid crashing the process
  }
}

// ====== DEFAULT CLIENT ======
export function initWhatsApp() {
  if (state.defaults.client) return state.defaults.client;
  state.defaults.client = mkClient(DEFAULT_CLIENT_ID);
  state.defaults.ready = false;
  state.defaults.lastError = null;
  state.defaults.lastQR = null;
  state.defaults.initializing = false;
  state.defaults.lastReadyAt = null; // NEW
  state.defaults.lastEventAt = null; // NEW
  attach(DEFAULT_CLIENT_ID, state.defaults);
  // fire and forget
  initializeOnce(DEFAULT_CLIENT_ID, state.defaults);
  return state.defaults.client;
}

// ====== MULTI-CLIENT POOL ======
export function ensureClient(clientId) {
  const id = String(clientId || '').trim();
  if (!id) throw new Error('clientId_required');

  if (state.pool.has(id)) {
    const h = state.pool.get(id);
    initializeOnce(id, h);
    return h.client;
  }

  const holder = {
    client: mkClient(id),
    ready: false,
    lastQR: null,
    lastError: null,
    initializing: false,
    // NEW
    lastReadyAt: null,
    lastEventAt: null,
  };
  state.pool.set(id, holder);
  attach(id, holder);
  initializeOnce(id, holder);
  return holder.client;
}

/** send using default client (GLOBAL legacy) */
export async function sendWaMessage(phone, text) {
  await waitWhatsAppReady();
  const digits = digitsOnly(phone);
  if (!digits || digits.length < 9) {
    const e = new Error('invalid_phone'); e.code = 'invalid_phone'; throw e;
  }
  try {
    const numberId = await state.defaults.client.getNumberId(digits);
    if (!numberId) { const e = new Error('not_registered_on_whatsapp'); e.code = 'not_registered_on_whatsapp'; throw e; }
    const jid = numberId._serialized;
    return await state.defaults.client.sendMessage(jid, text);
  } catch (err) {
    const e = new Error(err?.code || 'send_failed'); e.code = err?.code || 'send_failed'; e.cause = err; throw e;
  }
}

/** send using specific clientId from pool (no hard wait; caller may fallback) */
export async function sendWaMessageFrom(clientId, phone, text) {
  const id = String(clientId || '').trim();
  if (!id) throw new Error('clientId_required');

  ensureClient(id);
  const holder = state.pool.get(id);

  const digits = digitsOnly(phone);
  if (!digits || digits.length < 9) {
    const e = new Error('invalid_phone'); e.code = 'invalid_phone'; throw e;
  }

  try {
    const numberId = await holder.client.getNumberId(digits);
    if (!numberId) { const e = new Error('not_registered_on_whatsapp'); e.code = 'not_registered_on_whatsapp'; throw e; }
    const jid = numberId._serialized;
    return await holder.client.sendMessage(jid, text);
  } catch (err) {
    const e = new Error(err?.code || 'send_failed'); e.code = err?.code || 'send_failed'; e.cause = err; throw e;
  }
}

/** readiness helpers */
export async function waitWhatsAppReady(timeoutMs = 3000) {
  if (state.defaults.ready) return true;
  return new Promise((res) => {
    const started = Date.now();
    const iv = setInterval(() => {
      if (state.defaults.ready) { clearInterval(iv); res(true); }
      else if (Date.now() - started >= timeoutMs) { clearInterval(iv); res(false); }
    }, 250);
  });
}

export function isDefaultReady() {
  return !!state.defaults.ready;
}

// Non-blocking attempt to send via DEFAULT. Returns { ok, error? }
export async function trySendViaDefault(phone, text) {
  if (!state.defaults.ready) return { ok: false, error: 'default_not_ready' };
  const digits = digitsOnly(phone);
  if (!digits || digits.length < 9) return { ok: false, error: 'invalid_phone' };
  try {
    const numberId = await state.defaults.client.getNumberId(digits);
    if (!numberId) return { ok: false, error: 'not_registered_on_whatsapp' };
    const jid = numberId._serialized;
    await state.defaults.client.sendMessage(jid, text);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.code || err?.message || 'send_failed' };
  }
}

export function isClientReady(clientId) {
  const id = String(clientId || '').trim();
  if (!id) return !!state.defaults.ready;
  const holder = state.pool.get(id);
  return !!holder?.ready;
}

/** list / inspect sessions (for admin UI) */
export function listSessions() {
  const list = [{
    clientId: DEFAULT_CLIENT_ID,
    default: true,
    ready: state.defaults.ready,
    lastError: state.defaults.lastError || null,
    hasQR: !!state.defaults.lastQR,
    // NEW
    lastReadyAt: state.defaults.lastReadyAt || null,
    lastEventAt: state.defaults.lastEventAt || null,
  }];
  for (const [id, h] of state.pool.entries()) {
    list.push({
      clientId: id,
      default: false,
      ready: !!h.ready,
      lastError: h.lastError || null,
      hasQR: !!h.lastQR,
      // NEW
      lastReadyAt: h.lastReadyAt || null,
      lastEventAt: h.lastEventAt || null,
    });
  }
  return list;
}

export function getSession(clientId) {
  const id = String(clientId || '').trim();
  if (id === DEFAULT_CLIENT_ID) {
    return {
      clientId: id, default: true,
      ready: state.defaults.ready,
      lastError: state.defaults.lastError || null,
      hasQR: !!state.defaults.lastQR, qr: state.defaults.lastQR || null,
      // NEW
      lastReadyAt: state.defaults.lastReadyAt || null,
      lastEventAt: state.defaults.lastEventAt || null,
    };
  }
  const h = state.pool.get(id);
  if (!h) return null;
  return {
    clientId: id, default: false,
    ready: !!h.ready, lastError: h.lastError || null,
    hasQR: !!h.lastQR, qr: h.lastQR || null,
    // NEW
    lastReadyAt: h.lastReadyAt || null,
    lastEventAt: h.lastEventAt || null,
  };
}

/** Explicit restart (admin action) */
export async function restartSession(clientId) {
  const id = String(clientId || '').trim();
  const h = id === DEFAULT_CLIENT_ID ? state.defaults : state.pool.get(id);
  if (!h) throw new Error('not_found');
  try { await h.client.destroy(); } catch {}
  h.ready = false;
  h.lastError = null;
  h.lastQR = null;
  h.initializing = false;
  cleanChromeLocks(id);
  h.client = mkClient(id);
  attach(id, h);
  await initializeOnce(id, h);
  return true;
}

/** Explicit logout (admin action) */
export async function logoutSession(clientId) {
  const id = String(clientId || '').trim();
  const h = id === DEFAULT_CLIENT_ID ? state.defaults : state.pool.get(id);
  if (!h) throw new Error('not_found');
  try {
    await h.client.logout();
    await h.client.destroy();
  } catch {}
  h.ready = false;
  h.lastError = null;
  h.lastQR = null;
  h.initializing = false;
  cleanChromeLocks(id);
  // keep entry so UI still shows it; re-init later on demand
  h.client = mkClient(id);
  attach(id, h);
  return true;
}

/* ---------------- Global Pool Management ---------------- */

/** rebuild round-robin list from entries (respect weight, enabled) */
function rebuildRR() {
  const arr = [];
  for (const [id, meta] of state.global.entries) {
    if (!meta.enabled) continue;
    const w = Math.max(0, Number(meta.weight) || 0);
    for (let i = 0; i < w; i++) arr.push(id);
  }
  state.global.rrList = arr;
  if (state.global.rrIdx >= arr.length) state.global.rrIdx = 0;
}

/** Add/update a client in global pool */
export function globalPoolAdd(clientId, weight = 1) {
  const id = String(clientId || '').trim();
  if (!id) return;
  const meta = state.global.entries.get(id) || { enabled: true, weight: 1 };
  meta.enabled = true;
  meta.weight = Math.max(0, Number(weight) || 1);
  state.global.entries.set(id, meta);
  rebuildRR();
}

/** Remove (disable) a client from global pool */
export function globalPoolRemove(clientId) {
  const id = String(clientId || '').trim();
  if (!id) return;
  const meta = state.global.entries.get(id);
  if (meta) {
    meta.enabled = false;
    state.global.entries.set(id, meta);
  }
  rebuildRR();
}

/** Pick next READY clientId from rrList; returns null if none ready */
function pickGlobalReadyClientId() {
  const list = state.global.rrList;
  if (!list.length) return null;
  const start = state.global.rrIdx;
  for (let i = 0; i < list.length; i++) {
    const idx = (start + i) % list.length;
    const id = list[idx];
    if (isClientReady(id)) {
      state.global.rrIdx = (idx + 1) % list.length;
      return id;
    }
  }
  return null;
}

/** Try to send via any READY global sender; returns { ok, via, clientId } */
export async function sendViaGlobal(phone, text) {
  const id = pickGlobalReadyClientId();
  if (!id) return { ok: false, via: 'GLOBAL_POOL', clientId: null };
  try {
    await sendWaMessageFrom(id, phone, text);
    return { ok: true, via: 'GLOBAL_POOL', clientId: id };
  } catch (e) {
    // move pointer forward and let caller fallback
    return { ok: false, via: 'GLOBAL_POOL', clientId: id, error: e?.code || e?.message || String(e) };
  }
}

/* ---------------- Admin Introspection & Cleanup (NEW) ---------------- */

/** memory + disk merged snapshot used by admin sweep */
export function listSessionsDetailedWithDisk() {
  const mem = listSessions();
  const seen = new Set();
  const out = [];

  // include memory-known first
  for (const m of mem) {
    seen.add(m.clientId);
    const dir = sessionDirFor(m.clientId);
    const st = folderStats(dir);
    out.push({
      ...m,
      onDisk: fs.existsSync(dir),
      diskSize: st.size,
      diskMtime: st.mtime,
    });
  }

  // add zombies: disk-only folders
  const diskIds = listAuthSessionClientIds();
  for (const id of diskIds) {
    if (seen.has(id)) continue;
    const dir = sessionDirFor(id);
    const st = folderStats(dir);
    out.push({
      clientId: id,
      default: id === DEFAULT_CLIENT_ID,
      ready: false,
      lastError: null,
      hasQR: false,
      lastReadyAt: null,
      lastEventAt: null,
      onDisk: true,
      diskSize: st.size,
      diskMtime: st.mtime,
    });
  }

  return out;
}

/** Hard destroy: stop client, remove from pool & RR, delete LocalAuth folder. */
export async function destroyAndRemoveSession(clientId, { deleteAuthFolder = true } = {}) {
  const id = String(clientId || '').trim();
  if (!id) throw new Error('clientId_required');
  if (id === DEFAULT_CLIENT_ID) throw new Error('cannot_delete_default');

  // remove from RR pool if present
  try { state.global.entries.delete(id); rebuildRR(); } catch {}

  // stop/destroy running client if exists
  const h = state.pool.get(id);
  if (h) {
    try { await h.client.destroy(); } catch {}
    state.pool.delete(id);
  }

  // delete LocalAuth folder
  if (deleteAuthFolder) {
    const dir = sessionDirFor(id);
    await deleteFolderRecursive(dir);
  }
  return true;
}

// Expose some fs helpers for admin routes (optional)
export const _sessionFs = { SESS_BASE, sessionDirFor, listAuthSessionClientIds, folderStats };
// web/src/lib/api.js
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

export function setToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

/* ------------------------------------------------------------------
   Lightweight global "data changed" event bus (no full-page reloads)
-------------------------------------------------------------------*/
const EVENT_NAME = 'data:changed';

export function onDataChanged(handler){
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

function emitDataChanged(detail){
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  } catch {}
}

const WRITE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

function shouldEmit(config){
  // Respect explicit opt-out header
  const headers = config?.headers || {};
  const noReload =
    headers['X-No-Reload'] === '1' ||
    headers['x-no-reload'] === '1';

  if (noReload) return false;

  const url = String(config?.url || '');

  // Ignore auth/registration & demo endpoints (usually cause their own navigations)
  if (
    url.includes('/auth/register') ||
    url.includes('/auth/verify-otp') ||
    url.includes('/auth/resend-otp') ||
    url.includes('/demo/otp/')
  ) {
    return false;
  }

  return true;
}

// Emit an event after any successful mutating request.
// Pages can listen and refetch, so no hard window.location.reload needed.
api.interceptors.response.use(
  (response) => {
    const cfg = response?.config || {};
    const method = (cfg.method || '').toLowerCase();

    if (WRITE_METHODS.has(method) && shouldEmit(cfg)) {
      emitDataChanged({ method, url: cfg.url, ts: Date.now() });
    }
    return response;
  },
  (error) => Promise.reject(error)
);
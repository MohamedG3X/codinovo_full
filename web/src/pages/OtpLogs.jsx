// web/src/pages/OtpLogs.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api, setToken } from '../lib/api';
import { Link } from 'react-router-dom';
import {
  MessageSquare, ListOrdered, RefreshCw, AlertTriangle,
  ChevronLeft, ChevronRight, Copy, CheckCircle2, XCircle, Clock
} from 'lucide-react';

export default function OtpLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [limit, setLimit] = useState(20);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  function formatDate(v) {
    if (!v) return '—';
    const d = typeof v === 'number' ? new Date(v) : new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  }

  async function fetchLogs(p = page, l = limit) {
    setBusy(true); setErr('');
    try {
      setToken(localStorage.getItem('api_token'));
      const { data } = await api.get(`/api/logs?page=${p}&limit=${l}`);
      setLogs(data.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load logs');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { fetchLogs(); /* eslint-disable-next-line */ }, [page, limit]);

  const hasPrev = page > 1;
  const hasNext = logs.length >= limit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative">
      {/* background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className={`absolute top-24 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 ${prefersReducedMotion ? '' : 'animate-pulse'}`}></div>
        <div className={`absolute top-40 right-20 w-24 h-24 bg-indigo-100 rounded-full opacity-30 ${prefersReducedMotion ? '' : 'animate-bounce'}`}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-50 rounded-full opacity-25"></div>
      </div>

      {/* nav */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Codinovo
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/docs" className="text-gray-600 hover:text-blue-600 transition-colors">Docs</Link>
            <Link to="/app" className="text-gray-600 hover:text-blue-600 transition-colors">Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* content */}
      <main className="relative z-10 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center">
                <ListOrdered className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">OTP Logs</h1>
                <p className="text-sm text-gray-600">View recent OTP sends, status, and cost.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={limit}
                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
              >
                {[10,20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>
              <button
                onClick={() => fetchLogs()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                disabled={busy}
                aria-label="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    <Th>Phone</Th>
                    <Th>OTP</Th>
                    <Th>Status</Th>
                    <Th>Cost</Th>
                    <Th>Sent At</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {busy && SkeletonRows(limit, 5)}
                  {!busy && logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <AlertTriangle className="w-5 h-5" />
                          <span>No logs found.</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!busy && logs.map(l => (
                    <tr key={l._id} className="hover:bg-gray-50">
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{l.phone}</span>
                          <CopyButton value={l.phone} />
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{l.otp}</code>
                          <CopyButton value={String(l.otp || '')} />
                        </div>
                      </Td>
                      <Td><StatusChip status={l.status} /></Td>
                      <Td>${Number(l.cost || 0).toFixed(2)}</Td>
                      <Td className="text-gray-900">{formatDate(l.sentAt || l.createdAt || l.timestamp)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Page <b>{page}</b> <span className="hidden sm:inline">• Showing up to {limit} items</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!hasPrev || busy}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasNext || busy}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* legend */}
          <div className="mt-4 text-xs text-gray-500 flex items-center gap-4">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> delivered</span>
            <span className="inline-flex items-center gap-1"><XCircle className="w-4 h-4 text-red-600" /> failed</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4 text-indigo-600" /> pending</span>
          </div>
        </div>
      </main>
    </div>
  );
}

/* UI helpers */
function Th({ children, className = '' }) {
  return <th className={`p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${className}`}>{children}</th>;
}
function Td({ children, className = '' }) {
  return <td className={`p-3 align-middle text-gray-800 ${className}`}>{children}</td>;
}
function StatusChip({ status }) {
  const s = String(status || '').toLowerCase();
  if (s.includes('deliver') || s === 'success' || s === 'ok') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-4 h-4" /> {status || 'delivered'}</span>;
  }
  if (s.includes('fail') || s === 'error') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-50 text-red-700 border border-red-200"><XCircle className="w-4 h-4" /> {status || 'failed'}</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200"><Clock className="w-4 h-4" /> {status || 'pending'}</span>;
}
function SkeletonRows(count, cols = 5) {
  return Array.from({ length: Math.min(count, 10) }).map((_, i) => (
    <tr key={`skeleton-${i}`} className="animate-pulse">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="p-3"><div className="h-4 bg-gray-100 rounded" /></td>
      ))}
    </tr>
  ));
}
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(value || ''); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
      }}
      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
      title="Copy"
    >
      {copied ? <span className="text-green-600">Copied</span> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

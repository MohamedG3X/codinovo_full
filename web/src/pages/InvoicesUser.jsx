// web/src/pages/InvoicesUser.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import {
  MessageSquare, FileText, RefreshCw, AlertTriangle,
  Calendar, ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';

export default function InvoicesUser() {
  const token = localStorage.getItem('api_token');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [busy, setBusy] = useState(false);

  // honor reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  async function loadMyInvoices() {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await api.get('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr('Failed to load invoices');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) loadMyInvoices(); }, [token]);

  async function openPdf(invId) {
    try {
      const { data } = await api.get(`/api/invoices/${invId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      alert('Failed to open PDF');
    }
  }

  // generate my invoice for chosen month
  async function generateMyMonth() {
    setBusy(true);
    try {
      await api.post('/api/invoices/generate-my', { year, month }, {
        headers: { Authorization: `Bearer ${token}`, 'X-No-Reload': '1' }
      });
      await loadMyInvoices();
      alert('Invoice generated/updated.');
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setBusy(false);
    }
  }

  // open PDF for chosen month (if exists, else offer to generate)
  async function openSelectedMonthPdf() {
    setBusy(true);
    try {
      const { data: inv } = await api.get(`/api/invoices/by-month?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await openPdf(inv._id);
    } catch (e) {
      if (e?.response?.status === 404) {
        const ok = confirm('No invoice for that month. Generate it now?');
        if (ok) {
          await generateMyMonth();
        }
      } else {
        alert('Could not fetch invoice for that month.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-[50vh] grid place-items-center p-6">
        <div className="text-gray-700">Please log in.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative">
      {/* background decorations */}
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
          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Invoices</h1>
                <p className="text-sm text-gray-600">Generate, view, and download your monthly invoices.</p>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <MonthPicker
                year={year} month={month}
                setYear={setYear} setMonth={setMonth}
              />
              <button
                onClick={generateMyMonth}
                disabled={busy}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white ${busy ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} transition`}
                title="Generate or update your invoice for the selected month"
              >
                {busy ? <>Working…</> : <>Generate for Month</>}
              </button>
              <button
                onClick={openSelectedMonthPdf}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                title="Open PDF for the selected month (if exists)"
              >
                <ExternalLink className="w-4 h-4" />
                Open PDF
              </button>
              <button
                onClick={() => loadMyInvoices()}
                disabled={loading || busy}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                title="Refresh list"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-lg">
            {/* list / table */}
            <div className="overflow-x-auto">
              {err && (
                <div className="px-4 pt-4">
                  <div className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 inline-flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {err}
                  </div>
                </div>
              )}

              <table className="min-w-full text-sm">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    <Th>Period</Th>
                    <Th>Messages</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th>PDF</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && SkeletonRows(6, 5)}
                  {!loading && items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-gray-600">No invoices yet.</td>
                    </tr>
                  )}
                  {!loading && items.map(inv => (
                    <tr key={inv._id} className="hover:bg-gray-50">
                      <Td>
                        {formatDate(inv.periodStart)} → {formatDate(inv.periodEnd)}
                      </Td>
                      <Td>{Number(inv.messageCount || 0).toLocaleString()}</Td>
                      <Td>{formatCurrency(inv.totalAmount)}</Td>
                      <Td><StatusBadge status={inv.status} /></Td>
                      <Td>
                        <button
                          onClick={() => openPdf(inv._id)}
                          className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800"
                        >
                          View PDF <ExternalLink className="w-4 h-4" />
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* optional simple pager for long lists (client-side) */}
            {items.length > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Showing {Math.min(items.length, 50)} of {items.length}
                </div>
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50" disabled>
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50" disabled>
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500 inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Tip: pick a month, then “Generate for Month” to create/update its invoice.
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------ UI helpers ------------------------------ */
function MonthPicker({ year, month, setYear, setMonth }) {
  const years = Array.from({ length: 10 }).map((_, i) => new Date().getFullYear() - i);
  const months = [
    [1,'Jan'],[2,'Feb'],[3,'Mar'],[4,'Apr'],[5,'May'],[6,'Jun'],
    [7,'Jul'],[8,'Aug'],[9,'Sep'],[10,'Oct'],[11,'Nov'],[12,'Dec']
  ];
  return (
    <div className="flex items-end gap-2">
      <label className="text-sm">
        <span className="block text-gray-700 mb-1">Year</span>
        <select
          className="border border-gray-200 rounded-xl px-3 py-2"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
      <label className="text-sm">
        <span className="block text-gray-700 mb-1">Month</span>
        <select
          className="border border-gray-200 rounded-xl px-3 py-2"
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
        >
          {months.map(([m, label]) => <option key={m} value={m}>{label}</option>)}
        </select>
      </label>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}
function Td({ children }) {
  return <td className="px-4 py-3 align-middle text-gray-800">{children}</td>;
}

function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  const base = 'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border';
  if (s.includes('paid') || s === 'paid') {
    return <span className={`${base} bg-green-50 text-green-700 border-green-200`}>Paid</span>;
  }
  if (s.includes('due') || s === 'due' || s === 'unpaid') {
    return <span className={`${base} bg-yellow-50 text-yellow-800 border-yellow-200`}>Due</span>;
  }
  return <span className={`${base} bg-gray-50 text-gray-700 border-gray-200`}>{status || '—'}</span>;
}

function SkeletonRows(rows = 6, cols = 5) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={`s-${i}`} className="animate-pulse">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded" />
        </td>
      ))}
    </tr>
  ));
}

function formatDate(v) {
  if (!v) return '—';
  const d = typeof v === 'number' ? new Date(v) : new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: '2-digit'
  }).format(d);
}
function formatCurrency(n) {
  const num = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

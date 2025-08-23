// web/src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api, setToken } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import StatsCards from '../components/StatsCards';
import ChartMonthly from '../components/ChartMonthly';

export default function Dashboard() {
  const [stats, setStats] = useState({ count: 0, cost: 0 });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [logs, setLogs] = useState([]);
  const [account, setAccount] = useState(null); // 👈 NEW state

  const nav = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem('api_token');
    if (!t) return nav('/login');
    setToken(t);

    (async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${t}` };

        // Load logs for the selected month
        const { data: list } = await api.get(`/api/logs?month=${ym.month}&year=${ym.year}`, { headers });
        const rows = Array.isArray(list?.data) ? list.data : [];
        setLogs(rows);

        const count = rows.length;
        const cost = rows.reduce((s, i) => s + (Number(i.cost) || 0), 0);

        // Load wallet balance
        const { data: balRes } = await api.get('/api/wallet/balance', { headers });

        // Load account info (username + level)
        const { data: accRes } = await api.get('/api/settings/account', { headers });
        setAccount(accRes);

        setStats({ count, cost });
        setBalance(Number(balRes.balance ?? 0));
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [ym, nav]);

  /* ----------------------- Derived analytics ----------------------- */
  const getWhen = (row) => {
    const t = row?.createdAt || row?.sentAt;
    return t ? new Date(t) : null;
  };

  const today = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const isToday = (d) => d && d >= start && d < end;

    const rowsToday = logs.filter((r) => isToday(getWhen(r)));
    const sentToday = rowsToday.length;
    const costToday = rowsToday.reduce((s, r) => s + (Number(r.cost) || 0), 0);

    const breakdownToday = rowsToday.reduce((acc, r) => {
      const k = String(r.status || 'UNKNOWN').toUpperCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const avgToday = sentToday ? costToday / sentToday : 0;

    return { rowsToday, sentToday, costToday, breakdownToday, avgToday };
  }, [logs]);

  const monthBreakdown = useMemo(() => {
    const breakdown = logs.reduce((acc, r) => {
      const k = String(r.status || 'UNKNOWN').toUpperCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const avgMonth = stats.count ? stats.cost / stats.count : 0;

    const phoneMap = new Map();
    for (const r of logs) {
      const key = r.phone || 'unknown';
      phoneMap.set(key, (phoneMap.get(key) || 0) + 1);
    }
    const topRecipients = [...phoneMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phone, cnt]) => ({ phone, count: cnt }));

    return { breakdown, avgMonth, topRecipients };
  }, [logs, stats]);

  function changeMonth(delta) {
    const d = new Date(ym.year, ym.month - 1 + delta, 1);
    setYm({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header with Username + Level */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Client Dashboard
          {account && (
            <span className="ml-3 text-lg font-normal text-gray-600">
              ({account.username} — Level {account.level})
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="px-2 py-1 border rounded">Prev</button>
          <div className="px-3 py-1 border rounded bg-gray-50 text-sm">
            {ym.year}-{String(ym.month).padStart(2, '0')}
          </div>
          <button onClick={() => changeMonth(1)} className="px-2 py-1 border rounded">Next</button>
        </div>
        <div className="space-x-4 text-sm">
          <Link className="underline" to="/logs">OTP Logs</Link>
          <Link className="underline" to="/settings">Settings</Link>
          <Link className="underline" to="/invoices">Invoices</Link>
          <button
            className="underline text-red-600"
            onClick={() => { localStorage.removeItem('api_token'); location.href = '/login'; }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Balance */}
      <div className="bg-white rounded shadow p-4">
        <div className="text-gray-500 text-sm">Wallet Balance</div>
        <div className="text-2xl font-semibold mt-1">${balance.toFixed(2)}</div>
      </div>

      {/* Today at a glance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Today - Sent" value={today.sentToday} />
        <Card title="Today - Cost" value={`$${today.costToday.toFixed(2)}`} />
        <Card title="Month Avg Cost / Msg" value={`$${monthBreakdown.avgMonth.toFixed(3)}`} />
        <Card title="Today Avg Cost / Msg" value={`$${today.avgToday.toFixed(3)}`} />
      </div>

      {/* Status + Top recipients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-3">Status Breakdown</h2>
          <div className="grid grid-cols-2 gap-4">
            <Breakdown title="This Month" data={monthBreakdown.breakdown} />
            <Breakdown title="Today" data={today.breakdownToday} />
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-3">Top Recipients (This Month)</h2>
          {monthBreakdown.topRecipients.length === 0 ? (
            <div className="text-gray-500 text-sm">No data.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2">Phone</th>
                    <th className="text-left px-4 py-2">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {monthBreakdown.topRecipients.map((r) => (
                    <tr key={r.phone} className="border-t">
                      <td className="px-4 py-2">{r.phone}</td>
                      <td className="px-4 py-2">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div>
        <h2 className="font-semibold mb-3">Messages (last 7 days)</h2>
        <ChartMonthly />
      </div>

      {/* Send OTP */}
      <div>
        <h2 className="font-semibold mb-3">Send Test OTP</h2>
        <SendTest />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Breakdown({ title, data }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const tagClass = (k) =>
    k === 'SENT' ? 'bg-blue-100 text-blue-700' :
    k === 'VERIFIED' ? 'bg-green-100 text-green-700' :
    k === 'FAILED' ? 'bg-red-100 text-red-700' :
    'bg-gray-100 text-gray-700';

  return (
    <div>
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      {entries.length === 0 ? (
        <div className="text-gray-400 text-sm">No data.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {entries.map(([k, v]) => (
            <span key={k} className={`px-3 py-1 rounded text-xs ${tagClass(k)}`}>
              {k}: {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SendTest() {
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState(null);
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    setMsg(null);
    try {
      const { data } = await api.post('/api/otp/send', { phone });
      const exp = data?.expiresAt ? new Date(data.expiresAt).toLocaleTimeString() : '';
      setMsg({ type: 'ok', text: `OTP sent ✅ ${exp ? `(expires ${exp})` : ''}`.trim() });
    } catch (e) {
      const code = e?.response?.data?.error;
      let text = 'Send failed';
      if (code === 'invalid_phone') text = 'Invalid phone number. Use e.g. 201234567890';
      else if (code === 'account_paused_or_pending') text = 'Your account is paused or pending approval.';
      else if (code === 'insufficient_balance') {
        const need = e?.response?.data?.need;
        const have = e?.response?.data?.have;
        text = `Insufficient balance (need ${need}, have ${have}). Please top up in Settings.`;
      } else if (code === 'send_failed') text = 'WhatsApp send failed. Please try again.';
      setMsg({ type: 'err', text });
    } finally {
      setSending(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && phone && !sending) send();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          className="border p-2 rounded w-64"
          placeholder="Phone e.g. 201234567890"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={handleKey}
          disabled={sending}
        />
        <button
          className={`px-4 py-2 rounded text-white ${sending ? 'bg-gray-400' : 'bg-black'}`}
          onClick={send}
          disabled={sending || !phone}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>

      {msg && (
        <div className={`mt-3 text-sm px-3 py-2 rounded border
          ${msg.type === 'ok'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
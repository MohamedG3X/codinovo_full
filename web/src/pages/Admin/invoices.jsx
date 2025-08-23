import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function AdminInvoices() {
  const token = localStorage.getItem('admin_token');
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [apiUserId, setApiUserId] = useState('');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      api.get('/admin/invoices', { headers }),
      api.get('/admin/users', { headers })
    ]).then(([invRes, userRes]) => {
      setItems(invRes.data || []);
      setUsers(userRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  async function generate() {
    if (!apiUserId) return alert('Select a user');
    setBusy(true);
    try {
      await api.post('/admin/invoices/generate', { apiUserId, year, month }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // reload
      const { data } = await api.get('/admin/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(data || []);
    } catch (e) {
      console.error(e);
      alert('Failed to generate invoice');
    } finally {
      setBusy(false);
    }
  }

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

  if (!token) return <div className="p-6">Please log in as admin.</div>;
  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg mb-3">All Invoices</h2>

        <div className="flex gap-2 items-end mb-4">
          <select
            className="border rounded p-2"
            value={apiUserId}
            onChange={e => setApiUserId(e.target.value)}
          >
            <option value="">Select API User</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>
                {u.username} ({u._id})
              </option>
            ))}
          </select>
          <input
            type="number"
            className="border rounded p-2 w-24"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          />
          <input
            type="number"
            className="border rounded p-2 w-20"
            min={1}
            max={12}
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
          />
          <button
            onClick={generate}
            disabled={busy || !apiUserId}
            className={`px-3 py-2 text-white rounded ${busy ? 'bg-gray-400' : 'bg-gray-900'}`}
          >
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-gray-500">No invoices yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Period</th>
                <th className="text-left px-4 py-3">Messages</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">PDF</th>
              </tr>
            </thead>
            <tbody>
              {items.map(inv => (
                <tr key={inv._id} className="border-t">
                  <td className="px-4 py-3">{inv.apiUser?.username || '-'}</td>
                  <td className="px-4 py-3">
                    {new Date(inv.periodStart).toLocaleDateString()} → {new Date(inv.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{inv.messageCount}</td>
                  <td className="px-4 py-3">${Number(inv.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3">{inv.status}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 underline" onClick={() => openPdf(inv._id)}>
                      View PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  );
}
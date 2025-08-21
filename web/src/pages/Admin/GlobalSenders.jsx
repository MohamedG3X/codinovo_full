// web/src/pages/Admin/GlobalSenders.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function GlobalSenders(){
  const headers = { Authorization: `Bearer ${localStorage.getItem('admin_token')}` };
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ clientId: '', label: '', enabled: true, weight: 1 });
  const [saving, setSaving] = useState(false);

  async function load(){
    const { data } = await api.get('/admin/global-senders', { headers });
    setItems(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load().catch(console.error); }, []); // eslint-disable-line

  async function create(){
    if (!form.clientId.trim()) return alert('clientId required');
    setSaving(true);
    try {
      await api.post('/admin/global-senders', form, { headers });
      setForm({ clientId: '', label: '', enabled: true, weight: 1 });
      await load();
      alert('Added. Scan QR in server logs if required.');
    } finally { setSaving(false); }
  }

  async function update(id, payload){
    await api.patch(`/admin/global-senders/${id}`, payload, { headers });
    await load();
  }

  async function restart(id){
    await api.post(`/admin/global-senders/${id}/restart`, {}, { headers });
    await load();
    alert('Restarted.');
  }

  async function logout(id){
    await api.post(`/admin/global-senders/${id}/logout`, {}, { headers });
    await load();
    alert('Logged out. Scan QR to login again.');
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Global Senders</h1>

      <div className="p-4 bg-white rounded shadow space-y-3">
        <div className="text-sm text-gray-700">Add a WhatsApp session to the global pool (used for fallback & load-balancing).</div>
        <div className="grid gap-2 sm:grid-cols-4">
          <input className="border p-2 rounded" placeholder="clientId" value={form.clientId}
                 onChange={e=>setForm(f=>({...f, clientId: e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="label (optional)" value={form.label}
                 onChange={e=>setForm(f=>({...f, label: e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="weight (default 1)" type="number" min="0" value={form.weight}
                 onChange={e=>setForm(f=>({...f, weight: Number(e.target.value)}))}/>
          <div className="flex items-center gap-2">
            <label className="text-sm">
              <input type="checkbox" className="mr-2" checked={form.enabled}
                     onChange={e=>setForm(f=>({...f, enabled: e.target.checked}))}/>
              Enabled
            </label>
            <button disabled={saving} onClick={create}
                    className={`px-3 py-2 rounded ${saving ? 'bg-gray-300' : 'bg-indigo-600 text-white'}`}>
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>ClientId</Th>
              <Th>Label</Th>
              <Th>Enabled</Th>
              <Th>Weight</Th>
              <Th>Session</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => {
              const sessBadge = it.session?.ready
                ? <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">Session OK</span>
                : <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">Session Error</span>;
              return (
                <tr key={it._id} className="border-t">
                  <Td className="break-all">{it.clientId}</Td>
                  <Td>{it.label || '—'}</Td>
                  <Td>
                    <button
                      onClick={() => update(it._id, { enabled: !it.enabled })}
                      className={`px-2 py-1 rounded ${it.enabled ? 'bg-emerald-600 text-white' : 'bg-gray-300'}`}>
                      {it.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <input className="border p-1 rounded w-20" type="number" min="0" defaultValue={it.weight}
                             onBlur={(e)=> {
                               const v = Number(e.target.value);
                               if (v !== it.weight) update(it._id, { weight: v });
                             }}/>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-xs text-gray-700">{it.session?.clientId || '—'}</div>
                    <div className="mt-1">{sessBadge}</div>
                    {it.session?.lastError && (
                      <div className="text-[11px] text-red-600 mt-1">{String(it.session.lastError)}</div>
                    )}
                  </Td>
                  <Td className="space-y-1">
                    <button onClick={() => restart(it._id)} className="px-3 py-1 rounded w-full bg-blue-600 text-white">Restart</button>
                    <button onClick={() => logout(it._id)} className="px-3 py-1 rounded w-full bg-gray-900 text-white">Logout</button>
                  </Td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center py-8 text-gray-500">No global senders yet.</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }){ return <th className="text-left px-4 py-3 whitespace-nowrap">{children}</th> }
function Td({ children, className='', ...rest }){ return <td className={`px-4 py-3 whitespace-nowrap ${className}`} {...rest}>{children}</td> }

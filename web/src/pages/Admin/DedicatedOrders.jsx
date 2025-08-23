import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function DedicatedOrders(){
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('ALL');
  const [assignForm, setAssignForm] = useState({}); // {[orderId]: { clientId, senderPhone }}

  const token = localStorage.getItem('admin_token');
  const headers = { Authorization: `Bearer ${token}` };

  async function load(){
    try {
      let url = '/admin/dedicated/orders';
      if (status !== 'ALL') url += `?status=${encodeURIComponent(status)}`;
      const { data } = await api.get(url, { headers });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  }

  useEffect(() => { load().catch(console.error); }, [status]); // eslint-disable-line

  const onAssignField = (orderId, field, value) => {
    setAssignForm(prev => ({
      ...prev,
      [orderId]: { ...(prev[orderId] || {}), [field]: value }
    }));
  };

  async function assign(orderId){
    const payload = assignForm[orderId] || {};
    if (!payload.clientId) return alert('clientId is required');
    await api.post(`/admin/dedicated/${orderId}/assign`, payload, { headers });
    alert('Assigned. Scan QR in server logs.');
    await load();
  }

  async function reassign(orderId){
    const payload = assignForm[orderId] || {};
    if (!payload.clientId) return alert('clientId is required');
    await api.post(`/admin/dedicated/${orderId}/reassign`, payload, { headers });
    alert('Reassigned. Scan QR in server logs.');
    await load();
  }

  async function activate(orderId){
    await api.post(`/admin/dedicated/${orderId}/activate`, {}, { headers });
    alert('Activated (30 days). $20 deducted from user wallet.');
    await load();
  }

  async function renew(orderId){
    await api.post(`/admin/dedicated/${orderId}/renew`, {}, { headers });
    alert('Renewed for 30 days. $20 deducted.');
    await load();
  }

  async function expire(orderId){
    await api.post(`/admin/dedicated/${orderId}/expire`, {}, { headers });
    alert('Expired now.');
    await load();
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dedicated Numbers</h1>

      <div className="flex gap-2">
        {['ALL','PENDING','ASSIGNED','ACTIVE','EXPIRED','CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded border text-sm ${status===s?'bg-gray-900 text-white':'bg-white'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>Created</Th>
              <Th>User</Th>
              <Th>Company</Th>
              <Th>Status</Th>
              <Th>ClientId / Session</Th>
              <Th>Sender Phone</Th>
              <Th>Expires</Th>
              <Th>Actions</Th>
            </tr>
          </thead>

          <tbody>
            {items.map(o => {
              const createdAt = new Date(o.createdAt).toLocaleString();
              const expires = o.expiresAt ? new Date(o.expiresAt).toLocaleDateString() : '—';

              const liveBadge = o.liveRoute === 'DEDICATED'
                ? <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">DEDICATED</span>
                : <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">GLOBAL</span>;

              const sessBadge = o.session?.ready
                ? <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">Session OK</span>
                : <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">Session Error</span>;

              const form = assignForm[o._id] || {};

              return (
                <tr key={o._id} className="border-t">
                  <Td>{createdAt}</Td>
                  <Td>{o.user?.username || '—'}</Td>
                  <Td>{o.companyName || '—'}</Td>

                  <Td>
                    <span className={`px-2 py-1 rounded text-xs ${
                      o.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      o.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                      o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      o.status === 'EXPIRED' ? 'bg-gray-100 text-gray-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {o.status}
                    </span>
                  </Td>

                  <Td>
                    <div className="text-xs text-gray-700 break-all">{o.session?.clientId || '—'}</div>
                    <div className="mt-1">{sessBadge}</div>
                    {o.session?.lastError && (
                      <div className="text-[11px] text-red-600 mt-1">{String(o.session.lastError)}</div>
                    )}

                    {(o.canAssign || o.canReassign) && (
                      <div className="mt-2 space-y-1">
                        <input
                          className="border p-1 rounded w-full"
                          placeholder="clientId"
                          value={form.clientId || ''}
                          onChange={e=>onAssignField(o._id,'clientId',e.target.value)}
                        />
                        <input
                          className="border p-1 rounded w-full"
                          placeholder="sender phone (optional, digits)"
                          value={form.senderPhone || ''}
                          onChange={e=>onAssignField(o._id,'senderPhone',e.target.value)}
                        />
                        <div className="text-[11px] text-gray-500">
                          After submit, scan QR from server logs.
                        </div>
                      </div>
                    )}
                  </Td>

                  <Td>{o.assignedSenderPhone || '—'}</Td>
                  <Td>{expires}</Td>

                  <Td className="space-y-1">
                    <div>{liveBadge}</div>

                    <button
                      disabled={!o.canAssign}
                      onClick={() => assign(o._id)}
                      className={`px-3 py-1 rounded w-full ${o.canAssign ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      Assign
                    </button>

                    <button
                      disabled={!o.canReassign}
                      onClick={() => reassign(o._id)}
                      className={`px-3 py-1 rounded w-full ${o.canReassign ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      Reassign
                    </button>

                    <button
                      disabled={!o.canActivate}
                      onClick={() => activate(o._id)}
                      className={`px-3 py-1 rounded w-full ${o.canActivate ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      Activate
                    </button>

                    <button
                      disabled={!o.canRenew}
                      onClick={() => renew(o._id)}
                      className={`px-3 py-1 rounded w-full ${o.canRenew ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      Renew
                    </button>

                    <button
                      disabled={!o.canExpire}
                      onClick={() => expire(o._id)}
                      className={`px-3 py-1 rounded w-full ${o.canExpire ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      Expire
                    </button>
                  </Td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <Td colSpan={8} className="text-center py-8 text-gray-500">No orders.</Td>
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
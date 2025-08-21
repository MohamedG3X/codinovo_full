// web/src/pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import useDataRefresh from '../hooks/useDataRefresh';

export default function Settings() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [otpTemplate, setOtpTemplate] = useState('');
  const [due, setDue] = useState(null);
  const [balance, setBalance] = useState(0);

  const [deposit, setDeposit] = useState(null);

  // profile + account
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [account, setAccount] = useState(null);

  // transactions
  const [txs, setTxs] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | PENDING | APPROVED | REJECTED

  const headers = { Authorization: `Bearer ${localStorage.getItem('api_token')}` };

  // central loader
  const load = async () => {
    try {
      const [tokenRes, tplRes, dueRes, balRes] = await Promise.all([
        api.get('/api/settings/service-token', { headers }),
        api.get('/api/settings/otp-template', { headers }),
        api.get('/api/billing/due-this-week', { headers }),
        api.get('/api/wallet/balance', { headers }),
      ]);
      setToken(tokenRes?.data?.token || '');
      setOtpTemplate(tplRes?.data?.otpTemplate || '');
      setDue(dueRes?.data || null);
      setBalance(balRes?.data?.balance ?? 0);
    } catch {}

    try {
      const dep = await api.get('/api/deposit', { headers });
      setDeposit(dep?.data ?? null);
    } catch { setDeposit(null); }

    try {
      const prof = await api.get('/api/settings/profile', { headers });
      setProfile(prof?.data ?? null);
      setEmail(prof?.data?.contactEmail || '');
    } catch {}

    try {
      const acc = await api.get('/api/settings/account', { headers });
      setAccount(acc?.data ?? null);
    } catch {}

    // transactions
    try {
      let url = '/api/wallet/transactions';
      if (statusFilter !== 'ALL') url += `?status=${encodeURIComponent(statusFilter)}`;
      setTxLoading(true);
      setTxError(null);
      const { data } = await api.get(url, { headers });
      setTxs(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setTxError('Failed to load transactions');
      setTxs([]);
    } finally {
      setTxLoading(false);
    }
  };

  // initial loads
  useEffect(() => {
    api.get('/api/settings/service-token', { headers }).then(({ data }) => setToken(data.token));
    api.get('/api/settings/otp-template', { headers }).then(({ data }) => setOtpTemplate(data.otpTemplate));
    api.get('/api/billing/due-this-week', { headers }).then(({ data }) => setDue(data));
    api.get('/api/wallet/balance', { headers }).then(({ data }) => setBalance(data.balance));
    api.get('/api/deposit', { headers }).then(({ data }) => setDeposit(data)).catch(() => setDeposit(null));
    api.get('/api/settings/profile', { headers })
      .then(({ data }) => { setProfile(data); setEmail(data?.contactEmail || ''); })
      .catch(() => {});
    api.get('/api/settings/account', { headers }).then(({ data }) => setAccount(data));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // global auto-reload after any change
  useDataRefresh(load);

  // reload tx when filter changes
  useEffect(() => {
    let url = '/api/wallet/transactions';
    if (statusFilter !== 'ALL') url += `?status=${encodeURIComponent(statusFilter)}`;

    setTxLoading(true);
    setTxError(null);
    api.get(url, { headers })
      .then(({ data }) => setTxs(Array.isArray(data?.data) ? data.data : []))
      .catch((e) => {
        console.error(e);
        setTxError('Failed to load transactions');
        setTxs([]);
      })
      .finally(() => setTxLoading(false));
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // actions
  const saveTemplate = async () => {
    await api.patch('/api/settings/otp-template', { otpTemplate }, { headers });
    alert('Template saved');
    await load();
  };

  const submitTopup = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await api.post('/api/wallet/topup', formData, { headers });
      alert('Top-up request sent! Please wait for admin approval.');
      e.target.reset();

      api.get('/api/wallet/balance', { headers }).then(({ data }) => setBalance(data.balance));

      if (statusFilter === 'ALL' || statusFilter === 'PENDING') {
        let url = '/api/wallet/transactions';
        if (statusFilter !== 'ALL') url += `?status=${encodeURIComponent(statusFilter)}`;
        setTxLoading(true);
        api.get(url, { headers })
          .then(({ data }) => setTxs(Array.isArray(data?.data) ? data.data : []))
          .finally(() => setTxLoading(false));
      }

      await load();
    } catch (err) {
      const errCode = err?.response?.data?.error;
      if (errCode === 'min_topup_is_10') alert('Minimum top-up is 10 USDT');
      else if (errCode === 'invalid_file_type') alert('Please upload an image file as proof.');
      else if (errCode === 'invalid_amount') alert('Please enter a valid amount.');
      else alert('Failed to submit top-up.');
    }
  };

  const saveEmail = async () => {
    setSavingEmail(true);
    try {
      const { data } = await api.patch('/api/settings/profile', { contactEmail: email }, { headers: { ...headers, 'X-No-Reload': '1' } });
      setProfile(data);
      alert('Email updated');
      await load();
    } catch (e) {
      const code = e?.response?.data?.error;
      alert(code === 'invalid_email' ? 'Please enter a valid email' : 'Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  };

  // click-anywhere refresh
  const onAnyAction = (e) => {
    const t = e.target;
    const isAction = (t?.closest && (t.closest('button') || t.closest('a[href]') || t.closest('input[type="submit"]') || t.closest('[data-refresh]')));
    if (isAction) setTimeout(() => { load(); }, 0);
  };

  const minTopup = typeof deposit?.minAmount === 'number' ? deposit.minAmount : 10;

  return (
    <div className="p-6 space-y-6" onClickCapture={onAnyAction}>
      {/* Wallet Balance */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg">Wallet Balance</h2>
        <div className="mt-2 text-xl font-bold">{balance} USDT</div>
      </div>

      {/* Dedicated Number (Subscription) */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg">Dedicated Number</h2>
        <DedicatedSection />
      </div>

      {/* My Profile */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg">My Profile</h2>

        {!profile ? (
          <div className="text-gray-500 mt-2">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="text-sm text-gray-500">Username</label>
              <div className="mt-1 p-2 border rounded bg-gray-50">{profile.username}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <div className="mt-1 p-2 border rounded bg-gray-50">{profile.contactPhone || '—'}</div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-500">Email</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="email"
                  className="border p-2 rounded w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <button
                  onClick={saveEmail}
                  disabled={savingEmail}
                  className={`px-3 py-2 text-white rounded ${savingEmail ? 'bg-gray-400' : 'bg-gray-900'}`}
                >
                  {savingEmail ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account */}
      {account && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold text-lg">Account</h2>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Username:</span> <b>{account.username}</b></div>
            <div><span className="text-gray-500">Company:</span> <b>{account.companyName || '-'}</b></div>
            <div><span className="text-gray-500">Phone:</span> <b>{account.contactPhone || '-'}</b></div>
            <div><span className="text-gray-500">Email:</span> <b>{account.contactEmail || '-'}</b></div>
            <div><span className="text-gray-500">Level:</span> <b>Level {account.level}</b></div>
            <div><span className="text-gray-500">Lifetime Sent:</span> <b>{account.totalSent}</b></div>
            <div><span className="text-gray-500">Current Price / Msg:</span> <b>${Number(account.pricePerMessage || 0).toFixed(4)}</b></div>
            <div><span className="text-gray-500">Status:</span> <b>{account.status}</b></div>
          </div>
        </div>
      )}

      {/* Service Token */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg">Service Token</h2>
        <code className="block p-2 bg-gray-100 break-all">
          {showToken ? token : '•'.repeat(20)}
        </code>
        <div className="flex gap-2 mt-2">
          <button onClick={() => setShowToken(!showToken)} className="px-3 py-1 border rounded">
            {showToken ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* OTP Template */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg">OTP Message Template</h2>
        <p className="text-sm text-gray-500 mb-2">
          Use <code>{'{OTP}'}</code> where you want the code to appear.
        </p>
        <input
          type="text"
          value={otpTemplate}
          onChange={(e) => setOtpTemplate(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={saveTemplate} className="mt-3 px-3 py-1 bg-blue-600 text-white rounded">
          Save Template
        </button>
      </div>

      {/* Top-Up Wallet */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg">Top-Up Wallet</h2>

        {deposit ? (
          <>
            <p className="text-sm">Network: <b>{deposit.network}</b></p>
            <div className="flex items-center gap-2 mt-2">
              <code className="block p-2 bg-gray-100 break-all rounded">
                {deposit.address}
              </code>
              <button
                className="px-2 py-1 border rounded text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(deposit.address);
                  alert('Address copied');
                }}
              >
                Copy
              </button>
            </div>

            {deposit.qrUrl && (
              <img
                src={`http://localhost:4000${deposit.qrUrl}`}
                alt="USDT QR"
                className="mt-3 w-40 border rounded"
              />
            )}

            {deposit.guideUrl && (
              <div className="mt-3">
                <a
                  href={`http://localhost:4000${deposit.guideUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  Download Deposit Guide (PDF)
                </a>
              </div>
            )}

            {typeof deposit.minAmount === 'number' && (
              <p className="text-sm mt-2">
                Minimum top-up: <b>{deposit.minAmount}</b> USDT
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500">Deposit details are not configured yet.</p>
        )}

        <form onSubmit={submitTopup} className="mt-4 space-y-3">
          <input
            type="number"
            name="amount"
            placeholder={`Amount in USDT (min ${minTopup})`}
            min={minTopup}
            step="0.01"
            className="border p-2 rounded w-full"
            required
          />
          <input type="text" name="txHash" placeholder="Transaction Hash (optional)" className="border p-2 rounded w-full" />
          <input type="file" name="proof" accept="image/*" className="border p-2 rounded w-full" required />
          <button className="px-3 py-1 bg-green-600 text-white rounded">Submit Top-Up</button>
        </form>
        <div className="text-xs text-gray-500 mt-2">Minimum top-up is {minTopup} USDT.</div>
      </div>

      {/* Wallet Transactions */}
      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Wallet Transactions</h2>
          <div className="flex gap-2">
            {['ALL','PENDING','APPROVED','REJECTED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded border text-sm ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {txLoading ? (
          <div className="text-gray-500">Loading…</div>
        ) : txError ? (
          <div className="text-red-600 text-sm">{txError}</div>
        ) : txs.length === 0 ? (
          <div className="text-gray-500">No transactions.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Proof</th>
                  <th className="text-left px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx._id} className="border-t">
                    <td className="px-4 py-3">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{tx.type}</td>
                    <td className="px-4 py-3">{tx.amount} USDT</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        tx.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {tx.proofPath ? (
                        <a
                          className="text-blue-600 underline"
                          href={`http://localhost:4000${String(tx.proofPath).replace(/^.*uploads/, '/uploads')}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{tx.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage This Week */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg">This Week’s Usage & Amount Due</h2>
        {due ? (
          <div className="mt-2 text-sm">
            <div>Messages: <b>{due.messageCount}</b></div>
            <div>Amount: <b>${due.amount}</b></div>
            <div className="text-gray-500">
              Period: {new Date(due.weekStart).toLocaleDateString()} → {new Date(due.weekEnd).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 mt-2">No data.</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Dedicated Number UI (User) ---------- */
function DedicatedSection(){
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const headers = { Authorization: `Bearer ${localStorage.getItem('api_token')}` };

  async function load(){
    setLoading(true);
    try{
      const { data } = await api.get('/api/dedicated/my', { headers });
      setData(data);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load().catch(console.error); },[]); // eslint-disable-line

  async function submitOrder(e){
    e.preventDefault();
    await api.post('/api/dedicated/order', { companyName, companyDescription }, { headers });
    if (logoFile) {
      const fd = new FormData();
      fd.append('logo', logoFile);
      await api.post('/api/dedicated/order/logo', fd, { headers });
    }
    alert('Order submitted. Admin will assign a number shortly.');
    setCompanyName(''); setCompanyDescription(''); setLogoFile(null);
    load();
  }

  async function renew(){
    if (!confirm('Renew your dedicated number for $20 (30 days)?')) return;
    try {
      const { data } = await api.post('/api/dedicated/renew', {}, { headers });
      alert('Renewed successfully. New expiry: ' + new Date(data.subscription.activeUntil).toLocaleString());
      load();
    } catch (e) {
      const code = e?.response?.data?.error;
      if (code === 'insufficient_balance_for_renew') {
        alert('Not enough wallet balance. Please top up.');
      } else if (code === 'not_assigned_yet') {
        alert('Your number hasn’t been assigned yet. Please wait for admin to assign the client.');
      } else {
        alert('Failed to renew.');
      }
    }
  }

  if (loading) return <div>Loading…</div>;

  const sub = data?.subscription;
  const order = data?.order;
  const active = !!sub?.active;
  const hasAssignment = !!(order?.assignedClientId || sub?.clientId);

  return (
    <div className="space-y-3">
      {active ? (
        <div className="p-3 border rounded bg-green-50">
          <div><b>Status:</b> Active</div>
          <div><b>Sender:</b> {sub?.senderPhone || '—'}</div>
          <div><b>Expires:</b> {sub?.activeUntil ? new Date(sub.activeUntil).toLocaleDateString() : '—'}</div>
        </div>
      ) : (
        <div className="p-3 border rounded bg-yellow-50">
          <div><b>Status:</b> Not active</div>
          {order ? <div>Latest order status: {order.status}</div> : <div>No order found.</div>}
        </div>
      )}

      {/* Renew button if user has any assignment (ASSIGNED/ACTIVE/EXPIRED) */}
      {hasAssignment && (
        <button onClick={renew} className="px-3 py-1 bg-indigo-600 text-white rounded">
          Renew ($20 / 30 days)
        </button>
      )}

      {/* Show order form only if there's no order or order flow is cancelled/expired AND no assignment */}
      {(!order || order.status === 'CANCELLED') && !hasAssignment && (
        <form onSubmit={submitOrder} className="space-y-2">
          <div className="text-sm text-gray-600">Buy your dedicated sender for <b>$20 / month</b>.</div>
          <input className="border p-2 rounded w-full" placeholder="Company Name" value={companyName} onChange={e=>setCompanyName(e.target.value)} required />
          <textarea className="border p-2 rounded w-full" placeholder="Company Description" value={companyDescription} onChange={e=>setCompanyDescription(e.target.value)} />
          <input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files?.[0] || null)} />
          <button className="px-3 py-1 bg-gray-900 text-white rounded">Submit Order</button>
        </form>
      )}

      <button onClick={load} className="px-2 py-1 border rounded text-sm">Refresh</button>
    </div>
  );
}

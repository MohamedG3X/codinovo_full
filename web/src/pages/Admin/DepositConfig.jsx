// web/src/pages/admin/DepositConfigAdmin.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Save, Image as ImageIcon, FileText, RefreshCw
} from 'lucide-react';

export default function DepositConfigAdmin(){
  const token = localStorage.getItem('admin_token');
  const [form, setForm] = useState({ address: '', network: 'BNB Chain', minAmount: 1 });
  const [qrFile, setQrFile] = useState(null);
  const [guideFile, setGuideFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [guideName, setGuideName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (!token) return;
    setErr(''); setOk('');
    api.get('/admin/deposit', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (data) setForm({
          address: data.address || '',
          network: data.network || 'BNB Chain',
          minAmount: Number(data.minAmount || 1)
        });
      })
      .catch(e => setErr(e?.response?.data?.error || 'Failed to load config'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!qrFile) { setQrPreview(''); return; }
    const url = URL.createObjectURL(qrFile);
    setQrPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [qrFile]);

  const on = (k) => (e) => setForm(f => ({ ...f, [k]: k === 'minAmount' ? Number(e.target.value) : e.target.value }));

  async function save(e){
    e.preventDefault();
    if (!form.address.trim()) { setErr('Deposit address is required'); return; }
    setErr(''); setOk(''); setSaving(true);
    try{
      const fd = new FormData();
      fd.append('address', form.address.trim());
      fd.append('network', form.network.trim() || 'BNB Chain');
      fd.append('minAmount', String(form.minAmount ?? 0));
      if (qrFile) fd.append('qr', qrFile);
      if (guideFile) fd.append('guide', guideFile);

      await api.post('/admin/deposit', fd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOk('Saved successfully');
    }catch(e){
      setErr(e?.response?.data?.error || 'Failed to save');
    }finally{
      setSaving(false);
    }
  }

  if (!token) {
    return <div className="min-h-[50vh] grid place-items-center p-6 text-gray-700">Admin login required</div>;
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center p-6 text-gray-700">
        <div className="inline-flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
        </div>
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
            <Link to="/app" className="text-gray-600 hover:text-blue-600 transition-colors">Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* content */}
      <main className="relative z-10 px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-lg p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Deposit Settings</h1>
              <p className="text-sm text-gray-600">Configure the crypto deposit details your users will see.</p>
            </div>

            {(err || ok) && (
              <div className="mb-4">
                {err && <div className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-xl p-3">{err}</div>}
                {ok && <div className="mt-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-xl p-3">{ok}</div>}
              </div>
            )}

            <form onSubmit={save} className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-gray-700">Network</span>
                  <input
                    className="mt-1 border border-gray-200 rounded-xl w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.network}
                    onChange={on('network')}
                    placeholder="BNB Chain"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-gray-700">Deposit Address</span>
                  <input
                    className="mt-1 border border-gray-200 rounded-xl w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.address}
                    onChange={on('address')}
                    placeholder="bnb1..."
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-gray-700">Minimum Amount</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="mt-1 border border-gray-200 rounded-xl w-40 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.minAmount}
                    onChange={on('minAmount')}
                  />
                </label>
              </div>

              {/* uploads */}
              <div className="space-y-4">
                <div>
                  <span className="block text-sm text-gray-700 mb-1">QR Image (optional)</span>
                  <label className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2 bg-white hover:bg-gray-50 cursor-pointer">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{qrFile ? qrFile.name : 'Choose image…'}</span>
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={(e)=> setQrFile(e.target.files?.[0] || null)}
                    />
                    {qrFile && (
                      <button
                        type="button"
                        className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                        onClick={()=> setQrFile(null)}
                      >
                        Remove
                      </button>
                    )}
                  </label>
                  {qrPreview && (
                    <div className="mt-2">
                      <img src={qrPreview} alt="QR Preview" className="h-28 rounded-lg border border-gray-200" />
                    </div>
                  )}
                </div>

                <div>
                  <span className="block text-sm text-gray-700 mb-1">PDF Guide (optional)</span>
                  <label className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2 bg-white hover:bg-gray-50 cursor-pointer">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{guideFile ? guideFile.name : (guideName || 'Choose PDF…')}</span>
                    <input
                      type="file" accept="application/pdf" className="hidden"
                      onChange={(e)=> {
                        const f = e.target.files?.[0] || null;
                        setGuideFile(f);
                        setGuideName(f?.name || '');
                      }}
                    />
                    {guideFile && (
                      <button
                        type="button"
                        className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                        onClick={()=> { setGuideFile(null); setGuideName(''); }}
                      >
                        Remove
                      </button>
                    )}
                  </label>
                </div>
              </div>

              {/* actions */}
              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                  disabled={saving}
                  title="Reload current values"
                >
                  <RefreshCw className={`w-4 h-4 ${saving ? 'opacity-50' : ''}`} /> Reload
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white ${saving ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} transition`}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
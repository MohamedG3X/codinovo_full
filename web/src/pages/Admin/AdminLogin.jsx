import { useState } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import React from 'react';


export default function AdminLogin(){
  const [email, setE] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const onSubmit = async e => {
    e.preventDefault(); setErr('');
    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      localStorage.setItem('admin_token', data.token);
      nav('/admin');
    } catch(e){ setErr(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border p-2" placeholder="Email" value={email} onChange={e=>setE(e.target.value)} />
        <input className="w-full border p-2" type="password" placeholder="Password" value={password} onChange={e=>setP(e.target.value)} />
        {err && <div className="text-red-600">{err}</div>}
        <button className="bg-black text-white px-4 py-2 rounded">Login</button>
      </form>
    </div>
  );
}

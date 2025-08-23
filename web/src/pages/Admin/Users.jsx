// web/src/pages/Admin/Users.jsx
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import React from 'react';

export default function Users(){
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username:'', password:'', companyName:'', pricePerMessage:0.05 });

  useEffect(()=>{ load(); },[]);
  async function load(){
    const token = localStorage.getItem('admin_token');
    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get('/admin/users', { headers });
    setUsers(data);
  }

  async function create(){
    const token = localStorage.getItem('admin_token');
    const headers = { Authorization: `Bearer ${token}` };
    const payload = { username: form.username, password: form.password, companyName: form.companyName };
    await api.post('/admin/users', payload, { headers }); // ✅ fixed
    setForm({ username:'', password:'', companyName:'', pricePerMessage:0.05 });
    load();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Users</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Create</h2>
          <div className="space-y-2">
            <input className="w-full border p-2" placeholder="Username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} />
            <input className="w-full border p-2" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
            <input className="w-full border p-2" placeholder="Company Name" value={form.companyName} onChange={e=>setForm({...form, companyName:e.target.value})} />
            <button className="bg-black text-white px-4 py-2" onClick={create}>Create</button>
          </div>
        </div>
        <div>
          <table className="min-w-full bg-white">
            <thead><tr className="border-b"><th className="p-2 text-left">Username</th><th className="p-2 text-left">Company</th><th className="p-2 text-left">Price</th><th className="p-2 text-left">Active</th></tr></thead>
            <tbody>
              {users.map(u=> (
                <tr key={u._id} className="border-b">
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.companyName}</td>
                  <td className="p-2">${Number(u.pricePerMessage ?? 0).toFixed(3)}</td>
                  <td className="p-2">{u.isActive?'Yes':'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

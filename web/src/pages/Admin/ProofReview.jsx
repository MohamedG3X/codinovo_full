import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import React from 'react';


export default function ProofReview(){
  const [invoices, setInvoices] = useState([]);
  useEffect(()=>{
    (async()=>{
      const headers = { Authorization: `Bearer ${localStorage.getItem('admin_token')}` };
      const { data } = await api.get('/admin/invoices', { headers });
      setInvoices(data.filter(i => i.status === 'PAID' && i.bankTransferProofPath));
    })();
  },[]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Paid Proofs</h1>
      <ul className="space-y-2">
        {invoices.map(i => (
          <li key={i._id} className="border p-3 rounded">
            <div>User: {i.apiUser?.username}</div>
            <div>Period: {new Date(i.periodStart).toLocaleDateString()} – {new Date(i.periodEnd).toLocaleDateString()}</div>
            <a className="underline" href={`${api.defaults.baseURL}/${i.bankTransferProofPath}`} target="_blank">Open Proof</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api"; // ✅ correct path

export default function WalletTopups() {
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) return;
    api.get("/admin/wallet/topups", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setTopups(res.data);
      })
      .catch(err => {
        console.error("Error loading topups", err);
      })
      .finally(() => setLoading(false));
  }, [token]);




  const approveTopup = async (id) => {
    await api.post(`/admin/wallet/topups/${id}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTopups(t => t.filter(x => x._id !== id));
  };

  const rejectTopup = async (id) => {
    await api.post(`/admin/wallet/topups/${id}/reject`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTopups(t => t.filter(x => x._id !== id));
  };

  if (!token) {
    return <div className="p-6">Please log in as admin to view top-ups.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Pending Wallet Top-ups</h1>
      {topups.length === 0 ? (
        <div>No pending top-ups</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">User</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Proof</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topups.map(t => (
              <tr key={t._id}>
                <td className="p-2 border">{t.apiUser?.username}</td>
                <td className="p-2 border">${t.amount}</td>
                <td className="p-2 border">
                  {t.proofPath ? (
                    <a
                      href={`http://localhost:4000${t.proofPath.replace(/^.*uploads/, "/uploads")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 underline"
                    >
                      View Proof
                    </a>
                  ) : "No proof"}
                </td>
                <td className="p-2 border flex gap-2">
                  <button
                    onClick={() => approveTopup(t._id)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectTopup(t._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
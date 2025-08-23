import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

function classNames(...a) { return a.filter(Boolean).join(" "); }

function deriveSource(t) {
  const desc = String(t.description || "");
  if (/kashier/i.test(desc) || /^WALLET-/.test(String(t.txHash || ""))) return "KASHIER";
  return "USDT";
}

// Try to parse "• 1234.56 EGP •" pattern from description
function parseEgpFromDescription(description) {
  const m = String(description || "").match(/•\s*([\d.]+)\s*([A-Z]{3})\s*•/);
  if (!m) return null;
  return { egpAmount: Number(m[1]), currency: m[2] };
}

function toUploadsUrl(p) {
  if (!p) return null;
  // maps absolute disk path ".../uploads/xxxx" to "/uploads/xxxx"
  const idx = p.indexOf("uploads");
  const u = idx >= 0 ? `/uploads/${p.slice(idx + "uploads/".length)}` : p;
  // Use your backend base for viewing files (adjust for prod)
  return `http://localhost:4000${u.startsWith("/uploads") ? u : `/uploads/${u}`}`;
}

function fmtDate(dt) {
  try {
    const d = new Date(dt);
    return `${d.toLocaleString()} (${timeAgo(d)})`;
  } catch {
    return String(dt || "");
  }
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function WalletTopups() {
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get("/admin/wallet/topups", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setTopups(res.data || []))
      .catch(err => console.error("Error loading topups", err))
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

  const rows = useMemo(() => {
    return (topups || []).map(t => {
      const source = deriveSource(t);
      const k = parseEgpFromDescription(t.description);
      const proofUrl = toUploadsUrl(t.proofPath);
      return { ...t, source, k, proofUrl };
    });
  }, [topups]);

  if (!token) {
    return <div className="p-6">Please log in as admin to view top-ups.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Pending Wallet Top-ups</h1>

      {rows.length === 0 ? (
        <div className="text-gray-600">No pending top-ups</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3 border">User</th>
                  <th className="p-3 border">Source</th>
                  <th className="p-3 border">Amount (USDT)</th>
                  <th className="p-3 border">Kashier (EGP)</th>
                  <th className="p-3 border">Order / Tx Ref</th>
                  <th className="p-3 border">Proof</th>
                  <th className="p-3 border">Created</th>
                  <th className="p-3 border">Description</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(t => (
                  <tr key={t._id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-3 border align-top">
                      <div className="font-medium">{t.apiUser?.username || "—"}</div>
                      {t.apiUser?.companyName && (
                        <div className="text-gray-500">{t.apiUser.companyName}</div>
                      )}
                    </td>

                    <td className="p-3 border align-top">
                      <span
                        className={classNames(
                          "px-2 py-1 rounded text-xs font-semibold",
                          t.source === "KASHIER"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {t.source === "KASHIER" ? "Kashier" : "USDT (Manual)"}
                      </span>
                    </td>

                    <td className="p-3 border align-top">
                      ${Number(t.amount || 0).toFixed(2)}
                    </td>

                    <td className="p-3 border align-top">
                      {t.source === "KASHIER" && t.k ? (
                        <div className="whitespace-nowrap">{t.k.egpAmount.toFixed(2)} {t.k.currency}</div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="p-3 border align-top">
                      {t.txHash ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{t.txHash}</code>
                          <button
                            onClick={() => navigator.clipboard.writeText(t.txHash)}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Copy
                          </button>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>

                    <td className="p-3 border align-top">
                      {t.proofUrl ? (
                        <a
                          href={t.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          View Proof
                        </a>
                      ) : (
                        t.source === "KASHIER" ? <span className="text-gray-400">N/A (Kashier)</span> : "No proof"
                      )}
                    </td>

                    <td className="p-3 border align-top">
                      {fmtDate(t.createdAt)}
                    </td>

                    <td className="p-3 border align-top max-w-[280px]">
                      <div className="text-gray-700 line-clamp-3" title={t.description || ""}>
                        {t.description || "—"}
                      </div>
                    </td>

                    <td className="p-3 border align-top">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => approveTopup(t._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectTopup(t._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {rows.map(t => (
              <div key={t._id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{t.apiUser?.username || "—"}</div>
                    {t.apiUser?.companyName && (
                      <div className="text-xs text-gray-500">{t.apiUser.companyName}</div>
                    )}
                  </div>
                  <span
                    className={classNames(
                      "px-2 py-1 rounded text-xs font-semibold",
                      t.source === "KASHIER"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {t.source === "KASHIER" ? "Kashier" : "USDT"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Amount (USDT)</div>
                    <div className="font-medium">${Number(t.amount || 0).toFixed(2)}</div>
                  </div>

                  <div>
                    <div className="text-gray-500">Kashier (EGP)</div>
                    <div className="font-medium">
                      {t.source === "KASHIER" && t.k
                        ? `${t.k.egpAmount.toFixed(2)} ${t.k.currency}`
                        : "—"}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-gray-500">Order / Tx</div>
                    {t.txHash ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">{t.txHash}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(t.txHash)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Copy
                        </button>
                      </div>
                    ) : <div className="text-gray-400">—</div>}
                  </div>

                  <div className="col-span-2">
                    <div className="text-gray-500">Proof</div>
                    {t.proofUrl ? (
                      <a href={t.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        View Proof
                      </a>
                    ) : (
                      t.source === "KASHIER" ? <span className="text-gray-400">N/A (Kashier)</span> : "No proof"
                    )}
                  </div>

                  <div className="col-span-2">
                    <div className="text-gray-500">Created</div>
                    <div>{fmtDate(t.createdAt)}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-gray-500">Description</div>
                    <div className="text-gray-700">{t.description || "—"}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => approveTopup(t._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectTopup(t._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { Link } from 'react-router-dom'

export default function AdminDashboard(){
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [rows, setRows] = useState([])

  // tiers UI state
  const [tiers, setTiers] = useState(null)
  const [savingTiers, setSavingTiers] = useState(false)

  // modal state for user details
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState(null)

  // --- NEW: Sessions Health state ---
  const [sweepLoading, setSweepLoading] = useState(false)
  const [sweep, setSweep] = useState(null)
  const [activeTab, setActiveTab] = useState('suggested') // 'suggested' | 'review' | 'necessary' | 'dangling'
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteResult, setDeleteResult] = useState(null)

  const token = localStorage.getItem('admin_token')
  const headers = { Authorization: `Bearer ${token}` }

  async function load(){
    setLoading(true)
    try {
      const [{ data: ov }, { data: list }, { data: tierCfg }] = await Promise.all([
        api.get('/admin/stats/overview', { headers }),
        api.get('/admin/stats/users', { headers }),
        api.get('/admin/tiers', { headers }),
      ])
      setOverview(ov)
      setRows(list || [])
      setTiers(tierCfg || null)
    } finally {
      setLoading(false)
    }
  }

  // Pause/Resume (toggle isActive)
  async function toggleActive(id, current){
    await api.patch(`/admin/users/${id}`, { isActive: !current }, { headers })
    setRows(prev => prev.map(r => r.id === id ? { ...r, isActive: !current, status: !current ? 'ACTIVE' : 'PAUSED' } : r))
  }

  // Approve (backend assigns price from level)
  async function approve(id){
    await api.post(`/admin/users/${id}/approve`, {}, { headers })
    const { data } = await api.get(`/admin/users/${id}`, { headers })
    setRows(prev => prev.map(r => r.id === id
      ? {
          ...r,
          status: data?.user?.status ?? 'ACTIVE',
          isActive: !!data?.user?.isActive,
          pricePerMessage: data?.user?.pricePerMessage ?? r.pricePerMessage,
          level: data?.user?.level ?? r.level
        }
      : r
    ))
  }

  // Reject
  async function reject(id){
    if (!confirm('Reject this user?')) return
    await api.post(`/admin/users/${id}/reject`, {}, { headers })
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'PAUSED', isActive: false } : r))
  }

  // View details
  async function view(id){
    const { data } = await api.get(`/admin/users/${id}`, { headers })
    setDetail(data)
    setDetailOpen(true)
  }

  // Save tiers
  async function saveTiers(){
    if (!tiers) return
    setSavingTiers(true)
    try {
      const payload = {
        level1Price: Number(tiers.level1Price),
        level2Price: Number(tiers.level2Price),
        level3Price: Number(tiers.level3Price),
      }
      await api.patch('/admin/tiers', payload, { headers })
      setRows(prev => prev.map(r => ({
        ...r,
        pricePerMessage:
          (r.level === 3 ? Number(payload.level3Price) :
           r.level === 2 ? Number(payload.level2Price) :
                           Number(payload.level1Price))
      })))
      alert('Tier prices saved')
    } catch (e) {
      console.error(e)
      alert('Failed to save tiers')
    } finally {
      setSavingTiers(false)
    }
  }

  // --- NEW: Sessions Health logic ---
  async function runSweep(){
    setSweepLoading(true)
    try {
      const { data } = await api.get('/admin/sessions/sweep', { headers })
      setSweep(data)
      setSelectedIds(new Set())
      // Default to suggested tab if any, else review/necessary
      if (data?.suggestedDeletes?.length) setActiveTab('suggested')
      else if (data?.reviewIds?.length) setActiveTab('review')
      else setActiveTab('necessary')
    } catch (e) {
      console.error(e)
      alert('Failed to scan sessions')
    } finally {
      setSweepLoading(false)
    }
  }

  function toggleSelect(id){
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll(list, checked){
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) {
        list.forEach(item => next.add(item.clientId))
      } else {
        list.forEach(item => next.delete(item.clientId))
      }
      return next
    })
  }

  async function deleteSelected(){
    if (!selectedIds.size) return alert('Select at least one session')
    setConfirmOpen(false)
    setDeleting(true)
    try {
      const ids = Array.from(selectedIds)
      const { data } = await api.post('/admin/sessions/delete-many', { ids }, { headers })
      setDeleteResult(data)
      // refresh sweep to reflect updates
      await runSweep()
      setSelectedIds(new Set())
    } catch (e) {
      console.error(e)
      alert('Failed to delete sessions')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => { load().catch(console.error) }, [])

// derive current list WITHOUT useMemo to avoid hook-order issues
const currentList = !sweep ? []
  : activeTab === 'suggested' ? (sweep.suggestedDeletes || [])
  : activeTab === 'review' ? (sweep.reviewIds || [])
  : activeTab === 'necessary' ? (sweep.necessaryIds || [])
  : (sweep.danglingIds || [])

// only now do the early return
if (loading || !overview) return <div className="p-6">Loading…</div>

const { month, today, users } = overview
const pending = rows.filter(r => r.status === 'PENDING')

  const allSelectedInTab = currentList.length > 0 && currentList.every(i => selectedIds.has(i.clientId))

  return (
    <div className="p-6 space-y-6">
      {/* Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card title="Messages (Today)" value={today.messages} />
        <Card title={`Messages (${month.year}-${String(month.month).padStart(2,'0')})`} value={month.messages} />
        <Card title="Active Users" value={`${users.active}/${users.total}`} />
        <Card title="Revenue (Month)" value={`$${month.revenue.toFixed(2)}`} />
        <Card title="Pending Accounts" value={pending.length} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/users" className="px-3 py-2 bg-gray-900 text-white rounded">Manage Users</Link>
        <Link to="/admin/invoices" className="px-3 py-2 bg-gray-900 text-white rounded">Invoices</Link>
        <Link to="/admin/wallet-topups" className="px-3 py-2 bg-gray-900 text-white rounded">Wallet Top-ups</Link>
        <Link to="/admin/dedicated" className="px-3 py-2 bg-gray-900 text-white rounded">Dedicated Numbers</Link>
      </div>

      {/* Pricing Tiers (Admin can edit L1/L2/L3 prices) */}
      {tiers && (
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Pricing Tiers</h2>
            <span className="text-xs text-gray-500">Prices applied by user level</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">Level 1 Price</label>
              <input
                type="number" step="0.001" min="0"
                value={tiers.level1Price ?? 0}
                onChange={e => setTiers(t => ({ ...t, level1Price: e.target.value }))}
                className="border rounded p-2 w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Level 2 Price</label>
              <input
                type="number" step="0.001" min="0"
                value={tiers.level2Price ?? 0}
                onChange={e => setTiers(t => ({ ...t, level2Price: e.target.value }))}
                className="border rounded p-2 w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Level 3 Price</label>
              <input
                type="number" step="0.001" min="0"
                value={tiers.level3Price ?? 0}
                onChange={e => setTiers(t => ({ ...t, level3Price: e.target.value }))}
                className="border rounded p-2 w-full"
              />
            </div>
          </div>
          <div className="mt-3 text-right">
            <button
              onClick={saveTiers}
              disabled={savingTiers}
              className={`px-3 py-2 rounded text-white ${savingTiers ? 'bg-gray-400' : 'bg-gray-900'}`}
            >
              {savingTiers ? 'Saving…' : 'Save Tier Prices'}
            </button>
          </div>
        </div>
      )}

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Pending Accounts</h2>
            <span className="text-xs text-gray-500">Approve or reject new signups after OTP verification</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>User</Th>
                  <Th>Company</Th>
                  <Th>Phone</Th>
                  <Th>Position</Th>
                  <Th>Price/msg</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pending.map(r => (
                  <tr key={r.id} className="border-t">
                    <Td className="font-medium">{r.username}</Td>
                    <Td>{r.companyName || '-'}</Td>
                    <Td>{r.contactPhone || '-'}</Td>
                    <Td>{r.applicantPosition || '-'}</Td>
                    <Td>${(r.pricePerMessage ?? 0).toFixed(3)}</Td>
                    <Td className="flex flex-wrap gap-2">
                      <button onClick={() => view(r.id)} className="px-3 py-1 rounded border">View</button>
                      <button onClick={() => approve(r.id)} className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>
                      <button onClick={() => reject(r.id)} className="px-3 py-1 rounded bg-red-600 text-white">Reject</button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>User</Th>
              <Th>Company</Th>
              <Th>Phone</Th>
              <Th>Position</Th>
              <Th>Price/msg</Th>
              <Th>Level</Th>
              <Th>Messages (month)</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <Td className="font-medium">{r.username}</Td>
                <Td>{r.companyName || '-'}</Td>
                <Td>{r.contactPhone || '-'}</Td>
                <Td>{r.applicantPosition || '-'}</Td>
                <Td>${(r.pricePerMessage ?? 0).toFixed(3)}</Td>

                {/* Level column */}
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                      L{r.level || 1}
                    </span>
                    <select
                      value={r.level || 1}
                      onChange={async (e) => {
                        const lvl = Number(e.target.value);
                        try {
                          await api.patch(`/admin/users/${r.id}/level`, { level: lvl }, { headers });
                          const { data } = await api.get(`/admin/users/${r.id}`, { headers });
                          setRows(prev => prev.map(x => x.id === r.id
                            ? {
                                ...x,
                                level: lvl,
                                pricePerMessage: data?.user?.pricePerMessage ?? x.pricePerMessage
                              }
                            : x));
                        } catch (err) {
                          console.error(err);
                          alert('Failed to update level');
                        }
                      }}
                      className="border rounded p-1 text-sm"
                    >
                      <option value={1}>Level 1</option>
                      <option value={2}>Level 2</option>
                      <option value={3}>Level 3</option>
                    </select>
                  </div>
                </Td>

                <Td>{r.messagesThisMonth}</Td>
                <Td>
                  <span className={`px-2 py-1 rounded text-xs mr-2 ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {r.status || '—'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {r.isActive ? 'Enabled' : 'Paused'}
                  </span>
                </Td>
                <Td className="space-x-2">
                  <button onClick={() => view(r.id)} className="px-3 py-1 rounded border">View</button>
                  {r.status !== 'ACTIVE' ? (
                    <>
                      <button onClick={() => approve(r.id)} className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>
                      <button onClick={() => reject(r.id)} className="px-3 py-1 rounded bg-red-600 text-white">Reject</button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleActive(r.id, r.isActive)}
                      className={`px-3 py-1 rounded text-white ${r.isActive ? 'bg-red-600' : 'bg-green-600'}`}
                    >
                      {r.isActive ? 'Pause' : 'Resume'}
                    </button>
                  )}
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><Td colSpan={9} className="text-center py-8 text-gray-500">No users yet.</Td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- NEW: Sessions Health --- */}
      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-semibold">Sessions Health</h2>
            <p className="text-xs text-gray-500">Scan, review and safely delete non-essential WhatsApp sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runSweep}
              disabled={sweepLoading}
              className={`px-3 py-2 rounded text-white ${sweepLoading ? 'bg-gray-400' : 'bg-gray-900'}`}
            >
              {sweepLoading ? 'Scanning…' : 'Scan Sessions'}
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!selectedIds.size || deleting}
              className={`px-3 py-2 rounded text-white ${(!selectedIds.size || deleting) ? 'bg-gray-300' : 'bg-red-600'}`}
              title={!selectedIds.size ? 'Select sessions first' : 'Delete selected sessions'}
            >
              {deleting ? 'Deleting…' : `Delete Selected (${selectedIds.size || 0})`}
            </button>
          </div>
        </div>

        {/* Summary badges */}
        {sweep && (
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge color="gray">Found: {sweep.counts.found}</Badge>
            <Badge color="green">Necessary: {sweep.counts.necessary}</Badge>
            <Badge color="yellow">Review: {sweep.counts.review}</Badge>
            <Badge color="red">Suggested: {sweep.counts.suggestedDeletes}</Badge>
            <Badge color="purple">Dangling: {sweep.counts.dangling}</Badge>
            <span className="ml-auto text-xs text-gray-500">Stale ≥ {sweep.config.SESSION_STALE_HOURS}h</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b mb-3">
          <Tab label="Suggested" active={activeTab==='suggested'} onClick={()=>setActiveTab('suggested')} />
          <Tab label="Review" active={activeTab==='review'} onClick={()=>setActiveTab('review')} />
          <Tab label="Necessary" active={activeTab==='necessary'} onClick={()=>setActiveTab('necessary')} />
          <Tab label="Dangling" active={activeTab==='dangling'} onClick={()=>setActiveTab('dangling')} />
        </div>

        {/* Table */}
        {!sweep ? (
          <div className="text-sm text-gray-500">Click “Scan Sessions” to get the latest status.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>
                    {(activeTab === 'suggested' || activeTab === 'review') && currentList.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allSelectedInTab}
                        onChange={e => selectAll(currentList, e.target.checked)}
                      />
                    )}
                  </Th>
                  <Th>ClientId</Th>
                  <Th>Reasons</Th>
                  <Th>Ready</Th>
                  <Th>Last Error</Th>
                  <Th>Last Event</Th>
                  <Th>Last Ready</Th>
                  <Th>On Disk</Th>
                  <Th>Disk Size</Th>
                  <Th>Disk mtime</Th>
                </tr>
              </thead>
              <tbody>
                {currentList.map(item => {
                  const selectable = (activeTab === 'suggested') || (activeTab === 'review')
                  const checked = selectedIds.has(item.clientId)
                  return (
                    <tr key={item.clientId} className="border-t">
                      <Td>
                        {selectable ? (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelect(item.clientId)}
                            title={activeTab==='review' ? 'Be careful: recent activity' : 'Select to delete'}
                          />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </Td>
                      <Td className="font-mono">{item.clientId}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {(item.reasons || []).map((r,i) => <Reason key={i} text={r} />)}
                        </div>
                      </Td>
                      <Td>
                        <span className={`px-2 py-1 rounded text-xs ${item.ready ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {item.ready ? 'ready' : 'not-ready'}
                        </span>
                      </Td>
                      <Td className="max-w-[220px] truncate" title={item.lastError || ''}>{item.lastError || '—'}</Td>
                      <Td title={fmtTs(item.lastEventAt)}>{fmtAgo(item.lastEventAt)}</Td>
                      <Td title={fmtTs(item.lastReadyAt)}>{fmtAgo(item.lastReadyAt)}</Td>
                      <Td>{item.onDisk ? 'yes' : 'no'}</Td>
                      <Td>{formatBytes(item.diskSize || 0)}</Td>
                      <Td title={item.diskMtime ? new Date(item.diskMtime).toLocaleString() : ''}>
                        {item.diskMtime ? fmtAgo(item.diskMtime) : '—'}
                      </Td>
                    </tr>
                  )
                })}
                {currentList.length === 0 && (
                  <tr><Td colSpan={10} className="text-center py-8 text-gray-500">No items.</Td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {detailOpen && detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button onClick={() => setDetailOpen(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Username" value={detail.user.username} />
              <Row label="Company" value={detail.user.companyName || '—'} />
              <Row label="Phone" value={detail.user.contactPhone || '—'} />
              <Row label="Position" value={detail.user.applicantPosition || '—'} />
              <Row label="Email" value={detail.user.contactEmail || '—'} />
              <Row label="Status" value={`${detail.user.status} (${detail.user.isActive ? 'Enabled' : 'Paused'})`} />
              <Row label="Price/msg" value={`$${(detail.user.pricePerMessage ?? 0).toFixed(3)}`} />
              <Row label="Wallet" value={`${detail.user.walletBalance ?? 0}`} />
              <Row label="Level" value={`L${detail.user.level || 1}`} />
              <Row label="Lifetime Sent" value={detail.user.totalSent ?? 0} />
              <Row label="Messages this month" value={detail.stats.messagesThisMonth} />
              <Row label="Created" value={new Date(detail.user.createdAt).toLocaleString()} />
              <Row label="Updated" value={new Date(detail.user.updatedAt).toLocaleString()} />
            </div>
            <div className="mt-5 text-right">
              <button onClick={() => setDetailOpen(false)} className="px-3 py-1 rounded border">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5">
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Delete Selected Sessions</h3>
              <p className="text-sm text-gray-600 mt-1">
                This will stop in-memory clients, delete LocalAuth folders, and clean DB references (GlobalSender, non-essential orders, expired users).
              </p>
            </div>
            <div className="bg-gray-50 rounded p-3 mb-4 max-h-48 overflow-auto">
              {Array.from(selectedIds).map(id => (
                <div key={id} className="font-mono text-xs">{id}</div>
              ))}
              {!selectedIds.size && <div className="text-sm text-gray-500">No sessions selected</div>}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={()=>setConfirmOpen(false)} className="px-3 py-2 rounded border">Cancel</button>
              <button
                onClick={deleteSelected}
                disabled={!selectedIds.size || deleting}
                className={`px-3 py-2 rounded text-white ${(!selectedIds.size || deleting) ? 'bg-gray-300' : 'bg-red-600'}`}
              >
                {deleting ? 'Deleting…' : `Delete (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Result Modal */}
      {deleteResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Cleanup Summary</h3>
              <button onClick={()=>setDeleteResult(null)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge color="green">Deleted OK: {deleteResult?.summary?.deletedOk || 0}</Badge>
                <Badge color="gray">Skipped: {deleteResult?.summary?.skipped || 0}</Badge>
                <Badge color="purple">GS deleted: {deleteResult?.summary?.dbTotals?.globalSenderDeleted || 0}</Badge>
                <Badge color="yellow">Orders unassigned: {deleteResult?.summary?.dbTotals?.ordersUnassigned || 0}</Badge>
                <Badge color="blue">Users cleared: {deleteResult?.summary?.dbTotals?.usersCleared || 0}</Badge>
              </div>

              <div className="overflow-x-auto max-h-80 border rounded">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <Th>ClientId</Th>
                      <Th>Status</Th>
                      <Th>Reason/Err</Th>
                      <Th>Mem</Th>
                      <Th>Disk</Th>
                      <Th>GS</Th>
                      <Th>Orders</Th>
                      <Th>Users</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(deleteResult?.results || []).map(r => (
                      <tr key={r.clientId} className="border-t">
                        <Td className="font-mono">{r.clientId}</Td>
                        <Td>
                          {r.ok ? <Badge color="green">ok</Badge> : r.skipped ? <Badge color="yellow">skipped</Badge> : <Badge color="red">error</Badge>}
                        </Td>
                        <Td className="max-w-[240px] truncate" title={r.reason || ''}>{r.reason || '—'}</Td>
                        <Td>{r.changes?.memoryStopped ? 'stopped' : '—'}</Td>
                        <Td>{r.changes?.diskRemoved ? 'removed' : '—'}</Td>
                        <Td>{r.changes?.db?.globalSenderDeleted ? '1' : '0'}</Td>
                        <Td>{r.changes?.db?.ordersUnassigned ?? 0}</Td>
                        <Td>{r.changes?.db?.usersCleared ?? 0}</Td>
                      </tr>
                    ))}
                    {(!deleteResult?.results || !deleteResult.results.length) && (
                      <tr><Td colSpan={8} className="text-center py-8 text-gray-500">No results.</Td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 text-right">
              <button onClick={()=>setDeleteResult(null)} className="px-3 py-2 rounded border">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ====== UI helpers ====== */

function Card({ title, value }){
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}
function Th({ children }){ return <th className="text-left px-4 py-3 whitespace-nowrap">{children}</th> }
function Td({ children, className='', ...rest }){ return <td className={`px-4 py-3 whitespace-nowrap ${className}`} {...rest}>{children}</td> }
function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium">{String(value)}</div>
    </div>
  );
}

function Badge({ children, color='gray' }){
  const map = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
  }
  return <span className={`text-xs px-2 py-1 rounded ${map[color] || map.gray}`}>{children}</span>
}
function Tab({ label, active, onClick }){
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm border-b-2 ${active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
    >
      {label}
    </button>
  )
}
function Reason({ text }){
  const color =
    text === 'DEFAULT' ? 'gray' :
    text === 'GLOBAL_ENABLED' ? 'blue' :
    text === 'ORDER_ACTIVE' ? 'green' :
    text === 'ORDER_ASSIGNED' ? 'indigo' :
    text === 'USER_ACTIVE' ? 'teal' :
    text === 'ZOMBIE' ? 'red' :
    text === 'ERROR_STUCK' ? 'orange' :
    text === 'STALE' ? 'yellow' :
    text === 'RECENT_ACTIVITY' ? 'purple' :
    'gray'
  const cls = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    teal: 'bg-teal-100 text-teal-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
  }[color]
  return <span className={`text-[10px] px-2 py-0.5 rounded ${cls}`}>{text}</span>
}

/* ====== formatters ====== */
function formatBytes(n=0){
  if (!n) return '0 B'
  const k = 1024
  const units = ['B','KB','MB','GB','TB']
  const i = Math.floor(Math.log(n)/Math.log(k))
  return `${(n/Math.pow(k,i)).toFixed(i ? 1 : 0)} ${units[i]}`
}
function fmtTs(ts){
  if (!ts) return ''
  try { return new Date(ts).toLocaleString() } catch { return '' }
}
function fmtAgo(ts){
  if (!ts) return '—'
  const d = Date.now() - Number(ts)
  if (d < 0) return 'just now'
  const s = Math.floor(d/1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s/60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h/24)
  return `${days}d ago`
}
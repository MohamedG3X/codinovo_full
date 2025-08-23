// server/src/jobs/walletMaintenance.js
import WalletTransaction from '../models/WalletTransaction.js';

export function startWalletMaintenanceJob() {
  const ONE_HOUR = 60 * 60 * 1000;
  const EXPIRE_AGE_MS = 24 * ONE_HOUR; // expire PENDING older than 24h

  async function runOnce() {
    try {
      const cutoff = new Date(Date.now() - EXPIRE_AGE_MS);
      const res = await WalletTransaction.updateMany(
        { status: 'PENDING', createdAt: { $lt: cutoff } },
        { $set: { status: 'REJECTED' } }
      );
      if (res?.modifiedCount) {
        console.log('[walletMaintenance] expired PENDING -> REJECTED:', res.modifiedCount);
      }
    } catch (e) {
      console.error('[walletMaintenance] error:', e);
    }
  }

  // run immediately on boot, then hourly
  runOnce().catch(() => {});
  setInterval(runOnce, ONE_HOUR);
}

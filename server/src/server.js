import 'dotenv/config';
console.log('[boot] KASHIER_API_KEY length =', (process.env.KASHIER_API_KEY || process.env.KASHIER_SECRET || '').length);
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import adminSessionsRoutes from './routes/adminSessions.routes.js';
import { startWalletMaintenanceJob } from './jobs/walletMaintenance.js';

import { config } from './config.js';
import { connectDB } from './db.js';
import { initWhatsApp, ensureClient, globalPoolAdd } from './whatsapp/client.js';
import kashierRoutes from './routes/kashier.routes.js';

import depositRoutes from './routes/deposit.routes.js';
import authRoutes from './routes/auth.routes.js';
import otpRoutes from './routes/otp.routes.js';
import logsRoutes from './routes/logs.routes.js';
import adminRoutes from './routes/admin.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import billingRoutes from './routes/billing.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import invoiceRoutes from './routes/invoices.routes.js';
import demoRoutes from './routes/demo.routes.js';
import dedicatedRoutes from './routes/dedicated.routes.js';
import debugRoutes from './routes/debug.routes.js';
import globalSendersRoutes from './routes/globalSenders.routes.js';

import ApiUser from './models/ApiUser.js';
import DedicatedOrder from './models/DedicatedOrder.js';
import GlobalSender from './models/GlobalSender.js';

import { startInvoicingJob } from './jobs/invoicing.js';
import { errorHandler } from './middleware/error.js';

process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));

const app = express();
app.set('trust proxy', true); // <-- Add this

/* static + security */
app.use('/uploads', express.static('uploads'));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(helmet());
app.use(express.json());

/* routes */
app.use('/auth', authRoutes);

// API (client) routes
app.use('/api', otpRoutes);
app.use('/api', logsRoutes);
app.use('/api', settingsRoutes);
app.use('/api', billingRoutes);
app.use('/api', walletRoutes);
app.use('/api', invoiceRoutes);
app.use('/demo', demoRoutes);
app.use('/api', kashierRoutes);       // /api/kashier/*
app.use('/webhooks', kashierRoutes);  // /webhooks/kashier
// Dedicated (user + admin)
app.use('/api/dedicated', dedicatedRoutes);   // /order, /my, /renew
app.use('/admin/dedicated', dedicatedRoutes); // /orders, /:id/assign|activate|renew|expire

// Admin routes
app.use('/admin', adminRoutes);
app.use('/admin', invoiceRoutes);
app.use('/admin/sessions', adminSessionsRoutes);

// Global senders (admin)
app.use('/admin/global-senders', globalSendersRoutes);

// (wallet also under /api above)
app.use('/', depositRoutes);

// Debug utilities
app.use('/debug', debugRoutes);

// Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));
// Error handler
app.use(errorHandler);

/* --------- Rehydrate all WA sessions on boot --------- */
async function rehydrateSessions() {
  try {
    const now = Date.now();

    // Dedicated: active users (strictly in the future)
    const activeUsers = await ApiUser.find(
      {
        dedicatedClientId: { $nin: [null, ''] },
        dedicatedActiveUntil: { $gt: new Date(now) },
      },
      { dedicatedClientId: 1 }
    ).lean();

    // Orders ASSIGNED (to allow QR without re-assign)
    const assignedOrders = await DedicatedOrder.find(
      { status: 'ASSIGNED', assignedClientId: { $nin: [null, ''] } },
      { assignedClientId: 1 }
    ).lean();

    // Enabled global senders (register into RR pool + ensure session)
    const globalSenders = await GlobalSender.find(
      { enabled: true },
      { clientId: 1, weight: 1 }
    ).lean();

    // Register globals into the in-memory round-robin pool first
    for (const g of globalSenders) {
      try { globalPoolAdd(String(g.clientId), Number(g.weight || 1)); } catch {}
    }

    const ids = new Set();
    for (const u of activeUsers) ids.add(String(u.dedicatedClientId));
    for (const o of assignedOrders) ids.add(String(o.assignedClientId));
    for (const g of globalSenders) ids.add(String(g.clientId));

    if (ids.size === 0) {
      console.log('[rehydrate] no active sessions to restore');
      return;
    }

    const list = Array.from(ids);
    console.log('[rehydrate] restoring sessions:', list.join(', '));

    for (let i = 0; i < list.length; i++) {
      const id = list[i];
      try {
        // small stagger to avoid multiple Chromium boots at the same ms
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 250));
        ensureClient(id); // if LocalAuth exists, it comes back; else QR shows
      } catch (e) {
        console.error(`[rehydrate] ensureClient(${id}) failed`, e);
      }
    }
  } catch (e) {
    console.error('[rehydrate] failed:', e);
  }
}

/* boot */
(async () => {
  await connectDB();
  await initWhatsApp();     // bring back the GLOBAL/default session
  await rehydrateSessions(); // bring back ALL enabled globals + assigned/active dedicated sessions
  startInvoicingJob();
  startWalletMaintenanceJob(); // <— add this
  app.listen(config.port, () => {
    console.log(`Server running on :${config.port}`);
  });
})();

/* (keep this legacy CORS override if you rely on it later in middleware order) */
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-service-token'],
}));
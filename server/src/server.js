// server/src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import debugRoutes from './routes/debug.routes.js';
import demoRoutes from './routes/demo.routes.js';
import { config } from './config.js';
import { connectDB } from './db.js';
import { initWhatsApp } from './whatsapp/client.js';
import depositRoutes from './routes/deposit.routes.js';

import authRoutes from './routes/auth.routes.js';
import otpRoutes from './routes/otp.routes.js';
import logsRoutes from './routes/logs.routes.js';
import adminRoutes from './routes/admin.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import billingRoutes from './routes/billing.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import invoiceRoutes from './routes/invoices.routes.js'; // ✅ single file handles both user + admin routes

import { startInvoicingJob } from './jobs/invoicing.js';
import { errorHandler } from './middleware/error.js';

const app = express();
app.use('/uploads', express.static('uploads'));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ---------- Route mounting ----------
app.use('/auth', authRoutes);     // -> /auth/login, /auth/register

// API (client) routes
app.use('/api', otpRoutes);       // -> /api/otp/...
app.use('/api', logsRoutes);      // -> /api/logs/...
app.use('/api', settingsRoutes);  // -> /api/settings/... (and related)
app.use('/api', billingRoutes);   // -> /api/billing/...
app.use('/api', walletRoutes);    // -> /api/wallet/...
app.use('/api', invoiceRoutes);   // -> /api/invoices, /api/invoices/:id/pdf
app.use('/demo', demoRoutes); // ✅ public demo endpoints

// Admin routes
app.use('/admin', adminRoutes);   // -> /admin/users, /admin/stats/...
app.use('/admin', invoiceRoutes); // -> /admin/invoices/generate
app.use('/api', walletRoutes);
app.use('/', depositRoutes);


// tiny debug route
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/debug', debugRoutes);

// error handler
app.use(errorHandler);

// ---------- Boot ----------
(async () => {
  await connectDB();
  await initWhatsApp();
  startInvoicingJob();
  app.listen(config.port, () =>
    console.log(`Server running on :${config.port}`)
  );
})();
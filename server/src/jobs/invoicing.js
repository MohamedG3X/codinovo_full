import cron from 'node-cron';
import ApiUser from '../models/ApiUser.js';
import Invoice from '../models/Invoice.js';
import OtpLog from '../models/OtpLog.js';
import { generateInvoicePdf } from '../utils/invoicePdf.js';

export function startInvoicingJob() {
  // Every day at 02:15
  cron.schedule('15 2 * * *', async () => {
    try {
      const now = new Date();
      // If today is the 1st, invoice the previous month
      if (now.getDate() !== 1) return;

      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const start = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
      const end = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1);

      const users = await ApiUser.find({});
      for (const u of users) {
        const price = u.pricePerMessage || 0;
        const messages = await OtpLog.countDocuments({
          apiUser: u._id,
          status: 'SENT',
          createdAt: { $gte: start, $lt: end }
        });
        const total = messages * price;

        const inv = await Invoice.findOneAndUpdate(
          { apiUser: u._id, periodStart: start, periodEnd: new Date(end.getTime() - 1) },
          { messageCount: messages, totalAmount: total, currency: 'USD', status: 'ISSUED' },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (!inv.pdfPath) {
          const pdf = await generateInvoicePdf(inv, u);
          inv.pdfPath = pdf;
          await inv.save();
        }
      }
      console.log('[cron] monthly invoices created');
    } catch (e) {
      console.error('[cron] invoicing error', e);
    }
  });
}
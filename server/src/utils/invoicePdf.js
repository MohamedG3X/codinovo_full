// server/src/utils/invoicePdf.js
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import OtpLog from '../models/OtpLog.js';

/**
 * Generate an invoice PDF for the given invoice+user.
 * - Uses invoice.messageCount / invoice.totalAmount primarily.
 * - Aggregates OtpLog counts for SENT/FAILED in the invoice period.
 * - Supports data where `sentAt` may be missing (falls back to createdAt).
 *
 * @param {import('../models/Invoice.js').default} invoice - Invoice doc
 * @param {import('../models/ApiUser.js').default} apiUser - Populated user doc
 * @returns {Promise<string>} pdfPath
 */
export async function generateInvoicePdf(invoice, apiUser) {
  return new Promise(async (resolve, reject) => {
    try {
      /* ------------------------------ paths ------------------------------ */
      const invoicesDir = path.join(process.cwd(), 'invoices');
      if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
      const pdfPath = path.join(invoicesDir, `invoice_${invoice._id}.pdf`);

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      /* ------------------------------ theming ---------------------------- */
      const colors = {
        primary: '#2563eb',
        text: '#0f172a',
        sub: '#475569',
        light: '#e5e7eb',
        good: '#059669'
      };

      const line = (y) => doc.moveTo(40, y).lineTo(555, y).lineWidth(1).strokeColor(colors.light).stroke();
      const field = (label, value, x, y) => {
        doc.fillColor(colors.sub).fontSize(9).font('Helvetica').text(label, x, y);
        doc.fillColor(colors.text).fontSize(11).font('Helvetica-Bold').text(String(value), x, y + 12);
      };
      const h2 = (t, y) => doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(12).text(t, 40, y);

      /* ------------------------------ data ------------------------------- */
      // Safe values
      const userCompany = apiUser?.companyName || apiUser?.username || 'N/A';
      const userEmail = apiUser?.contactEmail || 'N/A';
      const userIdShort = (apiUser?._id?.toString() || '').slice(-8) || 'N/A';

      const createdAt = invoice?.createdAt ? new Date(invoice.createdAt) : new Date();
      const periodStart = invoice?.periodStart ? new Date(invoice.periodStart) : createdAt;
      const periodEnd = invoice?.periodEnd ? new Date(invoice.periodEnd) : createdAt; // inclusive end (from your routes)

      const issueDate = createdAt.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
      const dueDate = new Date(createdAt.getTime() + 30 * 864e5).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

      const invShort = `#${invoice?._id?.toString().slice(-8).toUpperCase() || 'XXXXXX'}`;
      const status = (invoice?.status || 'ISSUED').toUpperCase();

      // Pricing/amounts (prefer actual invoice fields)
      const billedMsgs = Number(invoice?.messageCount ?? 0);
      const billedTotal = Number(invoice?.totalAmount ?? 0);
      // If invoice has 0/0 (shouldn't happen usually), fall back to user rate
      const fallbackRate = Number(apiUser?.pricePerMessage ?? 0);
      const rate = billedMsgs > 0
        ? billedTotal / billedMsgs
        : fallbackRate;

      // Optional: if you later add discount/tax to invoice, we respect them
      const discountPct = Number(invoice?.discountPercentage ?? 0);
      const taxRate = Number(invoice?.taxRate ?? 0);
      // Compute subtotal from billedMsgs * rate to show line math; keep totals consistent with invoice
      const subtotal = billedMsgs * rate;
      const discount = subtotal * (discountPct / 100);
      const taxedBase = subtotal - discount;
      const tax = taxedBase * taxRate;
      const computedTotal = taxedBase + tax;

      // Display total = use invoice.totalAmount if positive, else computed
      const displayTotal = billedTotal > 0 ? billedTotal : computedTotal;

      /* ------------------------- DB aggregations ------------------------- */
      // Aggregate status counts in the invoice period for this user.
      // Match either sentAt (if present) OR createdAt for older rows.
      const matchStage = {
        apiUser: apiUser._id,
        $or: [
          { sentAt: { $gte: periodStart, $lte: periodEnd } }, // inclusive end
          { $and: [
              { sentAt: { $exists: false } },
              { createdAt: { $gte: periodStart, $lte: periodEnd } }
            ]
          }
        ]
      };

      const byStatus = await OtpLog.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Your schema has only SENT/FAILED. Keep unknowns safe.
      const counts = { SENT: 0, FAILED: 0 };
      for (const row of byStatus) {
        const key = String(row._id || '').toUpperCase();
        if (key === 'SENT' || key === 'FAILED') counts[key] = row.count;
      }
      const totalMsgsInPeriod = counts.SENT + counts.FAILED;
      const successRate = totalMsgsInPeriod ? Math.round((counts.SENT / totalMsgsInPeriod) * 100) : 0;

      /* ------------------------------ header ----------------------------- */
      try {
        const logoPath = path.join(process.cwd(), 'public', 'codinovo-logo.png');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 40, { width: 50 });
      } catch {}

      doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(24).text('CODINOVO', 100, 42);
      doc.fillColor(colors.sub).font('Helvetica').fontSize(10)
        .text('Professional SMS & OTP Services', 100, 70)
        .text('www.codinovo.com  |  support@codinovo.com', 100, 85);

      doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(24).text('INVOICE', 400, 40, { align: 'right' });
      doc.fillColor(colors.sub).fontSize(11).font('Helvetica').text(invShort, 400, 70, { align: 'right' });

      line(110);

      /* ---------------------- Bill To & Details ------------------------- */
      h2('', 125);
      field('Company / Username', userCompany, 40, 145);
      field('Email', userEmail, 40, 175);
      field('User ID', userIdShort, 40, 205);

      h2('Invoice Details', 125);
      field('Issue Date', issueDate, 320, 145);
      field('Due Date', dueDate, 320, 175);
      field('Status', status, 320, 205);

      line(245);

      /* ------------------------- Billing Period ------------------------- */
      h2('Billing Period', 260);
      doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(11)
        .text(
          `${periodStart.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })} — ${periodEnd.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`,
          40, 280
        );

      line(310);

      /* ------------------------- Usage Summary -------------------------- */
      h2('Usage Summary', 325);

      const tableTop = 345;
      const colX = [40, 220, 350, 480];

      // header row
      doc.fillColor('#f8fafc').rect(40, tableTop, 515, 24).fill();
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10);
      doc.text('Metric', colX[0] + 5, tableTop + 7);
      doc.text('Count', colX[1] + 5, tableTop + 7);
      doc.text('Total in Period', colX[2] + 5, tableTop + 7);
      doc.text('Success Rate', colX[3] + 5, tableTop + 7);

      const row = (label, value, y, rateStr = '-') => {
        doc.fillColor('#ffffff').rect(40, y, 515, 22).fill();
        doc.fillColor(colors.text).font('Helvetica').fontSize(10);
        doc.text(label, colX[0] + 5, y + 6);
        doc.text(String(value), colX[1] + 5, y + 6);
        doc.text(String(totalMsgsInPeriod), colX[2] + 5, y + 6);
        doc.text(rateStr, colX[3] + 5, y + 6);
        doc.strokeColor(colors.light).moveTo(40, y + 22).lineTo(555, y + 22).stroke();
      };

      row('Sent', counts.SENT, tableTop + 24, `${successRate}%`);
      row('Failed', counts.FAILED, tableTop + 46, '-');

      line(tableTop + 80);

      /* ------------------------- Cost Breakdown ------------------------- */
      h2('Cost Breakdown', tableTop + 95);

      const cY = tableTop + 115;
      field('Messages Billed', billedMsgs, 40, cY);
      field('Rate / Message', `$${Number(rate || 0).toFixed(4)}`, 200, cY);
      field('Subtotal', `$${Number(subtotal || 0).toFixed(2)}`, 360, cY);

      field('Discount', `${discountPct}%  (-$${Number(discount || 0).toFixed(2)})`, 40, cY + 40);
      field('Tax', `${Math.round((taxRate || 0) * 100)}%  ($${Number(tax || 0).toFixed(2)})`, 200, cY + 40);

      // Total badge (show the authoritative invoice total)
      doc.roundedRect(360, cY + 36, 195, 40, 6).fillAndStroke('#eef2ff', '#eef2ff');
      doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(12).text('TOTAL', 370, cY + 44);
      doc.fillColor(colors.text).fontSize(16).text(`$${Number(displayTotal || 0).toFixed(2)}`, 460, cY + 41);

      /* ------------------------------ footer ---------------------------- */
      line(720);
      doc.fillColor(colors.sub).font('Helvetica').fontSize(9)
        .text('Thank you for choosing Codinovo.', 40, 730)
        .text('Support: support@codinovo.com  |  www.codinovo.com', 40, 744)
        .fillColor(colors.good)
        .text(status === 'PAID' ? 'Payment received.' : 'Payment due (Net 30).', 40, 758);

      /* ------------------------------ finish ---------------------------- */
      doc.end();
      writeStream.on('finish', () => resolve(pdfPath));
      writeStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}
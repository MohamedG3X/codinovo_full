// server/src/lib/mailer.js
import nodemailer from 'nodemailer';

const {
  SMTP_HOST = 'localhost',
  SMTP_PORT = '25',
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM = 'Codinovo <no-reply@codinovo.com>',
  NODE_ENV,
} = process.env;

// Configure transporter (with or without auth)
const baseConfig = {
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465, // SMTPS = port 465
};

if (SMTP_USER && SMTP_PASS) {
  baseConfig.auth = { user: SMTP_USER, pass: SMTP_PASS };
}

const transporter = nodemailer.createTransport(baseConfig);

// Send email
async function sendMail({ to, subject, text, html }) {
  if (!to) return { ok: false, skipped: 'missing_to' };
  try {
    const info = await transporter.sendMail({ from: MAIL_FROM, to, subject, text, html });
    if (NODE_ENV !== 'production') {
      console.log('[MAIL:sent]', info?.messageId, '->', to, subject);
    }
    return { ok: true, messageId: info?.messageId };
  } catch (e) {
    console.error('[MAIL:error]', e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
}

// Simple HTML wrapper
function wrapHtml(title, bodyHtml) {
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#111;">
      <h2 style="margin:0 0 8px;">${title}</h2>
      <div style="padding:8px 0;color:#333;">${bodyHtml}</div>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
      <div style="font-size:12px;color:#666;">© ${new Date().getFullYear()} Codinovo</div>
    </div>
  `;
}

/* ================== NOTIFIERS ================== */

// Notify password change
export async function notifyPasswordChanged(user) {
  const to = user?.contactEmail;
  if (!to) return;

  const subject = 'Your Codinovo password was changed';
  const text = `Hi ${user.username}, your password was changed on ${new Date().toISOString()}. If this wasn't you, please contact support.`;
  const html = wrapHtml('Password changed', `
    <p>Hi <strong>${user.username}</strong>,</p>
    <p>Your password was changed on <strong>${new Date().toLocaleString()}</strong>.</p>
    <p>If this wasn't you, please reset your password and contact support.</p>
  `);

  await sendMail({ to, subject, text, html });
}

// Notify login (with IP included correctly)
export async function notifyLogin(user, ipAddress) {
  const to = user?.contactEmail;
  if (!to) return;

  const ip = ipAddress || user?.lastLoginIp || 'Unknown';
  const subject = 'New login to your Codinovo account';
  const text = `Hi ${user.username}, new login detected from IP ${ip} at ${new Date().toISOString()}.`;
  const html = wrapHtml('New login detected', `
    <p>Hi <strong>${user.username}</strong>,</p>
    <p>We noticed a new login to your account:</p>
    <ul>
      <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
      <li><strong>IP:</strong> ${ip}</li>
    </ul>
    <p>If this wasn't you, please reset your password.</p>
  `);

  await sendMail({ to, subject, text, html });
}

// web/src/pages/Register.jsx
import React, { useState } from 'react';
import { api } from '../lib/api';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '', password: '', jobTitle: '',
    companyWebsite: '',
    companyDescription: '', companyName: '', contactPhone: '', applicantPosition: '', contactEmail: ''
  });
  const [usernameForOtp, setUsernameForOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pwHint, setPwHint] = useState({});

  const on = k => e => setForm({ ...form, [k]: e.target.value });

  function checkPw(pw) {
    setPwHint({
      min: pw.length >= 8,
      lower: /[a-z]/.test(pw),
      upper: /[A-Z]/.test(pw),
      digit: /\d/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw)
    });
  }

  // Basic client-side sanity checks before hitting the server
  function validateStep1() {
    const errors = [];
    if (!form.companyName.trim()) errors.push('Company name is required');
    if (!form.applicantPosition.trim()) errors.push('Applicant position is required');
    if (!form.jobTitle.trim()) errors.push('Job title is required'); // ✅ جديد
    if (!form.username.trim()) errors.push('Username is required');
    if (!form.password) errors.push('Password is required');
    // Password strength (mirror back-end)
    const strong =
      form.password.length >= 8 &&
      /[a-z]/.test(form.password) &&
      /[A-Z]/.test(form.password) &&
      /\d/.test(form.password) &&
      /[^A-Za-z0-9]/.test(form.password);
    if (!strong) errors.push('Password too weak');

    // Phone (react-phone-input-2 returns digits without + by default)
    const digits = String(form.contactPhone || '').replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      errors.push('Enter a valid phone number (include your country)');
    }

    return errors;
  }

  async function submitDetails(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);

    const errs = validateStep1();
    if (errs.length) {
      setBusy(false);
      setMsg({ type: 'err', text: errs[0] });
      return;
    }

    try {
      // Back-end expects digits-only; we already store digits from PhoneInput
      await api.post('/auth/register', form);
      setUsernameForOtp(form.username);
      setStep(2);
      setMsg({ type: 'ok', text: `We sent a 6-digit code to WhatsApp: +${form.contactPhone}` });
    } catch (err) {
      const code = err?.response?.data?.error;
      let text = 'Registration failed';
      if (code === 'username_taken') text = 'Username is already taken';
      if (code === 'phone_taken') text = 'Phone number already registered';
      if (code === 'invalid_phone') text = 'Please enter a valid phone number';
      if (code === 'weak_password') text = 'Password too weak. Must have upper, lower, number, special, 8+ chars.';
      if (code === 'missing_required_fields') text = 'Please fill all required fields';
      setMsg({ type: 'err', text });
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api.post('/auth/verify-otp', { username: usernameForOtp, otp });
      setMsg({ type: 'ok', text: 'OTP verified. Your account is under review.' });
      setStep(3);
    } catch (err) {
      const code = err?.response?.data?.error;
      setMsg({ type: 'err', text: code === 'invalid_or_expired_otp' ? 'Invalid or expired code' : 'Verification failed' });
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true); setMsg(null);
    try {
      await api.post('/auth/resend-otp', { username: usernameForOtp });
      setMsg({ type: 'ok', text: 'OTP resent to your WhatsApp.' });
    } catch {
      setMsg({ type: 'err', text: 'Failed to resend OTP' });
    } finally {
      setBusy(false);
    }
  }

  if (step === 3) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Thanks!</h1>
        <p>Your account is now <b>under review</b>. Contact <a className="underline" href="mailto:support@example.com">support@example.com</a>.</p>
        <a href="/login" className="inline-block mt-4 underline">Back to login</a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create your account</h1>

      {msg && (
        <div className={`mb-3 text-sm px-3 py-2 rounded ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={submitDetails} className="space-y-3">
          <input
            className="border rounded w-full p-2"
            placeholder="Company name *"
            value={form.companyName}
            onChange={on('companyName')}
          />

          <input
            className="border rounded w-full p-2"
            placeholder="Applicant position *"
            value={form.applicantPosition}
            onChange={on('applicantPosition')}
          />

          {/* Phone with country selector (stores digits only) */}
          <div>
            <label className="block text-sm mb-1">Contact phone *</label>
            <PhoneInput
              country="eg"                // default (change if you prefer)
              enableSearch
              inputProps={{ name: 'phone', required: true }}
              value={form.contactPhone}
              onChange={(value) => {
                // value is digits-only (no +). Store digits; backend strips non-digits anyway.
                setForm({ ...form, contactPhone: value });
              }}
              // basic Tailwind-ish fit
              containerClass="w-full"
              inputClass="!w-full !h-11 !text-base"
              buttonStyle={{ borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }}
            />
            <div className="text-xs text-gray-500 mt-1">Include your country (use the flag picker).</div>
          </div>

          <input
            className="border rounded w-full p-2"
            placeholder="Contact email (optional)"
            value={form.contactEmail}
            onChange={on('contactEmail')}
          />

          <input
            className="border rounded w-full p-2"
            placeholder="Desired username *"
            value={form.username}
            onChange={on('username')}
          />
          {/* ======================================================================== */}
          <input
            className="border rounded w-full p-2"
            placeholder="Job Title *"
            value={form.jobTitle}
            onChange={on('jobTitle')}
          />

          <input
            className="border rounded w-full p-2"
            placeholder="Company Website (optional)"
            value={form.companyWebsite}
            onChange={on('companyWebsite')}
          />

          <textarea
            className="border rounded w-full p-2"
            placeholder="Company Description (optional)"
            value={form.companyDescription}
            onChange={on('companyDescription')}
            rows={3}
          />

          {/* ======================================================================== */}
          <input
            className="border rounded w-full p-2"
            type="password"
            placeholder="Password *"
            value={form.password}
            onChange={(e) => { on('password')(e); checkPw(e.target.value); }}
          />

          {/* Password hints */}
          <div className="text-xs text-gray-600 space-y-1">
            <div className={pwHint.min ? 'text-green-700' : ''}>• At least 8 characters</div>
            <div className={pwHint.lower ? 'text-green-700' : ''}>• Lowercase letter</div>
            <div className={pwHint.upper ? 'text-green-700' : ''}>• Uppercase letter</div>
            <div className={pwHint.digit ? 'text-green-700' : ''}>• Number</div>
            <div className={pwHint.special ? 'text-green-700' : ''}>• Special character</div>
          </div>

          <button
            disabled={busy}
            className={`px-4 py-2 text-white rounded w-full ${busy ? 'bg-gray-400' : 'bg-blue-600'}`}
          >
            {busy ? 'Submitting…' : 'Continue'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verifyOtp} className="space-y-3">
          <div className="text-sm text-gray-600">Enter the 6-digit code we sent to WhatsApp.</div>
          <input
            className="border rounded w-full p-2 tracking-widest text-center text-lg"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            maxLength={6}
          />
          <div className="flex gap-3">
            <button disabled={busy} className={`px-4 py-2 text-white rounded ${busy ? 'bg-gray-400' : 'bg-blue-600'}`}>
              {busy ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button type="button" onClick={resend} disabled={busy} className="px-4 py-2 border rounded">
              Resend
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
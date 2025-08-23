// web/src/pages/PasswordReset.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { MessageSquare, Shield, KeyRound, Loader2, ArrowRight } from 'lucide-react';

export default function PasswordReset() {
  const nav = useNavigate();
  const [step, setStep] = useState('request'); // 'request' | 'verify' | 'reset' | 'done'
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'warn'|'err'|'info'|'ok', text}
  const [form, setForm] = useState({
    username: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetToken, setResetToken] = useState('');

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const on = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function note(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  }

  // Step 1: request code
  async function submitRequest(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api.post('/auth/password/forgot', { username: form.username.trim() });
      note('ok', 'If the username exists, an OTP has been sent to the registered phone.');
      setStep('verify');
    } catch (err) {
      note('err', 'Could not start password reset.');
    } finally {
      setBusy(false);
    }
  }

  // Step 2: verify code
  async function submitVerify(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const { data } = await api.post('/auth/password/verify', {
        username: form.username.trim(),
        otp: form.otp.trim(),
      });
      setResetToken(data.resetToken);
      note('ok', 'OTP verified. You can set a new password.');
      setStep('reset');
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'too_many_attempts') note('err', 'Too many attempts. Please request a new code later.');
      else note('err', 'Invalid or expired code.');
    } finally {
      setBusy(false);
    }
  }

  // Step 3: set new password
  async function submitReset(e) {
  e.preventDefault();
  setBusy(true); setMsg(null);

  if (form.newPassword !== form.confirmPassword) {
    note('err', 'Passwords do not match.');
    setBusy(false);
    return;
  }

  try {
    await api.post('/auth/password/reset', {
      resetToken,
      newPassword: form.newPassword,
    });
    note('ok', 'Password updated successfully.');
    setStep('done');
    setTimeout(() => nav('/login'), 1200);
  } catch (err) {
    const code = err?.response?.data?.error;
    if (code === 'weak_password') {
      note('err', 'Weak password: min 8 chars with upper, lower, digit, and special.');
    } else if (code === 'password_reuse_not_allowed') {
      note('err', 'New password cannot be the same as your old password.');
    } else {
      note('err', 'Reset failed. The token or code may have expired.');
    }
  } finally {
    setBusy(false);
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative">
      {/* background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className={`absolute top-24 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 ${prefersReducedMotion ? '' : 'animate-pulse'}`} />
        <div className={`absolute top-40 right-20 w-24 h-24 bg-indigo-100 rounded-full opacity-30 ${prefersReducedMotion ? '' : 'animate-bounce'}`} />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-50 rounded-full opacity-25" />
      </div>

      {/* nav */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Codinovo
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/docs" className="text-gray-600 hover:text-blue-600 transition-colors">Docs</Link>
            <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      {/* content */}
      <main className="relative z-10 px-6 pt-10 pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          {/* left */}
          <div className="hidden lg:block">
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Reset your password
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              We’ll send a short code to your registered WhatsApp number. Verify it, then set a strong new password.
            </p>
            <div className="mt-8 flex items-center gap-3 text-gray-600">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Secure by design</div>
                <div className="text-sm">One-time codes + strong password policy</div>
              </div>
            </div>
          </div>

          {/* right: card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-100 shadow-lg w-full max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 'request' && 'Forgot password'}
                  {step === 'verify' && 'Verify code'}
                  {step === 'reset' && 'Set new password'}
                  {step === 'done' && 'All set!'}
                </h2>
                <p className="text-sm text-gray-600">
                  {step === 'request' && 'Enter your username to receive a reset code.'}
                  {step === 'verify' && 'Check WhatsApp for the 6-digit code.'}
                  {step === 'reset' && 'Choose a strong password to finish.'}
                  {step === 'done' && 'Your password was updated. Redirecting to login…'}
                </p>
              </div>
            </div>

            {msg && (
              <div
                className={`mb-4 text-sm px-3 py-2 rounded border ${
                  msg.type==='warn' ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                  : msg.type==='err' ? 'bg-red-50 text-red-700 border-red-200'
                  : msg.type==='ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {msg.text}
              </div>
            )}

            {step === 'request' && (
              <form onSubmit={submitRequest} className="space-y-4">
                <label className="block">
                  <span className="text-sm text-gray-700">Username</span>
                  <input
                    className="mt-1 border border-gray-200 rounded-xl w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your_username"
                    value={form.username}
                    onChange={on('username')}
                    required
                    autoComplete="username"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!form.username || busy}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-white ${busy ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-md'}`}
                >
                  {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>) : (<>Send code <ArrowRight className="w-4 h-4" /></>)}
                </button>

                <div className="text-sm text-gray-600">
                  Remembered it?{' '}
                  <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">Back to login</Link>
                </div>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={submitVerify} className="space-y-4">
                <label className="block">
                  <span className="text-sm text-gray-700">Verification code</span>
                  <input
                    className="mt-1 border border-gray-200 rounded-xl w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="6-digit code"
                    inputMode="numeric"
                    value={form.otp}
                    onChange={on('otp')}
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={!form.otp || busy}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-white ${busy ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-md'}`}
                >
                  {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>) : (<>Verify <ArrowRight className="w-4 h-4" /></>)}
                </button>

                <div className="text-sm text-gray-600">
                  Didn’t receive it? You can go back and{' '}
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="font-semibold text-blue-700 hover:text-blue-800 underline"
                  >
                    request a new code
                  </button>.
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={submitReset} className="space-y-4">
                <label className="block">
                  <span className="text-sm text-gray-700">New password</span>
                  <input
                    type="password"
                    className="mt-1 border border-gray-200 rounded-xl w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    value={form.newPassword}
                    onChange={on('newPassword')}
                    required
                    autoComplete="new-password"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700">Confirm new password</span>
                  <input
                    type="password"
                    className="mt-1 border border-gray-200 rounded-xl w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={on('confirmPassword')}
                    required
                    autoComplete="new-password"
                  />
                </label>

                <p className="text-xs text-gray-500">
                  Must be at least 8 characters and include uppercase, lowercase, number, and special character.
                </p>

                <button
                  type="submit"
                  disabled={!form.newPassword || !form.confirmPassword || busy}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-white ${busy ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-md'}`}
                >
                  {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>) : (<>Update password <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </form>
            )}

            {step === 'done' && (
              <div className="text-sm text-gray-700">
                Password updated. Taking you to{' '}
                <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">Login</Link>…
              </div>
            )}
          </div>
        </div>
      </main>

      {/* footer */}
      <footer className="bg-gray-900 text-white px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg grid place-items-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Codinovo</span>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <FooterCol title="Product" links={[["/#features","Features"],["/#pricing","Pricing"],["/docs","Documentation"]]} />
            <FooterCol title="Company" links={[["/about","About"],["/blog","Blog"],["/careers","Careers"]]} />
            <FooterCol title="Support" links={[["/help","Help Center"],["/contact","Contact Us"],["/status","Status"]]} />
            <FooterCol title="Legal" links={[["/privacy","Privacy"],["/terms","Terms"],["/security","Security"]]} />
          </div>
          <div className="border-top border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Codinovo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold mb-4">{title}</h4>
      <ul className="space-y-2 text-gray-400">
        {links.map(([to, label]) => (
          to.startsWith('#') || to.startsWith('/#') ? (
            <li key={to}><a href={to} className="hover:text-white transition-colors">{label}</a></li>
          ) : (
            <li key={to}><Link to={to} className="hover:text-white transition-colors">{label}</Link></li>
          )
        ))}
      </ul>
    </div>
  );
}

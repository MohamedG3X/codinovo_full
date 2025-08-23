import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  MessageSquare,
  Code,
  CheckCircle,
  Shield,
  Clock,
  RefreshCw,
  ArrowRight,
  MailCheck,
  Smartphone,
  Loader2,
} from 'lucide-react';

export default function LiveDemo() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('send'); // 'send' | 'verify'
  const [msg, setMsg] = useState('');
  const [remaining, setRemaining] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // honor reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  async function fetchRemaining() {
    try {
      const { data } = await api.get('/demo/otp/remaining');
      setRemaining(data.remaining);
    } catch {
      /* no-op */
    }
  }

  useEffect(() => { fetchRemaining(); }, []);

  const sanitizePhone = (val) => val.replace(/\D/g, '').slice(0, 15);

  const sendOtp = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(''); setError('');
    try {
      const { data } = await api.post('/demo/otp/send', { phone });
      setMsg('OTP sent! Check your WhatsApp.');
      setStep('verify');
      if (typeof data.remaining === 'number') setRemaining(data.remaining);
    } catch (err) {
      const m = err?.response?.data?.error || 'Failed to send';
      if (m === 'rate_limited') setError('Daily limit reached (2). Try again tomorrow.');
      else if (m === 'invalid_phone') setError('Enter a valid phone (digits only, 10–15).');
      else setError(m);
    } finally {
      setBusy(false);
    }
  };

  async function handleVerify(e) {
    e.preventDefault();
    setBusy(true); setMsg(''); setError('');
    try {
      const res = await api.post('/demo/otp/verify', { phone, code });
      if (res.data.ok) {
        setMsg('✅ OTP Verified!');
      } else {
        setError('Invalid code');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  }

  const resetToSend = () => {
    setStep('send');
    setCode('');
    setMsg('');
    setError('');
    fetchRemaining();
  };

  const isPhoneValid = phone.length >= 10 && phone.length <= 15;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative">
      {/* background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className={`absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 ${prefersReducedMotion ? '' : 'animate-pulse'}`}></div>
        <div className={`absolute top-40 right-20 w-24 h-24 bg-indigo-100 rounded-full opacity-30 ${prefersReducedMotion ? '' : 'animate-bounce'}`}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-50 rounded-full opacity-25"></div>
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
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How it works</a>
            <Link to="/docs" className="text-gray-600 hover:text-blue-600 transition-colors">Docs</Link>
            <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      {/* hero / header */}
      <section className="relative z-10 px-6 pt-10 pb-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${prefersReducedMotion ? '' : 'opacity-100 translate-y-0'} opacity-100`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <MailCheck className="w-4 h-4" />
              Live Demo — OTP over WhatsApp
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-[1.05]">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Test it now
              </span>
              <br />
              <span className="text-gray-900">No account required</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-4 leading-relaxed">
              Public test. Limited to <b>2 sends/day</b> per IP. Demo does not deduct any wallet balance.
            </p>
            {remaining !== null && (
              <p className="text-sm text-gray-500">Remaining today: <b>{remaining}</b></p>
            )}
          </div>
        </div>
      </section>

      {/* main content */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          {/* left: interactive card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-100 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center">
                {step === 'send' ? <Smartphone className="w-6 h-6 text-white" /> : <Code className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{step === 'send' ? 'Send OTP' : 'Verify Code'}</h2>
                <p className="text-sm text-gray-600">{step === 'send' ? 'Enter your phone to receive a 6-digit code via WhatsApp.' : `We sent a 6-digit code to ${phone || 'your phone'}.`}</p>
              </div>
            </div>

            {step === 'send' && (
              <form onSubmit={sendOtp} className="space-y-4">
                <label className="block">
                  <span className="text-sm text-gray-700">Phone (digits only, e.g. 2010xxxxxxx)</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="mt-1 border border-gray-200 rounded-xl w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2010xxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                    required
                    aria-invalid={!isPhoneValid}
                  />
                </label>
                <Button
                  type="submit"
                  disabled={busy || !isPhoneValid}
                  className="w-full"
                >
                  {busy ? (<span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending…</span>) : 'Send OTP'}
                </Button>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerify} className="mt-4 space-y-4">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="border px-3 py-2 rounded w-full"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Verify OTP
                </button>
              </form>
            )}

            {(msg || error) && (
              <div className={`mt-5 text-sm rounded-xl p-3 border ${error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {error ? error : msg}
              </div>
            )}

            <p className="mt-4 text-xs text-gray-500">
              Demo does not require an account and does not deduct any wallet balance.
            </p>
          </div>

          {/* right: info / reassurance */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">What happens next?</h3>
              <p className="text-gray-600 mb-6">We generate a one-time 6-digit code and deliver it over WhatsApp. For the demo, codes are valid for a short time and attempts are rate-limited.</p>
              <ul className="space-y-3">
                <Li icon={<CheckCircle className="w-5 h-5 text-green-600" />}>Sub-second delivery on average</Li>
                <Li icon={<Shield className="w-5 h-5 text-blue-600" />}>Secure, ephemeral codes</Li>
                <Li icon={<Clock className="w-5 h-5 text-indigo-600" />}>2 sends/day per IP in demo</Li>
              </ul>
              <div className="mt-6">
                <Link
                  to="/docs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl"
                >
                  See API Docs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* tiny code sample window to mirror Home page style */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <Dot color="bg-red-500" />
                <Dot color="bg-yellow-500" />
                <Dot color="bg-green-500" />
                <span className="text-gray-400 text-sm ml-2">demo-send-verify.js</span>
              </div>
              <pre className="text-sm text-gray-300 overflow-x-auto">{`// Send OTP (Demo)
await fetch('/demo/otp/send', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '2010xxxxxxx' })
});

// Verify OTP (Demo)
await fetch('/demo/otp/verify', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '2010xxxxxxx', code: '123456' })
});`}</pre>
            </div>
          </div>
        </div>
      </section>

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
            <FooterCol title="Product" links={[
              ['/#features', 'Features'],
              ['/#pricing', 'Pricing'],
              ['/docs', 'Documentation'],
            ]} />
            <FooterCol title="Company" links={[
              ['/about', 'About'],
              ['/blog', 'Blog'],
              ['/careers', 'Careers'],
            ]} />
            <FooterCol title="Support" links={[
              ['/help', 'Help Center'],
              ['/contact', 'Contact Us'],
              ['/status', 'Status'],
            ]} />
            <FooterCol title="Legal" links={[
              ['/privacy', 'Privacy'],
              ['/terms', 'Terms'],
              ['/security', 'Security'],
            ]} />
          </div>
          <div className="border-top border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Codinovo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* --------------------------------- UI bits -------------------------------- */
function Button({ children, className = '', variant = 'primary', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 focus:outline-none';
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-md',
    outline: 'border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Dot({ color }) {
  return <div className={`w-3 h-3 ${color} rounded-full`}></div>;
}

function Li({ icon, children }) {
  return (
    <li className="flex items-center gap-3 text-gray-700">
      <span>{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold mb-4">{title}</h4>
      <ul className="space-y-2 text-gray-400">
        {links.map(([to, label]) =>
          to.startsWith('#') || to.startsWith('/#') ? (
            <li key={to}><a href={to} className="hover:text-white transition-colors">{label}</a></li>
          ) : (
            <li key={to}><Link to={to} className="hover:text-white transition-colors">{label}</Link></li>
          )
        )}
      </ul>
    </div>
  );
}
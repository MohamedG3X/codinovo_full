// web/src/pages/LoginUnified.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { MessageSquare, User, Loader2, Shield, ArrowRight } from 'lucide-react';

export default function LoginUnified(){
  const nav = useNavigate();
  const [form, setForm] = useState({ email:'', username:'', password:'' });
  const [msg, setMsg] = useState(null); // {type:'warn'|'err'|'info', text:string}
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e){
    e.preventDefault(); setMsg(null); setBusy(true);
    try{
      const { data } = await api.post('/auth/login', form);
      if (data.type === 'ADMIN'){
        localStorage.setItem('admin_token', data.token);
        nav('/admin');
      } else {
        localStorage.setItem('api_token', data.token);
        nav('/app');
      }
    }catch(err){
      const code = err?.response?.data?.error;
      if (code === 'account_under_review'){
        setMsg({ type:'warn', text: 'Your account is under review. Please contact support.' });
      } else if (code === 'invalid_user_credentials' || code === 'invalid_admin_credentials') {
        setMsg({ type:'err', text: 'Invalid credentials' });
      } else {
        setMsg({ type:'err', text: 'Login failed' });
      }
    } finally {
      setBusy(false);
    }
  }

  const identityValue = form.email || form.username;
  const canSubmit = Boolean(identityValue && form.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative">
      {/* background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className={`absolute top-24 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 ${prefersReducedMotion ? '' : 'animate-pulse'}`}></div>
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
            <Link to="/docs" className="text-gray-600 hover:text-blue-600 transition-colors">Docs</Link>
            <Link to="/register" className="text-gray-600 hover:text-blue-600 transition-colors">Register</Link>
          </div>
        </div>
      </nav>

      {/* content */}
      <main className="relative z-10 px-6 pt-10 pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          {/* left: neutral pitch (no admin mention) */}
          <div className="hidden lg:block">
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              Sign in to access your dashboard, logs, wallet, and analytics. Secure by design — fast by default.
            </p>
            <div className="mt-8 flex items-center gap-3 text-gray-600">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Secure authentication</div>
                <div className="text-sm">Role-based access and safe session handling</div>
              </div>
            </div>
          </div>

          {/* right: form card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-100 shadow-lg w-full max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl grid place-items-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Login</h2>
                <p className="text-sm text-gray-600">Use your credentials to continue.</p>
              </div>
            </div>

            {msg && (
              <div
                className={`mb-4 text-sm px-3 py-2 rounded border ${
                  msg.type==='warn' ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                  : msg.type==='err' ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {msg.text}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-700">Enter Username</span>
                <input
                  className="mt-1 border border-gray-200 rounded-xl w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your_username"
                  value={identityValue}
                  onChange={(e)=>{
                    const v = e.target.value;
                    if (v.includes('@')) setForm(f=>({ ...f, email:v, username:'' }));
                    else setForm(f=>({ ...f, username:v, email:'' }));
                  }}
                  required
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">Password</span>
                <div className="mt-1 relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="border border-gray-200 rounded-xl w-full p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={on('password')}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={()=>setShowPass(s=>!s)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={!canSubmit || busy}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-white ${busy ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-md'}`}
              >
                {busy ? (<><Loader2 className="w-4 h-4 animate-spin"/> Signing in…</>) : (<>Login <ArrowRight className="w-4 h-4"/></>)}
              </button>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <Link to="/forgot" className="hover:text-blue-600">Forgot password?</Link>
                <div>
                  New here?{' '}
                  <Link to="/register" className="font-semibold text-blue-700 hover:text-blue-800">Create an account</Link>
                </div>
              </div>
            </form>
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

// web/src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Zap, Code, Shield, BarChart3, CheckCircle,
  ArrowRight, Sparkles, Users, Globe, Clock, Coins
} from 'lucide-react';
import useDataRefresh from '../hooks/useDataRefresh';
import { api } from '../lib/api';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({ messages: 0, users: 0, uptime: 0 });

  // honor reduced motion (for background animations etc.)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // load (or fake) live stats; used by useDataRefresh as well
  const loadStats = async () => {
    try {
      const m = Number(data?.messages) || 0;
      const u = Number(data?.users) || 0;
      const up = Number(data?.uptime) || 0;
      if (m || u || up) {
        setStats({ messages: m, users: u, uptime: up });
        return;
      }
      // fall back to demo values if API returns empty
      setStats({ messages: 2847563, users: 15420, uptime: 99.9 });
    } catch {
      // fall back to demo values if API fails
      setStats({ messages: 2847563, users: 15420, uptime: 99.9 });
    }
  };

  useEffect(() => {
    setIsVisible(true);
    loadStats(); // initial load
  }, []);

  // auto-reload after any app-wide change your hook listens for
  useDataRefresh(loadStats);

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
            <a href="#features" className="text-gray-700 hover:text-blue-700 transition-colors">Features</a>
            <a href="#levels" className="text-gray-700 hover:text-blue-700 transition-colors">Levels</a>
            <a href="#usdt" className="text-gray-700 hover:text-blue-700 transition-colors">USDT</a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-700 transition-colors">Pricing</a>
            <Link to="/docs" className="text-gray-700 hover:text-blue-700 transition-colors">Docs</Link>
            <Link to="/login" className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* hero */}
      <section className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Trusted by 15,000+ developers worldwide
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.05]">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent inline-block">
                Lightning Fast
              </span>
              <br />
              <span className="text-gray-900">OTP Delivery</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Send and verify OTPs over WhatsApp with our blazing-fast API.
              Enterprise-grade reliability, developer-friendly integration, and transparent pricing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                to="/register"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl inline-flex items-center justify-center gap-2"
              >
                Start for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/demo"
                className="px-8 py-4 border-2 border-blue-200 text-blue-700 rounded-xl font-semibold text-lg transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 inline-flex items-center justify-center gap-2"
              >
                <Code className="w-5 h-5" />
                View Live Demo
              </Link>
            </div>

            {/* live stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <StatCard
                icon={<MessageSquare className="w-8 h-8 text-blue-600" />}
                value={(stats.messages || 0).toLocaleString()}
                label="Messages Delivered"
              />
              <StatCard
                icon={<Users className="w-8 h-8 text-indigo-600" />}
                value={`${(stats.users || 0).toLocaleString()}+`}
                label="Active Developers"
              />
              <StatCard
                icon={<Globe className="w-8 h-8 text-purple-600" />}
                value={`${stats.uptime || 0}%`}
                label="Uptime SLA"
              />
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="relative z-10 px-6 py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Built for <span className="text-blue-600">Developers</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to integrate OTP verification seamlessly into your applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={<Zap className="w-8 h-8" />} title="Sub-Second Delivery"
              description="Average delivery time under 800ms via WhatsApp. Built for speed and reliability."
              gradient="from-yellow-400 to-orange-500" />
            <FeatureCard icon={<Code className="w-8 h-8" />} title="Simple Integration"
              description="Two REST endpoints. Send OTP, verify OTP. That's it. Start in under 5 minutes."
              gradient="from-blue-500 to-cyan-500" />
            <FeatureCard icon={<Shield className="w-8 h-8" />} title="Enterprise Security"
              description="Bank-grade encryption, SOC 2 readiness, and 99.9% uptime SLA."
              gradient="from-green-500 to-emerald-500" />
            <FeatureCard icon={<BarChart3 className="w-8 h-8" />} title="Real-time Analytics"
              description="Delivery reports, success rates, and cost optimization insights."
              gradient="from-purple-500 to-pink-500" />
            <FeatureCard icon={<Globe className="w-8 h-8" />} title="Global Coverage"
              description="WhatsApp delivery to 180+ countries with local number support."
              gradient="from-indigo-500 to-purple-500" />
            <FeatureCard icon={<Clock className="w-8 h-8" />} title="Smart Retry Logic"
              description="Intelligent fallbacks ensure maximum delivery success."
              gradient="from-teal-500 to-cyan-500" />
          </div>
        </div>
      </section>

      {/* code example (Integration in Minutes) */}
      <section className="relative z-10 px-6 py-24 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-4xl font-bold text-white mb-6">Integration in Minutes</h3>
            <p className="text-lg text-blue-100 mb-8">
              Clean, simple API that just works. No complex setup, no hidden gotchas.
            </p>
            <ul className="space-y-4 mb-8 text-green-300">
              <Li><CheckCircle className="w-5 h-5" /> RESTful API with comprehensive docs</Li>
              <Li><CheckCircle className="w-5 h-5" /> SDKs for popular languages</Li>
              <Li><CheckCircle className="w-5 h-5" /> Webhook support for real-time updates</Li>
            </ul>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-lg font-semibold transition-all duration-300 hover:bg-blue-50"
            >
              View Documentation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Dot color="bg-red-500" />
              <Dot color="bg-yellow-500" />
              <Dot color="bg-green-500" />
              <span className="text-gray-400 text-sm ml-2">send-otp.js</span>
            </div>
            <pre className="text-sm text-gray-300 overflow-x-auto">
{`// Send OTP
const r1 = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+1234567890', template: 'Your OTP is: {{code}}' })
});

// Verify OTP
const r2 = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+1234567890', code: '123456' })
});`}
            </pre>
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="relative z-10 px-6 py-24 bg-gradient-to-b from-white via-blue-50 to-indigo-50" id="levels">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Grow with Codinovo
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Our platform automatically unlocks higher levels as you send more OTPs.
            No manual upgrades, no hidden fees.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Level 1 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Level 1</h3>
              <p className="text-gray-600 mb-4">Default starting tier.</p>
              <ul className="text-gray-700 space-y-3">
                <li>✔ Up to 1,000 messages</li>
              </ul>
            </div>

            {/* Level 2 */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-600 p-8 scale-105">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Level 2</h3>
              <p className="text-gray-600 mb-4">Unlocked after growth.</p>
              <ul className="text-gray-700 space-y-3">
                <li>✔ Send more than 1,000 messages</li>
              </ul>
            </div>

            {/* Level 3 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Level 3</h3>
              <p className="text-gray-600 mb-4">Enterprise scale.</p>
              <ul className="text-gray-700 space-y-3">
                <li>✔ Send more than 10,000 messages</li>
              </ul>
            </div>
          </div>

          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* USDT Top-Up */}
      <section id="usdt" className="relative z-10 px-6 py-24 bg-gradient-to-b from-indigo-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6">
              <Coins className="w-4 h-4" />
              USDT Top-Up
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Top up with USDT — ridiculously easy
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Fund your balance in minutes with <span className="font-semibold">USDT</span>, then start sending OTPs right away.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* left: steps */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">3 quick steps</h3>
              <ol className="space-y-5 text-left">
                <Step num="1" title="Generate your deposit address" desc="From your dashboard, choose your preferred USDT network." />
                <Step num="2" title="Send USDT" desc="Transfer any amount from your crypto wallet or exchange." />
                <Step num="3" title="Instant Credit" desc="Your account balance updates automatically after confirmation." />
              </ol>

              <div className="mt-8">
                <div className="text-sm font-semibold text-gray-900 mb-3">Supported networks</div>
                <div className="flex flex-wrap gap-2">
                  <Chip>TRC-20 (Tron)</Chip>
                  <Chip>ERC-20 (Ethereum)</Chip>
                  <Chip>BEP-20 (BSC)</Chip>
                  <Chip>Polygon</Chip>
                </div>
              </div>
            </div>

            {/* right: highlight */}
            <div className="flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-10 text-white text-center shadow-xl">
              <Coins className="w-16 h-16 mb-6 text-yellow-300" />
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Crypto-Friendly Billing</h3>
              <p className="text-blue-100 mb-6 max-w-md">
                No banks, no delays, no hidden fees. Scan, send, and your balance is live.
              </p>
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-blue-50"
              >
                Start with USDT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* pricing CTA */}
      <section className="relative z-10 px-6 py-24" id="pricing">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of developers who trust Codinovo for their OTP delivery needs.
            Start with our generous free tier.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl"
          >
            Start Free Trial
          </Link>
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
              ['#features', 'Features'],
              ['#levels', 'Levels'],
              ['#usdt', 'USDT Top-Up'],
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
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Codinovo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------- Small reusable bits -------------------------- */
function StatCard({ icon, value, label }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-center mb-3">{icon}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-gray-600 text-sm">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }) {
  return (
    <div className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
      <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl grid place-items-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function LevelCard({ title, desc, list, highlight }) {
  return (
    <div className={`${highlight ? 'border-2 border-blue-600 scale-105' : 'border border-gray-100'} bg-white rounded-2xl shadow-lg p-8 transition-transform`}>
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{desc}</p>
      <ul className="text-gray-700 space-y-2">
        {list.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <li className="flex items-start gap-4">
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center font-semibold">
        {num}
      </span>
      <div>
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-gray-600 text-sm">{desc}</div>
      </div>
    </li>
  );
}

function Chip({ children }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-700 shadow-sm">
      {children}
    </span>
  );
}

function Dot({ color }) {
  return <div className={`w-3 h-3 ${color} rounded-full`}></div>;
}
function Li({ children }) {
  return <li className="flex items-center gap-3">{children}</li>;
}
function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold mb-4">{title}</h4>
      <ul className="space-y-2 text-gray-400">
        {links.map(([to, label]) =>
          to.startsWith('#') ? (
            <li key={to}><a href={to} className="hover:text-white transition-colors">{label}</a></li>
          ) : (
            <li key={to}><Link to={to} className="hover:text-white transition-colors">{label}</Link></li>
          )
        )}
      </ul>
    </div>
  );
}

// web/src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Zap, Code, Shield, BarChart3, CheckCircle,
  ArrowRight, Sparkles, Users, Globe, Clock, Coins
} from 'lucide-react';
import useDataRefresh from '../hooks/useDataRefresh';
import { api } from '../lib/api';
import IntegrationSection from './../components/IntegrationSection';
import HeroHome from '../components/HeroHome';

export default function Home() {

  const animations = [
    "fade-up",
    "fade-down",
    "fade-left",
    "fade-right",
    "zoom-in",
    "zoom-out",
    "flip-left",
    "flip-right"
  ];

  // honor reduced motion (for background animations etc.)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const getRandomAnimation = () => {
    return animations[Math.floor(Math.random() * animations.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative">
      {/* background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className={`absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 ${prefersReducedMotion ? '' : 'animate-pulse'}`}></div>
        <div className={`absolute top-40 right-20 w-24 h-24 bg-indigo-100 rounded-full opacity-30 ${prefersReducedMotion ? '' : 'animate-bounce'}`}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-50 rounded-full opacity-25"></div>
      </div>

      {/* nav */}


      {/* hero */}
      <HeroHome />

      {/* features */}
      <section id="features" className="relative z-10 px-6 py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-300"
              data-aos="fade-right"
              data-aos-delay="300"
            >
              Built for <span className="text-blue-600"
              >Developers</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              Everything you need to integrate OTP verification seamlessly into your applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div data-aos="fade-left">
              <FeatureCard
                icon={<Zap className="w-8 h-8" />}
                title="Sub-Second Delivery"
                description="Average delivery time under 800ms via WhatsApp. Built for speed and reliability."
                gradient="from-yellow-400 to-orange-500"
              />
            </div>
            <div data-aos="fade-left">
              <FeatureCard
                icon={<Code className="w-8 h-8" />}
                title="Simple Integration"
                description="Two REST endpoints. Send OTP, verify OTP. That's it. Start in under 5 minutes."
                gradient="from-blue-500 to-cyan-500"
              />
            </div>
            <div data-aos="fade-left">
              <FeatureCard
                icon={<Shield className="w-8 h-8" />}
                title="Enterprise Security"
                description="Bank-grade encryption, SOC 2 readiness, and 99.9% uptime SLA."
                gradient="from-green-500 to-emerald-500"
              />
            </div>
            <div data-aos="fade-right">
              <FeatureCard
                icon={<BarChart3 className="w-8 h-8" />}
                title="Real-time Analytics"
                description="Delivery reports, success rates, and cost optimization insights."
                gradient="from-purple-500 to-pink-500"
              />
            </div>
            <div data-aos="fade-right">
              <FeatureCard
                icon={<Globe className="w-8 h-8" />}
                title="Global Coverage"
                description="WhatsApp delivery to 180+ countries with local number support."
                gradient="from-indigo-500 to-purple-500"
              />
            </div>
            <div data-aos="fade-right">
              <FeatureCard
                icon={<Clock className="w-8 h-8" />}
                title="Smart Retry Logic"
                description="Intelligent fallbacks ensure maximum delivery success."
                gradient="from-teal-500 to-cyan-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* code example (Integration in Minutes) */}
      <IntegrationSection />

      {/* Levels */}
      <section className="relative z-10 px-6 py-24 bg-white dark: dark:bg-gray-900" id="levels">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-300">
            Grow with Codinovo
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Our platform automatically unlocks higher levels as you send more OTPs.
            No manual upgrades, no hidden fees.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Level 1 */}
            <div className="bg-white dark:bg-gray-900  rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-300 mb-2">Level 1</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Default starting tier.</p>
              <ul className="text-gray-700 dark:text-gray-300 space-y-3">
                <li>✔ Up to 1,000 messages</li>
              </ul>
            </div>

            {/* Level 2 */}
            <div className="bg-white dark:bg-gray-900  rounded-2xl shadow-xl border-2 border-blue-600 p-8 scale-105">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-300 mb-2">Level 2</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Unlocked after growth.</p>
              <ul className="text-gray-700 dark:text-gray-300 space-y-3">
                <li>✔ Send more than 1,000 messages</li>
              </ul>
            </div>
            {/* Level 3 */}
            <div className="bg-white dark:bg-gray-900  rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-300 mb-2">Level 3</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Enterprise scale.</p>
              <ul className="text-gray-700 dark:text-gray-300 space-y-3">
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
      <section id="usdt" className="relative z-10 px-6 py-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6">
              <Coins className="w-4 h-4" />
              USDT Top-Up
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-300 mb-4">
              Top up with USDT — ridiculously easy
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Fund your balance in minutes with <span className="font-semibold">USDT</span>, then start sending OTPs right away.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* left: steps */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-300">3 quick steps</h3>
              <ol className="space-y-5 text-left">
                <Step num="1" title="Generate your deposit address" desc="From your dashboard, choose your preferred USDT network." />
                <Step num="2" title="Send USDT" desc="Transfer any amount from your crypto wallet or exchange." />
                <Step num="3" title="Instant Credit" desc="Your account balance updates automatically after confirmation." />
              </ol>

              <div className="mt-8">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">Supported networks</div>
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
      <section className="relative z-10 px-6 py-24 dark:bg-gray-900 " id="pricing">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-300">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
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


    </div>
  );
}

/* -------------------------- Small reusable bits -------------------------- */


function FeatureCard({ icon, title, description, gradient }) {
  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
      <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl grid place-items-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300 mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
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
        <div className="font-semibold text-gray-900 dark:text-gray-300">{title}</div>
        <div className="text-gray-600 dark:text-gray-300 text-sm">{desc}</div>
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

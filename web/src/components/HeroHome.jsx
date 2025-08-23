
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    MessageSquare, Zap, Code, Shield, BarChart3, CheckCircle,
    ArrowRight, Sparkles, Users, Globe, Clock, Coins
} from 'lucide-react';
import useDataRefresh from '../hooks/useDataRefresh';
import { api } from '../lib/api';

const HeroHome = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [stats, setStats] = useState({ messages: 0, users: 0, uptime: 0 });
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
    return (<section className="relative z-10 px-6 pt-20 pb-32 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                    Trusted by 15,000+ developers worldwide
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.05]" data-aos="fade-up">
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent inline-block">
                        Lightning Fast
                    </span>
                    <br />
                    <span className="text-gray-900 dark:text-gray-300">OTP Delivery</span>
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                    Send and verify OTPs over WhatsApp with our blazing-fast API.
                    Enterprise-grade reliability, developer-friendly integration, and transparent pricing.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                >
                    <Link
                        to="/register"
                        className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl inline-flex items-center justify-center gap-2"
                        data-aos="fade-left"
                        data-aos-delay="300"
                    >
                        Start for Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        to="/demo"
                        className="px-8 py-4 border-2 border-blue-200 text-blue-700 rounded-xl font-semibold text-lg transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 inline-flex items-center justify-center gap-2"
                        data-aos="fade-right"
                        data-aos-delay="300"
                    >
                        <Code className="w-5 h-5" />
                        View Live Demo
                    </Link>
                </div>

                {/* live stats */}
                <div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
                    data-aos="fade-up"
                    data-aos-delay="400"
                >
                    <StatCard
                        icon={<MessageSquare className="w-8 h-8 text-blue-600" />}
                        value={stats.messages}
                        label="Messages Delivered"
                        delay={100}
                    />
                    <StatCard
                        icon={<Users className="w-8 h-8 text-indigo-600" />}
                        value={stats.users}
                        label="Active Developers"
                        delay={200}
                    />
                    <StatCard
                        icon={<Globe className="w-8 h-8 text-purple-600" />}
                        value={stats.uptime}
                        label="Uptime SLA"
                        suffix="%"
                        delay={300}
                    />
                </div>
            </div>
        </div>
    </section>);
}

export default HeroHome;
function StatCard({ icon, value, label }) {
    return (
        <div className="bg-white/80 dark:bg-gray-900 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center mb-3">{icon}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-1">{value}</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">{label}</div>
        </div>
    );
}
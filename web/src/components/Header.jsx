import React from 'react';
import {
    MessageSquare, Zap, Code, Shield, BarChart3, CheckCircle,
    ArrowRight, Sparkles, Users, Globe, Clock, Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';

const Header = () => {
    return (
        <nav className="sticky top-0 z-50 px-6 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-500 dark:via-blue-600 dark:to-indigo-600 rounded-2xl grid place-items-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/25">
                        <MessageSquare className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-400 dark:via-blue-500 dark:to-indigo-500 bg-clip-text text-transparent">
                        Codinovo
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {[
                        ['#features', 'Features'],
                        ['#levels', 'Levels'],
                        ['#usdt', 'USDT'],
                        ['#pricing', 'Pricing'],
                        ['/docs', 'Docs'],
                    ].map(([href, label]) => (
                        <a
                            key={href}
                            href={href.startsWith('/') ? href : href}
                            className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium text-sm lg:text-base group"
                        >
                            {label}
                            <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                        </a>
                    ))}

                    <DarkModeToggle />

                    <Link
                        to="/login"
                        className="px-6 py-2.5 rounded-xl border-2 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                    >
                        Login
                    </Link>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden flex items-center gap-4">
                    <DarkModeToggle />
                    <button className="p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Header;
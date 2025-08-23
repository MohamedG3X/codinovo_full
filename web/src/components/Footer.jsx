import React from 'react';
import {
    MessageSquare, Zap, Code, Shield, BarChart3, CheckCircle,
    ArrowRight, Sparkles, Users, Globe, Clock, Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const footerSections = [
        {
            title: "Product",
            links: [
                ['#features', 'Features'],
                ['#levels', 'Levels'],
                ['#usdt', 'USDT Top-Up'],
                ['/docs', 'Documentation'],
                // ['/api', 'API Reference']
            ]
        },
        {
            title: "Company",
            links: [
                ['/about', 'About Us'],
                ['/blog', 'Blog'],
                ['/careers', 'Careers'],
                // ['/news', 'News']
            ]
        },
        {
            title: "Support",
            links: [
                ['/help', 'Help Center'],
                ['/contact', 'Contact Us'],
                // ['/status', 'System Status'],
                ['/faq', 'FAQ'],
                // ['/tutorials', 'Tutorials']
            ]
        },
        {
            title: "Legal",
            links: [
                ['/privacy', 'Privacy Policy'],
                ['/terms', 'Terms of Service'],
                ['/security', 'Security'],
                // ['/cookies', 'Cookie Policy'],
                // ['/compliance', 'Compliance']
            ]
        }
    ];

    // const socialLinks = [
    //     { icon: Globe, href: '#', label: 'Website' },
    //     { icon: MessageSquare, href: '#', label: 'Discord' },
    //     { icon: Code, href: '#', label: 'GitHub' },
    //     { icon: Users, href: '#', label: 'Community' }
    // ];

    return (
        <footer className="bg-gray-900 dark:bg-gray-950 text-white transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
                    <div className="flex items-center gap-4 mb-6 lg:mb-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-2xl grid place-items-center shadow-lg">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-white">Codinovo</span>
                            <p className="text-gray-400 text-sm">Building the future of technology</p>
                        </div>
                    </div>

                    {/* Social Links */}
                    {/* <div className="flex items-center gap-3">
                        {socialLinks.map(({ icon: Icon, href, label }) => (
                            <a
                                key={label}
                                href={href}
                                className="w-12 h-12 rounded-2xl bg-gray-800 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200 hover:scale-110 group"
                                title={label}
                            >
                                <Icon className="w-5 h-5" />
                            </a>
                        ))}
                    </div> */}
                </div>

                {/* Links Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {footerSections.map((section) => (
                        <FooterSection key={section.title} {...section} />
                    ))}
                </div>

                {/* Newsletter */}
                {/* <div className="bg-gray-800 dark:bg-gray-900 rounded-2xl p-8 mb-12">
                    <div className="max-w-md">
                        <h3 className="text-xl font-bold text-white mb-2">Stay Updated</h3>
                        <p className="text-gray-400 mb-4">Get the latest updates and news delivered to your inbox.</p>
                        <div className="flex gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-2.5 bg-gray-700 dark:bg-gray-800 text-white placeholder-gray-400 rounded-xl border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                            />
                            <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div> */}

                {/* Bottom */}
                <div className="border-t border-gray-800 dark:border-gray-700 pt-8 text-center">
                    <p className="text-gray-400 dark:text-gray-500">
                        &copy; {new Date().getFullYear()} Codinovo. All rights reserved.
                        <span className="mx-2">•</span>
                        Built with for developers worldwide.
                    </p>
                </div>
            </div>
        </footer>
    );
};

const FooterSection = ({ title, links }) => {
    return (
        <div>
            <h4 className="font-bold text-lg text-white mb-6 relative">
                {title}
                <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></span>
            </h4>
            <ul className="space-y-3">
                {links.map(([href, label]) => (
                    <li key={href}>
                        {href.startsWith('#') ? (
                            <a
                                href={href}
                                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium hover:translate-x-1 transform inline-block"
                            >
                                {label}
                            </a>
                        ) : (
                            <Link
                                to={href}
                                className="text-gray-400 hover:text-white transition-all duration-200 text-sm font-medium hover:translate-x-1 transform inline-block"
                            >
                                {label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Footer;
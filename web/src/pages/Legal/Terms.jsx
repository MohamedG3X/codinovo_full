import React, { useState } from 'react';
import {
    FileText,
    Users,
    CreditCard,
    AlertTriangle,
    Scale,
    Shield,
    Globe,
    Mail,
    Calendar
} from 'lucide-react';

const Terms = () => {
    const [activeSection, setActiveSection] = useState('');

    const sections = [
        { id: 'acceptance', title: 'Acceptance of Terms', icon: FileText },
        { id: 'services', title: 'Description of Services', icon: Globe },
        { id: 'accounts', title: 'User Accounts', icon: Users },
        { id: 'conduct', title: 'User Conduct', icon: Shield },
        { id: 'payment', title: 'Payment Terms', icon: CreditCard },
        { id: 'intellectual', title: 'Intellectual Property', icon: Scale },
        { id: 'termination', title: 'Termination', icon: AlertTriangle },
        { id: 'contact', title: 'Contact Information', icon: Mail }
    ];

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                            <Scale className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Terms of Service
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                            Legal terms and conditions for using our services
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Effective Date: January 15, 2024
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Table of Contents */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-8">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Table of Contents
                            </h3>
                            <nav className="space-y-2">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all ${activeSection === section.id
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4 mr-3" />
                                            <span className="text-sm">{section.title}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="p-8 space-y-8">

                                {/* Acceptance of Terms */}
                                <section id="acceptance" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acceptance of Terms</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                        By accessing and using our services, you agree to comply with these Terms of Service.
                                    </p>
                                </section>

                                {/* Description of Services */}
                                <section id="services" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Description of Services</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        We provide secure OTP services, APIs, dashboards, and analytics tools to help manage your authentication processes.
                                    </p>
                                </section>

                                {/* User Accounts */}
                                <section id="accounts" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Accounts</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        You are responsible for maintaining the confidentiality of your account and ensuring all information provided is accurate.
                                    </p>
                                </section>

                                {/* User Conduct */}
                                <section id="conduct" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Conduct</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        You agree not to misuse our services or use them for unlawful purposes, including spamming or unauthorized data access.
                                    </p>
                                </section>

                                {/* Payment Terms */}
                                <section id="payment" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Terms</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        Some services require payment. All payments are securely processed and are non-refundable unless otherwise stated.
                                    </p>
                                </section>

                                {/* Intellectual Property */}
                                <section id="intellectual" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Intellectual Property</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        All content, trademarks, and services provided remain the property of our company unless otherwise stated.
                                    </p>
                                </section>

                                {/* Termination */}
                                <section id="termination" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Termination</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        We reserve the right to suspend or terminate your account if you violate these terms or misuse our services.
                                    </p>
                                </section>

                                {/* Contact Information */}
                                <section id="contact" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Information</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        For any inquiries, please reach out to us at:{" "}
                                        <a
                                            href="mailto:support@yourcompany.com"
                                            className="text-blue-600 dark:text-blue-400 underline"
                                        >
                                            support@yourcompany.com
                                        </a>
                                    </p>
                                </section>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms;

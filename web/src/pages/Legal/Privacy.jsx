import React, { useState } from 'react';
import { Shield, Eye, Lock, Users, Globe, FileText, Calendar, Mail } from 'lucide-react';

const Privacy = () => {
    const [activeSection, setActiveSection] = useState('');

    const sections = [
        { id: 'overview', title: 'Privacy Overview', icon: Eye },
        { id: 'collection', title: 'Information We Collect', icon: FileText },
        { id: 'usage', title: 'How We Use Information', icon: Users },
        { id: 'sharing', title: 'Information Sharing', icon: Globe },
        { id: 'security', title: 'Data Security', icon: Lock },
        { id: 'rights', title: 'Your Rights', icon: Shield },
        { id: 'cookies', title: 'Cookies & Tracking', icon: Globe },
        { id: 'contact', title: 'Contact Us', icon: Mail }
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
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                            <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                            Your privacy is important to us
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Last updated: January 15, 2024
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
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
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

                                {/* Overview Section */}
                                <section id="overview" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Eye className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Overview</h2>
                                    </div>
                                    <div className="prose prose-gray dark:prose-invert max-w-none">
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                            At our company, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
                                        </p>
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Key Points:</h4>
                                            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                                <li>• We only collect information necessary to provide our services</li>
                                                <li>• We never sell your personal data to third parties</li>
                                                <li>• You have full control over your data and privacy settings</li>
                                                <li>• We use industry-standard security measures to protect your information</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                {/* Information Collection */}
                                <section id="collection" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <FileText className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Information We Collect</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h4>
                                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                                We may collect personal information that you voluntarily provide to us, including:
                                            </p>
                                            <ul className="text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                                                <li>• Name and contact information (email, phone number, address)</li>
                                                <li>• Account credentials and profile information</li>
                                                <li>• Payment and billing information</li>
                                                <li>• Communications and support interactions</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Automatically Collected Information</h4>
                                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                                When you use our services, we automatically collect certain information:
                                            </p>
                                            <ul className="text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                                                <li>• Device and browser information</li>
                                                <li>• IP address and location data</li>
                                                <li>• Usage patterns and preferences</li>
                                                <li>• Log files and analytics data</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                {/* Usage Section */}
                                <section id="usage" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Users className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How We Use Information</h2>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Service Provision</h4>
                                            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                                <li>• Create and manage your account</li>
                                                <li>• Process transactions and payments</li>
                                                <li>• Provide customer support</li>
                                                <li>• Deliver requested services</li>
                                            </ul>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Improvement & Communication</h4>
                                            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                                <li>• Improve our services and user experience</li>
                                                <li>• Send important service updates</li>
                                                <li>• Conduct research and analytics</li>
                                                <li>• Prevent fraud and ensure security</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                {/* Information Sharing */}
                                <section id="sharing" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Globe className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Information Sharing</h2>
                                    </div>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                                            We do not sell, trade, or rent your personal information to third parties.
                                        </p>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        We may share your information only in the following limited circumstances:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">Service Providers</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Trusted third parties who help us operate our services</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">Legal Requirements</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">When required by law or to protect our rights</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">Business Transfers</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">In connection with mergers or acquisitions</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Data Security */}
                                <section id="security" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Lock className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Security</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        We implement comprehensive security measures to protect your personal information:
                                    </p>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Encryption</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">AES-256 encryption for data at rest and in transit</p>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <Shield className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Access Controls</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Strict access controls and authentication</p>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Monitoring</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">24/7 security monitoring and threat detection</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Your Rights */}
                                <section id="rights" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Privacy Rights</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        You have the following rights regarding your personal information:
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            { title: 'Access', description: 'Request a copy of your personal data' },
                                            { title: 'Correction', description: 'Update or correct inaccurate information' },
                                            { title: 'Deletion', description: 'Request deletion of your personal data' },
                                            { title: 'Portability', description: 'Export your data in a portable format' },
                                            { title: 'Opt-out', description: 'Unsubscribe from marketing communications' }
                                        ].map((right, index) => (
                                            <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{index + 1}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{right.title}</h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{right.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Cookies */}
                                <section id="cookies" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Globe className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cookies & Tracking</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        We use cookies and similar technologies to enhance your experience and analyze usage patterns.
                                    </p>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Cookie Categories:</h4>
                                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                            <li>• <strong>Essential:</strong> Required for basic site functionality</li>
                                            <li>• <strong>Analytics:</strong> Help us understand how you use our services</li>
                                            <li>• <strong>Preferences:</strong> Remember your settings and preferences</li>
                                            <li>• <strong>Marketing:</strong> Deliver relevant advertisements (with consent)</li>
                                        </ul>
                                    </div>
                                </section>

                                {/* Contact */}
                                <section id="contact" className="scroll-mt-8">
                                    <div className="flex items-center mb-4">
                                        <Mail className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Us</h2>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        If you have questions about this Privacy Policy or your personal data, please contact us:
                                    </p>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy Officer</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">privacy@company.com</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mailing Address</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    123 Privacy Street<br />
                                                    Suite 100<br />
                                                    City, State 12345
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
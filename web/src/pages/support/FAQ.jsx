import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle, Phone, Mail } from 'lucide-react';

const FAQ = () => {
    const [openItems, setOpenItems] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'All Questions' },
        { id: 'account', name: 'Account & Profile' },
        { id: 'billing', name: 'Billing & Payments' },
        { id: 'technical', name: 'Technical Support' },
        { id: 'security', name: 'Security & Privacy' },
        { id: 'features', name: 'Features & Usage' }
    ];

    const faqs = [
        {
            id: 1,
            category: 'account',
            question: 'How do I reset my password?',
            answer: 'To reset your password, click on the "Forgot Password" link on the login page. Enter your email address and we\'ll send you a secure link to create a new password. The reset link expires after 24 hours for security purposes.'
        },
        {
            id: 2,
            category: 'billing',
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. For enterprise customers, we also offer invoice-based billing with NET-30 terms.'
        },
        {
            id: 3,
            category: 'technical',
            question: 'Why am I experiencing slow loading times?',
            answer: 'Slow loading times can be caused by various factors including your internet connection, browser cache, or temporary server load. Try clearing your browser cache, using a different browser, or checking your internet speed. If the issue persists, contact our technical support team.'
        },
        {
            id: 4,
            category: 'security',
            question: 'How do I enable two-factor authentication?',
            answer: 'To enable 2FA, go to your Account Settings > Security. Click "Enable Two-Factor Authentication" and follow the setup wizard. You can use an authenticator app like Google Authenticator or receive codes via SMS. We strongly recommend using an authenticator app for better security.'
        },
        {
            id: 5,
            category: 'features',
            question: 'Can I export my data?',
            answer: 'Yes, you can export your data at any time. Go to Settings > Data Export and select the data you want to export. We support various formats including CSV, JSON, and PDF. Large exports may take some time to process and will be sent to your email when ready.'
        },
        {
            id: 6,
            category: 'account',
            question: 'How do I delete my account?',
            answer: 'To delete your account, go to Settings > Account > Delete Account. Please note that this action is irreversible and all your data will be permanently deleted. We recommend exporting your data before deletion if you need to keep any information.'
        },
        {
            id: 7,
            category: 'billing',
            question: 'Can I get a refund?',
            answer: 'We offer a 30-day money-back guarantee for all new subscriptions. To request a refund, contact our billing team within 30 days of your purchase. Refunds are processed within 5-7 business days to your original payment method.'
        },
        {
            id: 8,
            category: 'technical',
            question: 'Is there a mobile app available?',
            answer: 'Yes, we have mobile apps available for both iOS and Android devices. You can download them from the App Store or Google Play Store. The mobile apps include most of the features available in the web version, with some optimizations for mobile use.'
        },
        {
            id: 9,
            category: 'security',
            question: 'How is my data protected?',
            answer: 'We use industry-standard encryption (AES-256) to protect your data both in transit and at rest. Our servers are hosted in secure data centers with 24/7 monitoring. We also conduct regular security audits and penetration testing to ensure your data remains safe.'
        },
        {
            id: 10,
            category: 'features',
            question: 'What are the usage limits?',
            answer: 'Usage limits vary by subscription plan. Free accounts have basic limits on storage and features. Paid plans offer increased limits or unlimited usage in many areas. You can view your current usage and limits in your account dashboard under the Usage section.'
        }
    ];

    const toggleItem = (id) => {
        setOpenItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        const matchesSearch = searchQuery === '' ||
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                            <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                            Find quick answers to common questions
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search FAQ..."
                                className="w-full pl-12 pr-4 py-4 text-lg bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Categories
                            </h3>
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-all ${selectedCategory === category.id
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Still Need Help */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Still Need Help?
                            </h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all">
                                    <MessageCircle className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900 dark:text-white">Live Chat</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Get instant help</div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all">
                                    <Mail className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900 dark:text-white">Email Support</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">We'll respond soon</div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all">
                                    <Phone className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900 dark:text-white">Phone Support</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Call us directly</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Content */}
                    <div className="lg:col-span-3">
                        <div className="space-y-4">
                            {filteredFaqs.length === 0 ? (
                                <div className="text-center py-12">
                                    <HelpCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        No questions found
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Try adjusting your search terms or selecting a different category.
                                    </p>
                                </div>
                            ) : (
                                filteredFaqs.map((faq) => (
                                    <div
                                        key={faq.id}
                                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleItem(faq.id)}
                                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                                                {faq.question}
                                            </h3>
                                            {openItems[faq.id] ? (
                                                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                            )}
                                        </button>
                                        {openItems[faq.id] && (
                                            <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                                                <div className="pt-4">
                                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                        {faq.answer}
                                                    </p>
                                                    <div className="mt-3">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                                            {categories.find(cat => cat.id === faq.category)?.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {filteredFaqs.length > 0 && (
                            <div className="mt-12 text-center">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                        Didn't find what you're looking for?
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                                        Our support team is here to help you with any questions or issues you may have.
                                    </p>
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
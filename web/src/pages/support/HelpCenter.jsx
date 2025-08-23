import React, { useState } from 'react';
import { Search, HelpCircle, Book, MessageCircle, Phone, Mail, Video, FileText, ChevronRight, Star } from 'lucide-react';

const HelpCenter = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'All Topics', icon: HelpCircle },
        { id: 'account', name: 'Account & Profile', icon: FileText },
        { id: 'billing', name: 'Billing & Payments', icon: MessageCircle },
        { id: 'technical', name: 'Technical Support', icon: Book },
        { id: 'security', name: 'Security & Privacy', icon: Phone }
    ];

    const popularArticles = [
        { title: 'How to reset your password', category: 'account', views: '2.3k' },
        { title: 'Setting up two-factor authentication', category: 'security', views: '1.8k' },
        { title: 'Understanding your billing cycle', category: 'billing', views: '1.5k' },
        { title: 'Troubleshooting login issues', category: 'technical', views: '1.2k' }
    ];

    const quickActions = [
        { title: 'Live Chat', description: 'Get instant help from our support team', icon: MessageCircle, available: true },
        { title: 'Phone Support', description: 'Call us for urgent assistance', icon: Phone, available: true },
        { title: 'Email Support', description: 'Send us a detailed message', icon: Mail, available: true },
        { title: 'Video Tutorials', description: 'Watch step-by-step guides', icon: Video, available: true }
    ];

    const guides = [
        { title: 'Complete Setup Guide', description: 'Everything you need to know to get started', time: '5 min read' },
        { title: 'Best Practices & Tips', description: 'Optimize your experience with expert recommendations', time: '8 min read' },
        { title: 'Advanced Features', description: 'Unlock the full potential of our platform', time: '12 min read' },
        { title: 'Troubleshooting Common Issues', description: 'Quick solutions to frequent problems', time: '6 min read' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Help Center
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                            Find answers to your questions and get the help you need
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for help articles..."
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
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={`w-full flex items-center px-3 py-2 rounded-lg transition-all ${selectedCategory === category.id
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 mr-3" />
                                            <span className="text-left">{category.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Need More Help?
                            </h3>
                            <div className="space-y-3">
                                {quickActions.map((action, index) => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={index}
                                            className="w-full flex items-center p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
                                        >
                                            <Icon className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                                            <div className="text-left">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {action.title}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {action.description}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Popular Articles */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Popular Articles
                                </h2>
                                <Star className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                {popularArticles.map((article, index) => (
                                    <div
                                        key={index}
                                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                    {article.title}
                                                </h3>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                                        {article.category}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {article.views} views
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 ml-2 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Featured Guides */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Getting Started Guides
                            </h2>
                            <div className="space-y-4">
                                {guides.map((guide, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                    >
                                        <Book className="w-8 h-8 mr-4 text-blue-600 dark:text-blue-400" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                {guide.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {guide.description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {guide.time}
                                            </span>
                                            <ChevronRight className="w-5 h-5 ml-2 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
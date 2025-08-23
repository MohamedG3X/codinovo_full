import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight, MessageSquare, Shield, Zap, Globe } from 'lucide-react';

const Blog = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'All Posts', count: 12 },
        { id: 'security', name: 'Security', count: 4 },
        { id: 'integration', name: 'Integration', count: 3 },
        { id: 'best-practices', name: 'Best Practices', count: 5 }
    ];

    const blogPosts = [
        {
            id: 1,
            title: 'The Complete Guide to OTP Security in 2025',
            excerpt: 'Learn how to implement secure OTP systems that protect your users from fraud while maintaining excellent user experience.',
            author: 'Sarah Johnson',
            date: '2025-01-15',
            readTime: '8 min read',
            category: 'security',
            image: '🔐',
            tags: ['Security', 'OTP', 'Authentication']
        },
        {
            id: 2,
            title: 'WhatsApp OTP Integration: A Developer\'s Guide',
            excerpt: 'Step-by-step tutorial on integrating WhatsApp OTP delivery into your application with our simple API.',
            author: 'Mike Chen',
            date: '2025-01-12',
            readTime: '6 min read',
            category: 'integration',
            image: '💬',
            tags: ['WhatsApp', 'API', 'Integration']
        },
        {
            id: 3,
            title: 'OTP Best Practices: Rate Limiting and Fraud Prevention',
            excerpt: 'Protect your application from OTP abuse with smart rate limiting, fraud detection, and user behavior analysis.',
            author: 'Alex Rivera',
            date: '2025-01-10',
            readTime: '10 min read',
            category: 'best-practices',
            image: '🛡️',
            tags: ['Rate Limiting', 'Fraud Prevention', 'Security']
        },
        {
            id: 4,
            title: 'Global OTP Delivery: Challenges and Solutions',
            excerpt: 'Understanding the complexities of delivering OTPs worldwide and how to ensure high delivery rates across different regions.',
            author: 'Emma Thompson',
            date: '2025-01-08',
            readTime: '7 min read',
            category: 'best-practices',
            image: '🌍',
            tags: ['Global', 'Delivery', 'Infrastructure']
        },
        {
            id: 5,
            title: 'Building Resilient OTP Systems with Fallback Strategies',
            excerpt: 'Design fault-tolerant OTP delivery systems with multiple channels and intelligent routing for maximum reliability.',
            author: 'David Park',
            date: '2025-01-05',
            readTime: '9 min read',
            category: 'integration',
            image: '⚡',
            tags: ['Reliability', 'Fallback', 'System Design']
        },
        {
            id: 6,
            title: 'The Psychology of OTP User Experience',
            excerpt: 'How to design OTP flows that users love while maintaining security. Insights from UX research and user testing.',
            author: 'Lisa Wang',
            date: '2025-01-03',
            readTime: '5 min read',
            category: 'best-practices',
            image: '🧠',
            tags: ['UX', 'Psychology', 'User Experience']
        }
    ];

    const filteredPosts = selectedCategory === 'all'
        ? blogPosts
        : blogPosts.filter(post => post.category === selectedCategory);

    const BlogCard = ({ post }) => (
        <article className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl dark:hover:shadow-gray-900/30">
            <div className="p-6">
                <div className="text-4xl mb-4 text-center">{post.image}</div>

                <div className="flex items-center gap-2 mb-3">
                    {post.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {post.excerpt}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.author}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readTime}
                        </div>
                    </div>
                </div>

                <Link
                    to={`/blog/${post.id}`}
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                    Read More
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </article>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-500 dark:to-indigo-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 rounded-full text-sm font-medium mb-6">
                            <MessageSquare className="w-4 h-4" />
                            OTP Insights & Updates
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Codinovo Blog
                        </h1>
                        <p className="text-xl text-blue-100 dark:text-blue-50 max-w-2xl mx-auto">
                            Stay updated with the latest insights, tutorials, and best practices for OTP delivery and authentication systems.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar */}
                    <aside className="lg:w-80">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700 p-6 sticky top-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Categories</h3>
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`w-full flex items-center justify-between px-4 py-2 rounded-xl font-medium transition-colors ${selectedCategory === category.id
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {category.name}
                                        <span className="text-sm opacity-60">{category.count}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Featured Topics */}
                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Featured Topics</h3>
                                <div className="space-y-3">
                                    {[
                                        { icon: Shield, title: 'OTP Security', posts: 8 },
                                        { icon: Zap, title: 'Fast Delivery', posts: 5 },
                                        { icon: Globe, title: 'Global Reach', posts: 6 }
                                    ].map((topic, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                <topic.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{topic.title}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{topic.posts} posts</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {selectedCategory === 'all' ? 'Latest Posts' : categories.find(c => c.id === selectedCategory)?.name}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {filteredPosts.map((post) => (
                                <BlogCard key={post.id} post={post} />
                            ))}
                        </div>

                        {/* Load More */}
                        <div className="text-center mt-12">
                            <button className="px-8 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors">
                                Load More Posts
                            </button>
                        </div>
                    </main>
                </div>
            </div>

            {/* Newsletter CTA */}
            {/* <section className="bg-white dark:bg-gray-800 py-16 transition-colors duration-300">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Stay in the Loop
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Get the latest OTP insights, tutorials, and product updates delivered to your inbox.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button className="px-6 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors">
                            Subscribe
                        </button>
                    </div>
                </div>
            </section> */}
        </div>
    );
};

export default Blog;
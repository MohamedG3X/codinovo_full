import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Users, CheckCircle } from 'lucide-react';

const Contact_us = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
        }, 2000);
    };

    const contactMethods = [
        {
            icon: Mail,
            title: 'Email Support',
            description: 'Get help via email within 24 hours',
            contact: 'support@company.com',
            availability: 'Response within 24 hours'
        },
        {
            icon: Phone,
            title: 'Phone Support',
            description: 'Speak directly with our support team',
            contact: '+1 (555) 123-4567',
            availability: 'Mon-Fri, 9 AM - 6 PM EST'
        },
        {
            icon: MessageCircle,
            title: 'Live Chat',
            description: 'Get instant help through live chat',
            contact: 'Available on website',
            availability: 'Mon-Fri, 9 AM - 6 PM EST'
        }
    ];

    const offices = [
        {
            city: 'New York',
            address: '123 Business Ave, Suite 100',
            phone: '+1 (555) 123-4567',
            timezone: 'EST'
        },
        {
            city: 'Los Angeles',
            address: '456 Tech Street, Floor 5',
            phone: '+1 (555) 987-6543',
            timezone: 'PST'
        },
        {
            city: 'London',
            address: '789 Innovation Road, Level 3',
            phone: '+44 20 1234 5678',
            timezone: 'GMT'
        }
    ];

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl text-center border border-gray-200 dark:border-gray-700">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Message Sent Successfully!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                    <button
                        onClick={() => setSubmitted(false)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Send Another Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Contact Us
                        </h1>
                        <p className="text-xl max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Contact Methods */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {contactMethods.map((method, index) => {
                        const Icon = method.icon;
                        return (
                            <div
                                key={index}
                                className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                                    <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {method.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-3">
                                    {method.description}
                                </p>
                                <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                                    {method.contact}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {method.availability}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            Send us a Message
                        </h2>

                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select a category</option>
                                    <option value="general">General Inquiry</option>
                                    <option value="support">Technical Support</option>
                                    <option value="billing">Billing & Payments</option>
                                    <option value="partnership">Partnership</option>
                                    <option value="feedback">Feedback</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    required
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="How can we help you?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Message *
                                </label>
                                <textarea
                                    name="message"
                                    required
                                    rows="5"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Please describe your inquiry in detail..."
                                ></textarea>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Office Locations */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <MapPin className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
                                Our Offices
                            </h3>
                            <div className="space-y-4">
                                {offices.map((office, index) => (
                                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            {office.city}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                            {office.address}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                            {office.phone}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {office.timezone}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Clock className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
                                Business Hours
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Monday - Friday:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">9:00 AM - 6:00 PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Saturday:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">10:00 AM - 4:00 PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Sunday:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">Closed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact_us;
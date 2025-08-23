import React from 'react'
import {
    CheckCircle,
    ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const IntegrationSection = () => {
    return (
        <section className="relative z-10 px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">

                {/* الجزء النصي */}
                <div className="text-center lg:text-left">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white dark:text-gray-300 mb-4 sm:mb-6">
                        Integration in Minutes
                    </h3>
                    <p className="text-base sm:text-lg text-blue-100 dark:text-gray-300 mb-6 sm:mb-8">
                        Clean, simple API that just works. No complex setup, no hidden gotchas.
                    </p>
                    <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 text-green-300 text-sm sm:text-base">
                        <li className="flex items-center gap-3 justify-center lg:justify-start">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" /> RESTful API with comprehensive docs
                        </li>
                        <li className="flex items-center gap-3 justify-center lg:justify-start">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" /> SDKs for popular languages
                        </li>
                        <li className="flex items-center gap-3 justify-center lg:justify-start">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" /> Webhook support for real-time updates
                        </li>
                    </ul>
                    <Link
                        to="/docs"
                        className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-gray-900
                         dark:text-gray-300 text-blue-900 rounded-lg font-semibold transition-all duration-300 hover:bg-blue-100 text-sm sm:text-base hover:dark:bg-gray-800"
                    >
                        View Documentation
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* الجزء الخاص بالكود */}
                <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700 shadow-lg">
                    {/* الهيدر */}
                    <div className="flex items-center gap-2 mb-4">
                        <Dot color="bg-red-500" />
                        <Dot color="bg-yellow-500" />
                        <Dot color="bg-green-500" />
                        <span className="text-gray-400 text-xs sm:text-sm ml-2">send-otp.js</span>
                    </div>

                    {/* صندوق الكود */}
                    <div className="relative w-full max-w-full rounded-xl bg-gray-900 border border-gray-700">
                        <div className="overflow-x-auto rounded-xl">
                            <pre className="text-xs sm:text-sm text-gray-300 p-3 sm:p-4 min-w-full">
                                {`// Send OTP
const r1 = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+1234567890', template: 'Your OTP is: {{code}}' })
});

// Verify OTP
const r2 = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+1234567890', code: '123456' })
});`}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default IntegrationSection;

// عنصر الدوائر الملونة
function Dot({ color }) {
    return <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${color} rounded-full`}></div>;
}

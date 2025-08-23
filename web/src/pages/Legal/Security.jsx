import React from "react";
import { ShieldCheck, Lock, Key, AlertTriangle } from "lucide-react";

const Security = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-6 md:px-20 py-12 transition-colors duration-300">
            {/* Header Section */}
            <div className="max-w-3xl mx-auto text-center mb-12">
                <div className="flex justify-center mb-4">
                    <ShieldCheck className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    Security & OTP Verification
                </h1>
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                    We take your account security seriously. Learn more about how we
                    protect your information and how to keep your account safe.
                </p>
            </div>

            {/* Security Features */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* OTP Verification */}
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 hover:shadow-lg transition duration-300">
                    <div className="flex items-center space-x-4 mb-4">
                        <Key className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            OTP Verification
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                        We send a One-Time Password (OTP) during registration and login to
                        ensure only you can access your account.
                    </p>
                </div>

                {/* Data Encryption */}
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 hover:shadow-lg transition duration-300">
                    <div className="flex items-center space-x-4 mb-4">
                        <Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Data Encryption
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                        All your data is encrypted using industry-standard encryption
                        methods, keeping it secure and private.
                    </p>
                </div>

                {/* Suspicious Login Alerts */}
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 hover:shadow-lg transition duration-300">
                    <div className="flex items-center space-x-4 mb-4">
                        <AlertTriangle className="w-8 h-8 text-yellow-500 dark:text-yellow-300" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Suspicious Login Alerts
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                        If we detect any unusual login attempts, you’ll be notified instantly
                        to take necessary actions.
                    </p>
                </div>
            </div>

            {/* Bottom Note */}
            <div className="max-w-3xl mx-auto text-center mt-16">
                <p className="text-gray-600 dark:text-gray-400">
                    For more details about our security measures, visit our{" "}
                    <a
                        href="/privacy-policy"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a
                        href="/terms"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Terms of Service
                    </a>
                    .
                </p>
            </div>
        </div>
    );
};

export default Security;

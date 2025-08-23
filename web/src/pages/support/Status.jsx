
import React, { useState } from 'react';
import { Server, CheckCircle, AlertTriangle, XCircle, Activity, Clock, Globe, Database, Shield, Wifi } from 'lucide-react';

const Status = () => {
    const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

    const overallStatus = 'operational'; // operational, degraded, outage

    const services = [
        {
            name: 'API Services',
            status: 'operational',
            uptime: '99.9%',
            responseTime: '45ms',
            icon: Server,
            description: 'Core API endpoints and services'
        },
        {
            name: 'Web Application',
            status: 'operational',
            uptime: '100%',
            responseTime: '120ms',
            icon: Globe,
            description: 'Main web application platform'
        },
        {
            name: 'Database',
            status: 'operational',
            uptime: '99.8%',
            responseTime: '12ms',
            icon: Database,
            description: 'Primary database systems'
        },
        {
            name: 'Authentication',
            status: 'degraded',
            uptime: '98.5%',
            responseTime: '180ms',
            icon: Shield,
            description: 'User authentication services'
        },
        {
            name: 'CDN Network',
            status: 'operational',
            uptime: '99.9%',
            responseTime: '25ms',
            icon: Wifi,
            description: 'Content delivery network'
        },
        {
            name: 'Payment Processing',
            status: 'operational',
            uptime: '100%',
            responseTime: '95ms',
            icon: Activity,
            description: 'Payment and billing systems'
        }
    ];

    const incidents = [
        {
            id: 1,
            title: 'Increased Authentication Latency',
            status: 'investigating',
            severity: 'minor',
            startTime: '2 hours ago',
            description: 'Some users may experience slower login times.',
            updates: [
                { time: '2 hours ago', message: 'We are investigating reports of increased authentication latency.' },
                { time: '1 hour ago', message: 'Issue identified in authentication service. Working on a fix.' }
            ]
        },
        {
            id: 2,
            title: 'Scheduled Maintenance - Database Optimization',
            status: 'scheduled',
            severity: 'maintenance',
            startTime: 'Tomorrow at 2:00 AM EST',
            description: 'Planned database maintenance to improve performance.',
            updates: [
                { time: '1 day ago', message: 'Scheduled maintenance window announced.' }
            ]
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'operational':
                return 'text-green-600 dark:text-green-400';
            case 'degraded':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'outage':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'operational':
                return CheckCircle;
            case 'degraded':
                return AlertTriangle;
            case 'outage':
                return XCircle;
            default:
                return CheckCircle;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'operational':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
            case 'degraded':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
            case 'outage':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            System Status
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                            All systems operational
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Last updated: {new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Current Status */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Service Status
                    </h2>
                    <div className="grid gap-4">
                        {services.map((service, index) => {
                            const Icon = service.icon;
                            const StatusIcon = getStatusIcon(service.status);

                            return (
                                <div
                                    key={index}
                                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Icon className="w-8 h-8 text-gray-600 dark:text-gray-400 mr-4" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {service.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {service.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">Uptime</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{service.uptime}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">Response</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{service.responseTime}</div>
                                            </div>
                                            <div className="flex items-center">
                                                <StatusIcon className={`w-5 h-5 mr-2 ${getStatusColor(service.status)}`} />
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(service.status)}`}>
                                                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            );
                            export default Status;
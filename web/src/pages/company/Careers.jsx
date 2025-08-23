import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    MapPin, Clock, DollarSign, Users, Zap, Code,
    Shield, Globe, Heart, Coffee, Briefcase, ArrowRight
} from 'lucide-react';

const Careers = () => {
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const departments = [
        { id: 'all', name: 'All Positions', count: 8 },
        { id: 'engineering', name: 'Engineering', count: 4 },
        { id: 'product', name: 'Product', count: 2 },
        { id: 'sales', name: 'Sales & Marketing', count: 2 }
    ];

    const jobOpenings = [
        {
            id: 1,
            title: 'Senior Backend Engineer',
            department: 'engineering',
            location: 'Remote / San Francisco',
            type: 'Full-time',
            salary: '$120k - $180k',
            description: 'Build and scale our OTP delivery infrastructure handling millions of messages daily.',
            requirements: ['5+ years backend experience', 'Go/Python/Node.js', 'Distributed systems', 'Message queues'],
            posted: '2 days ago'
        },
        {
            id: 2,
            title: 'Frontend Engineer',
            department: 'engineering',
            location: 'Remote / New York',
            type: 'Full-time',
            salary: '$100k - $150k',
            description: 'Create beautiful, intuitive dashboards and developer tools for our OTP platform.',
            requirements: ['React/Vue.js expertise', 'TypeScript', 'API integration', 'UI/UX sensibility'],
            posted: '1 week ago'
        },
        {
            id: 3,
            title: 'DevOps Engineer',
            department: 'engineering',
            location: 'Remote / London',
            type: 'Full-time',
            salary: '$110k - $160k',
            description: 'Ensure 99.9% uptime for our global OTP delivery infrastructure.',
            requirements: ['Kubernetes/Docker', 'AWS/GCP', 'Monitoring tools', 'Infrastructure as code'],
            posted: '3 days ago'
        },
        {
            id: 4,
            title: 'Product Manager',
            department: 'product',
            location: 'San Francisco',
            type: 'Full-time',
            salary: '$130k - $180k',
            description: 'Shape the future of OTP authentication and drive product strategy.',
            requirements: ['5+ years PM experience', 'API products', 'Developer tools', 'Technical background'],
            posted: '1 week ago'
        },
        {
            id: 5,
            title: 'Security Engineer',
            department: 'engineering',
            location: 'Remote',
            type: 'Full-time',
            salary: '$140k - $200k',
            description: 'Protect our platform and customers from fraud and security threats.',
            requirements: ['Security expertise', 'Threat modeling', 'Incident response', 'Compliance'],
            posted: '4 days ago'
        },
        {
            id: 6,
            title: 'Growth Marketing Manager',
            department: 'sales',
            location: 'Remote / Austin',
            type: 'Full-time',
            salary: '$90k - $130k',
            description: 'Drive developer adoption and grow our community of OTP users.',
            requirements: ['B2B SaaS marketing', 'Developer marketing', 'Content strategy', 'Analytics'],
            posted: '1 week ago'
        }
    ];

    const benefits = [
        {
            icon: Heart,
            title: 'Health & Wellness',
            description: 'Comprehensive health insurance and wellness programs'
        },
        {
            icon: Coffee,
            title: 'Flexible Work',
            description: 'Remote-first culture with flexible working hours'
        },
        {
            icon: Zap,
            title: 'Growth & Learning',
            description: '$2,000 annual learning budget and conference attendance'
        },
        {
            icon: Users,
            title: 'Team Retreats',
            description: 'Quarterly team retreats and company-wide gatherings'
        },
        {
            icon: DollarSign,
            title: 'Equity & Bonuses',
            description: 'Competitive equity package and performance bonuses'
        },
        {
            icon: Globe,
            title: 'Global Impact',
            description: 'Work on technology used by millions of users worldwide'
        }
    ];

    const filteredJobs = selectedDepartment === 'all'
        ? jobOpenings
        : jobOpenings.filter(job => job.department === selectedDepartment);

    const JobCard = ({ job }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl dark:hover:shadow-gray-900/30 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {job.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.type}
                        </div>
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                        </div>
                    </div>
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                    {job.posted}
                </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
                {job.description}
            </p>

            <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Requirements:</h4>
                <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                            {req}
                        </span>
                    ))}
                </div>
            </div>

            <Link
                to={`/careers/${job.id}/apply`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 group"
            >
                Apply Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-500 dark:to-indigo-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 rounded-full text-sm font-medium mb-6">
                            <Briefcase className="w-4 h-4" />
                            Join Our Mission
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Build the Future of OTP
                        </h1>
                        <p className="text-xl text-blue-100 dark:text-blue-50 max-w-2xl mx-auto mb-8">
                            Join our team of passionate engineers and help us deliver billions of OTP messages reliably and securely worldwide.
                        </p>
                        <div className="flex items-center justify-center gap-8 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                <span>50+ Team Members</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                <span>Remote-First</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                <span>Fast-Growing</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Join Us */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Why Join Codinovo?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            We're building critical infrastructure that millions depend on. Join us and make a real impact.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:scale-105">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                                    <benefit.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {benefit.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Job Openings */}
            {/* <section className="py-16 bg-white dark:bg-gray-800 transition-colors duration-300"> */}
            {/* <div className="max-w-7xl mx-auto px-6"> */}
            {/* <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Open Positions
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Find your perfect role and help us scale OTP delivery worldwide.
                        </p>
                    </div> */}

            {/* <div className="flex flex-col lg:flex-row gap-12"> */}
            {/* Department Filter */}
            {/* <aside className="lg:w-80">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 sticky top-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Departments</h3>
                                <div className="space-y-2">
                                    {departments.map((dept) => (
                                        <button
                                            key={dept.id}
                                            onClick={() => setSelectedDepartment(dept.id)}
                                            className={`w-full flex items-center justify-between px-4 py-2 rounded-xl font-medium transition-colors ${selectedDepartment === dept.id
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {dept.name}
                                            <span className="text-sm opacity-60">{dept.count}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Company Stats */}
            {/* <div className="mt-8">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Company Stats</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-300">Messages/Month</span>
                                            <span className="font-bold text-gray-900 dark:text-white">500M+</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-300">Countries</span>
                                            <span className="font-bold text-gray-900 dark:text-white">180+</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-300">Uptime</span>
                                            <span className="font-bold text-gray-900 dark:text-white">99.9%</span>
                                        </div>
                                    </div>
                                </div> */}
            {/* </div>
                        </aside> */}

            {/* Job Listings */}
            {/* <main className="flex-1">
                            <div className="space-y-6">
                                {filteredJobs.map((job) => (
                                    <JobCard key={job.id} job={job} />
                                ))}
                            </div>

                            {filteredJobs.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                                        No positions found in this department.
                                    </div>
                                    <button
                                        onClick={() => setSelectedDepartment('all')}
                                        className="text-blue-600 dark:text-blue-400 font-medium"
                                    >
                                        View all positions
                                    </button>
                                </div>
                            )}
                        </main> */}
            {/* </div>
                </div>
            </section> */}

            {/* CTA Section */}
            {/* <section className="py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Don't See Your Role?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        We're always looking for talented individuals to join our team. Send us your resume and let's talk about how you can contribute to the future of OTP delivery.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                    >
                        Get in Touch
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section> */}
        </div>
    );
}

export default Careers;





import React from 'react';
import CodinovoLogo from '../assets/Codinovo_Logo.png';

const HeroAbout = () => {
    return (
        <div
            className="relative w-full h-[350px] bg-cover bg-center"
            style={{
                backgroundImage: `url(${CodinovoLogo})`,
            }}
        >
            {/* Light Mode Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/20 dark:hidden"></div>

            {/* Dark Mode Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/30 hidden dark:block"></div>

            {/* Content Container */}
            <div className="absolute inset-0 flex items-start pt-16 pl-10">
                <style jsx>{`
                    @media (max-width: 1024px) {
                        .background-solid-light {
                            background: rgba(255, 255, 255, 0.05);
                        }
                        .background-solid-dark {
                            background: rgba(17, 24, 39, 0.92);
                        }
                    }
                `}</style>

                <div className="absolute inset-0 flex items-start pt-16 pl-10 background-solid-light dark:background-solid-dark lg:bg-transparent lg:dark:bg-transparent">
                    <div className="max-w-xl lg:ml-20">
                        <h1 className="text-4xl lg:text-5xl font-bold border-l-4 border-blue-600 dark:border-blue-400 pl-3 text-gray-900 dark:text-white transition-all duration-300">
                            ABOUT US
                        </h1>
                        <p className="mt-4 text-lg lg:text-xl text-gray-700 dark:text-gray-200 leading-relaxed transition-colors duration-300">
                            Our Journey establishing the name, crafting quality & Excellence
                            Since <span className="font-bold text-blue-700 dark:text-blue-400">2025</span> — Showcasing
                            Dedication, Innovation, and Expertise
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroAbout;
import React from "react";
import CodinovoLogo from "../../assets/Codinovo_Logo.png";
import HeroAbout from "../../components/HeroAbout";

const About = () => {
    const aboutData = [
        {
            title: "Our Vision",
            description: "We envision a world where technology seamlessly integrates with human creativity to solve complex problems. Our passion drives us to build innovative software solutions that empower businesses to reach their full potential.",
            icon: "1"
        },
        {
            title: "Our Mission",
            description: "To deliver exceptional user experiences through cutting-edge technology and innovative solutions. We focus on creating products that make a real difference in people's lives while maintaining the highest standards of quality.",
            icon: "2"
        },
        {
            title: "Our Values",
            description: "Excellence, innovation, and integrity form the foundation of everything we do. We believe in building lasting relationships through trust, transparency, and outstanding service that exceeds expectations.",
            icon: "3"
        }
    ];

    return (
        <>
            <HeroAbout />
            <div className="p-6 lg:px-8 lg:py-12 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                <div className="lg:flex lg:items-center lg:justify-between lg:max-w-6xl lg:mx-auto gap-12">
                    {/* Image */}
                    <div className="w-full flex justify-center lg:justify-start lg:pr-8">
                        <div className="relative">
                            <img
                                data-aos="zoom-in"
                                data-aos-delay="100"
                                className="w-80 h-80 lg:w-96 lg:h-96 rounded-2xl shadow-2xl dark:shadow-gray-800/30 object-cover border-4 border-white dark:border-gray-700 transition-all duration-300 hover:scale-105"
                                src={CodinovoLogo}
                                alt="Codinovo Logo"
                            />
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl opacity-20 dark:opacity-30"></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full max-w-2xl mt-8 lg:mt-0 lg:pl-8">
                        {aboutData.map((item, index) => (
                            <div
                                key={index}
                                data-aos="fade-left"
                                data-aos-delay={(index + 1) * 200}
                                className="flex items-start mb-8 lg:mb-12 relative group"
                            >
                                <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/30 text-2xl font-bold z-10 border-2 border-blue-100 dark:border-blue-800 transition-all duration-300 group-hover:scale-110 group-hover:border-blue-300 dark:group-hover:border-blue-600">
                                    <span className="text-blue-600 dark:text-blue-400">{item.icon}</span>
                                </div>
                                {index < aboutData.length - 1 && (
                                    <div className="absolute left-7 top-16 h-20 border-l-2 border-dashed border-blue-200 dark:border-blue-800 z-0 transition-colors duration-300"></div>
                                )}
                                <div className="ml-6 flex-1">
                                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base lg:text-lg transition-colors duration-300">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default About;
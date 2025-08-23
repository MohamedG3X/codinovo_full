import { Moon, Sun } from "lucide-react";
import React, { useEffect, useState } from "react";

const DarkModeToggle = () => {
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark"
    );

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    return (
        <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-black dark:text-white transition-all"
        >
            {darkMode ? <Sun /> : <Moon />}
        </button>
    );
};

export default DarkModeToggle;

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, ChartBar, Sun, Moon } from "@phosphor-icons/react";
import { useState, useEffect } from "react";

const navItems = [
    { href: "/", label: "Sales", icon: ShoppingCart },
    { href: "/products", label: "Stock", icon: Package },
    { href: "/reports", label: "Reports", icon: ChartBar },
];

export default function BottomNav() {
    const pathname = usePathname();
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved) {
            setIsDark(saved === "dark");
        }
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.remove("light");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.add("light");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`bottom-nav-item ${isActive ? "active" : ""}`}
                    >
                        <item.icon size={22} weight={isActive ? "fill" : "regular"} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
            <button
                onClick={toggleTheme}
                className="bottom-nav-item"
                aria-label="Toggle theme"
            >
                {isDark ? <Sun size={22} /> : <Moon size={22} />}
                <span>{isDark ? "Light" : "Dark"}</span>
            </button>
        </nav>
    );
}

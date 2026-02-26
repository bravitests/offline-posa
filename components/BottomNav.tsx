"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, ChartBar, User } from "@phosphor-icons/react";

const navItems = [
    { href: "/", label: "Sales", icon: ShoppingCart },
    { href: "/products", label: "Stock", icon: Package },
    { href: "/reports", label: "Reports", icon: ChartBar },
    { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();

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
        </nav>
    );
}

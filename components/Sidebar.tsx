"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, ChartBar } from "@phosphor-icons/react";
import SyncBadge from "./SyncBadge";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { href: "/", label: "Sales", icon: ShoppingCart },
  { href: "/products", label: "Inventory", icon: Package },
  { href: "/reports", label: "Analytics", icon: ChartBar },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">POS</div>
        <div>
          <div className="sidebar-logo-text">Offline-First</div>
          <div className="sidebar-logo-sub">Point of Sale</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <item.icon size={20} weight={isActive ? "fill" : "regular"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle />
        <SyncBadge />
      </div>
    </aside>
  );
}

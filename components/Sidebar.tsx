"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, Package, ChartBar, SignOut, User } from "@phosphor-icons/react";
import SyncBadge from "./SyncBadge";

const navItems = [
  { href: "/", label: "Sales", icon: ShoppingCart },
  { href: "/products", label: "Inventory", icon: Package },
  { href: "/reports", label: "Analytics", icon: ChartBar },
];

/**
 * Client-side sidebar UI with navigation, user display, and logout handling.
 *
 * Loads the current user from localStorage on mount, highlights the active navigation
 * item based on the current pathname, and clears localStorage then navigates to
 * "/login" when logout is invoked.
 *
 * @returns The sidebar JSX element containing branding, navigation links, a sync badge,
 * and the logged-in user's display with a logout button.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("user");
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Image src="/logo.png" alt="Baobab" width={40} height={40} className="sidebar-logo-image" />
        <div>
          <div className="sidebar-logo-text">Baobab</div>
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
        <SyncBadge />
        {user && (
          <>
            <div className="sidebar-user">
              <div className="sidebar-user-icon">
                <User size={18} weight="bold" />
              </div>
              <div className="sidebar-user-name">{user.fullName}</div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout}>
              <SignOut size={18} />
              Logout
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { ShoppingCart } from "@phosphor-icons/react";
import { Toaster } from "react-hot-toast";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import ThemeToggle from "./ThemeToggle";

/**
 * Wraps page content with the application's shell, conditionally omitting chrome for authentication routes.
 *
 * Renders `children` directly when the current pathname is "/login" or "/register"; otherwise renders the app layout
 * containing Sidebar, BottomNav, and a main content area that wraps `children`.
 *
 * @param children - The page or UI content to render inside the shell
 * @returns A React element: either the raw `children` for auth routes or the full app shell containing `children`
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.includes(pathname);

  // Hide the cart button if not on the main POS page (e.g. products, reports)
  const isPosPage = pathname === "/";

  if (isAuthRoute) {
    return <>{children}</>;
  }

  const toggleCart = () => {
    window.dispatchEvent(new Event('toggleMobileCart'));
  };

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <div className="mobile-header-logo">
          <Image src="/logo.png" alt="Baobab" width={28} height={28} className="mobile-logo-image" />
          Baobab POS
        </div>
        <div className="mobile-header-actions">
          <ThemeToggle />
          {isPosPage && (
            <button className="mobile-cart-btn" onClick={toggleCart} aria-label="Toggle Cart">
              <ShoppingCart size={22} weight="bold" />
            </button>
          )}
        </div>
      </header>
      <Sidebar />
      <BottomNav />
      <main className="main-content">{children}</main>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: 'var(--surface-1)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          fontSize: '0.9rem',
          fontWeight: 500,
        },
        success: {
          iconTheme: {
            primary: 'var(--primary)',
            secondary: 'var(--text-inverse)',
          },
        },
      }} />
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

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

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <BottomNav />
      <main className="main-content">{children}</main>
    </div>
  );
}

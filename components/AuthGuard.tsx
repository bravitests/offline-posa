"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * AuthGuard - Client-side route protection for UX
 * 
 * SECURITY NOTE: This component uses localStorage for offline-first functionality.
 * It provides UI-level protection but is NOT secure against determined attackers.
 * 
 * For production:
 * - Keep this component for offline UX and client-side routing
 * - Add HTTP-only cookie validation in API routes (see SECURITY.md)
 * - Implement server middleware for additional route protection
 * - localStorage allows offline access to cached data (required for offline-first)
 * 
 * This is a known limitation documented in PR.md and SECURITY.md.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const publicRoutes = ["/login", "/register"];
    
    if (!user && !publicRoutes.includes(pathname)) {
      router.push("/login");
    } else if (user && publicRoutes.includes(pathname)) {
      router.push("/");
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [pathname, router]);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        background: "var(--bg)"
      }}>
        <div className="skeleton" style={{ width: 200, height: 40, borderRadius: "var(--r-md)" }} />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}

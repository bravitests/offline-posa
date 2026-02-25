"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Protects routes by checking for a "user" entry in localStorage, redirecting to login or home as needed, and conditionally rendering children.
 *
 * While the authentication check is in progress, renders a full-viewport loading skeleton. If authentication succeeds, renders the provided children; if not, renders nothing after redirects.
 *
 * @param children - The component tree to render when the user is authenticated
 * @returns The `children` when authenticated, a full-screen loading skeleton while checking authentication, or `null` if unauthenticated after redirects
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

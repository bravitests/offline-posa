"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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

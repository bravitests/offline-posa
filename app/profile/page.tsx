"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, SignOut } from "@phosphor-icons/react";
import SyncBadge from "@/components/SyncBadge";

export default function ProfilePage() {
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
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <div className="page-wrap profile-page">
            <div style={{ marginBottom: "1.75rem" }}>
                <h1 className="pos-page-title">Profile</h1>
                <p className="page-subtitle">Manage your account and settings.</p>
            </div>

            <div className="profile-card glass-card">
                <div className="profile-card-header">
                    <div className="profile-avatar">
                        <User size={40} weight="fill" />
                    </div>
                    <div className="profile-info">
                        <h2 className="profile-name">{user?.fullName || "Loading..."}</h2>
                        <p className="profile-role">Cashier</p>
                    </div>
                </div>

                <div className="profile-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <SyncBadge />
                    <button className="profile-logout-btn" onClick={handleLogout}>
                        <SignOut size={20} weight="bold" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

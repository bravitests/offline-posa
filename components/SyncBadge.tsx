"use client";

import { useEffect, useState, useRef } from "react";
import { CloudCheck, CloudArrowUp, CloudSlash, ArrowsClockwise } from "@phosphor-icons/react";
import { db } from "@/lib/db";

type SyncStatus = "synced" | "pending" | "syncing" | "offline";

const STATUS_CONFIG: Record<SyncStatus, { icon: any; color: string; text: (n: number) => string }> = {
    synced: { icon: CloudCheck, color: "var(--primary)", text: () => "All synced" },
    pending: { icon: CloudArrowUp, color: "var(--warning)", text: (n) => `${n} pending` },
    syncing: { icon: ArrowsClockwise, color: "var(--primary)", text: () => "Syncing…" },
    offline: { icon: CloudSlash, color: "var(--error)", text: () => "Offline" },
};

export default function SyncBadge() {
    const [status, setStatus] = useState<SyncStatus>("synced");
    const [pendingCount, setPendingCount] = useState(0);
    const updateTokenRef = useRef(0);

    useEffect(() => {
        const update = async () => {
            const currentToken = ++updateTokenRef.current;
            try {
                if (!navigator.onLine) { 
                    if (currentToken === updateTokenRef.current) setStatus("offline"); 
                    return; 
                }
                if (currentToken === updateTokenRef.current) setStatus("syncing");
                const count = await db.syncQueue.count();
                if (currentToken === updateTokenRef.current) {
                    setPendingCount(count);
                    setStatus(count > 0 ? "pending" : "synced");
                }
            } catch (error) {
                console.error("SyncBadge update error:", error);
                if (currentToken === updateTokenRef.current) setStatus("offline");
            }
        };

        const iv = setInterval(update, 3000);
        update();
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            clearInterval(iv);
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);

    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;

    return (
        <div className="sync-badge">
            <Icon
                size={16}
                style={{ color: cfg.color, flexShrink: 0 }}
                className={status === "syncing" ? "spin" : ""}
                weight="bold"
            />
            <span style={{ color: cfg.color }}>{cfg.text(pendingCount)}</span>
        </div>
    );
}

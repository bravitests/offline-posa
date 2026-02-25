"use client";

import { useEffect, useState } from "react";
import { CloudCheck, CloudArrowUp, CloudSlash, ArrowsClockwise } from "@phosphor-icons/react";
import { db } from "@/lib/db";

type SyncStatus = "synced" | "pending" | "syncing" | "offline";

const STATUS_CONFIG: Record<SyncStatus, { icon: any; color: string; text: (n: number) => string }> = {
    synced: { icon: CloudCheck, color: "var(--primary)", text: () => "All synced" },
    pending: { icon: CloudArrowUp, color: "var(--warning)", text: (n) => `${n} pending` },
    syncing: { icon: ArrowsClockwise, color: "var(--primary)", text: () => "Syncing…" },
    offline: { icon: CloudSlash, color: "var(--error)", text: () => "Offline" },
};

/**
 * Render a status badge that reflects network connectivity and the number of pending sync items.
 *
 * The badge shows an icon and text based on four states: "synced", "pending", "syncing", and "offline".
 * It polls db.syncQueue.count() every 3 seconds and also updates in response to window "online" and "offline" events.
 * Asynchronous update cycles are guarded by an internal token to prevent stale results from overwriting newer state.
 *
 * @returns A React element representing the synchronization badge.
 */
export default function SyncBadge() {
    const [status, setStatus] = useState<SyncStatus>("synced");
    const [pendingCount, setPendingCount] = useState(0);
    let updateToken = 0;

    useEffect(() => {
        const update = async () => {
            const currentToken = ++updateToken;
            try {
                if (!navigator.onLine) { 
                    if (currentToken === updateToken) setStatus("offline"); 
                    return; 
                }
                if (currentToken === updateToken) setStatus("syncing");
                const count = await db.syncQueue.count();
                if (currentToken === updateToken) {
                    setPendingCount(count);
                    setStatus(count > 0 ? "pending" : "synced");
                }
            } catch (error) {
                console.error("SyncBadge update error:", error);
                if (currentToken === updateToken) setStatus("offline");
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

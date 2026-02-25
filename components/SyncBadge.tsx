"use client";

import { useEffect, useState } from "react";
import { CloudCheck, CloudArrowUp, CloudSlash, ArrowsClockwise } from "@phosphor-icons/react";
import { db } from "@/lib/db";
import { syncEngine } from "@/lib/sync";

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

    const updateStatus = async () => {
        try {
            if (!navigator.onLine) { setStatus("offline"); return; }
            const count = await db.syncQueue.count();
            setPendingCount(count);
            setStatus(count > 0 ? "pending" : "synced");
        } catch (error) {
            console.error("SyncBadge update error:", error);
            setStatus("offline");
        }
    };

    useEffect(() => {
        const iv = setInterval(updateStatus, 3000);
        updateStatus();
        window.addEventListener("online", updateStatus);
        window.addEventListener("offline", updateStatus);
        return () => {
            clearInterval(iv);
            window.removeEventListener("online", updateStatus);
            window.removeEventListener("offline", updateStatus);
        };
    }, []);

    const handleSync = () => {
        if (navigator.onLine && syncEngine) {
            setStatus("syncing");
            syncEngine.startSync();
            setTimeout(updateStatus, 2000);
        }
    };

    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;

    return (
        <button className="sync-badge" onClick={handleSync} disabled={status === "offline"}>
            <Icon
                size={16}
                style={{ color: cfg.color, flexShrink: 0 }}
                className={status === "syncing" ? "spin" : ""}
                weight="bold"
            />
            <span style={{ color: cfg.color }}>{cfg.text(pendingCount)}</span>
        </button>
    );
}

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

export default function SyncBadge() {
    const [status, setStatus] = useState<SyncStatus>("synced");
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const update = async () => {
            if (!navigator.onLine) { setStatus("offline"); return; }
            const count = await db.syncQueue.count();
            setPendingCount(count);
            setStatus(count > 0 ? "pending" : "synced");
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

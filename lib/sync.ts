"use client";

import { db, type LocalProduct, type LocalSale, type SyncQueueItem } from "./db";
import { SYNC_INTERVALS, MAX_RETRIES, SYNC_ENDPOINTS } from "./constants";

class SyncEngine {
    private isProcessing = false;
    private syncTimeout: NodeJS.Timeout | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            window.addEventListener("online", () => this.startSync());
            // Start immediately
            this.startSync();
        }
    }

    public async startSync() {
        if (this.isProcessing || !navigator.onLine) return;
        await this.processQueue();
    }

    private async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const items = await db.syncQueue.orderBy("lastAttempt").toArray();

            for (const item of items) {
                if (!navigator.onLine) break;
                if (item.failed) continue; // Skip items that exceeded max retries

                const success = await this.syncItem(item);
                if (success) {
                    await db.syncQueue.delete(item.id);
                    // Mark sale as synced
                    if (item.type === "SALE") {
                        await db.sales.update(item.payload.id, { synced: true });
                    }
                } else {
                    // Increment retries and update lastAttempt
                    const nextRetry = item.retries + 1;
                    if (nextRetry >= MAX_RETRIES) {
                        console.error(`Max retries reached for sync item ${item.id}`);
                        await db.syncQueue.update(item.id, {
                            retries: nextRetry,
                            lastAttempt: Date.now(),
                            failed: true,
                        });
                        continue;
                    }
                    await db.syncQueue.update(item.id, {
                        retries: nextRetry,
                        lastAttempt: Date.now(),
                    });

                    // If a sync fails, we might want to wait according to backoff
                    const waitTime = SYNC_INTERVALS[Math.min(nextRetry, SYNC_INTERVALS.length - 1)];
                    console.log(`Sync failed, waiting ${waitTime}ms before next item...`);
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                }
            }

            // Also pull updates from server
            await this.pullUpdates();
        } catch (error) {
            console.error("Sync error:", error);
        } finally {
            this.isProcessing = false;
            // Schedule next check
            this.scheduleNext();
        }
    }

    private async syncItem(item: SyncQueueItem): Promise<boolean> {
        try {
            const endpoint = item.type === "SALE" ? SYNC_ENDPOINTS.SALES : `${SYNC_ENDPOINTS.PRODUCTS}/${item.payload.id}`;
            const method = item.type === "SALE" ? "POST" : "PUT";

            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item.payload),
            });

            if (response.ok) return true;

            if (response.status === 409) {
                const result = await response.json();
                console.warn("Conflict detected for", item.id, result);
                // Handle conflict: usually update local with server data and discard local edit
                // or let user decide. For POS, "last write wins" with version gating.
                if (item.type === "PRODUCT_UPDATE") {
                    await db.products.put({
                        ...result.serverData,
                        updatedAt: result.serverData.updatedAt ?? Date.now()
                    });
                    // Discard the failed update as it's stale
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error("Sync item error:", error, "Item:", item.id);
            return false;
        }
    }

    private async pullUpdates() {
        try {
            // Pull products
            const lastProductUpdate = await db.products.orderBy("updatedAt").last();
            const productTimestamp = lastProductUpdate?.updatedAt || 0;

            const prodRes = await fetch(`${SYNC_ENDPOINTS.PRODUCTS}?updatedAfter=${productTimestamp}`);
            if (prodRes.ok) {
                const newProducts: LocalProduct[] = await prodRes.json();
                if (newProducts.length > 0) {
                    await db.products.bulkPut(newProducts.map(p => ({
                        ...p,
                        updatedAt: new Date(p.updatedAt).getTime()
                    })));
                }
            }

            // Pull sales (mainly to mark local sales as synced)
            const pendingSales = await db.sales.where("synced").equals(0).toArray();
            // Actually, sales are pushed, not pulled normally, but we can verify sync status
        } catch (error) {
            console.error("Pull error:", error);
        }
    }

    private scheduleNext() {
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => this.startSync(), 60000); // Check every minute if idle
    }
}

export const syncEngine = typeof window !== "undefined" ? new SyncEngine() : null;

"use client";

import { db, type LocalProduct, type LocalSale, type SyncQueueItem } from "./db";
import { SYNC_INTERVALS, MAX_RETRIES, SYNC_ENDPOINTS } from "./constants";

class SyncEngine {
    private isProcessing = false;
    private syncTimeout: NodeJS.Timeout | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            window.addEventListener("online", () => this.startSync());
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
                if (item.failed) continue;

                const success = await this.syncItem(item);
                if (success) {
                    await db.syncQueue.delete(item.id);
                    // Mark sale as synced if it's a sale
                    if (item.type === "SALE") {
                        await db.sales.update(item.id, { synced: true });
                    }
                } else {
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

                    const waitTime = SYNC_INTERVALS[Math.min(nextRetry, SYNC_INTERVALS.length - 1)];
                    console.log(`Sync failed, waiting ${waitTime}ms before next item...`);
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                }
            }

            await this.pullUpdates();
        } catch (error) {
            console.error("Sync error:", error);
        } finally {
            this.isProcessing = false;
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

            if (response.ok) {
                console.log(`✓ Synced ${item.type}:`, item.id);
                return true;
            }

            if (response.status === 409) {
                const result = await response.json();
                console.warn("Conflict detected for", item.id, result);
                if (item.type === "PRODUCT_UPDATE") {
                    await db.products.put({
                        ...result.serverData,
                        updatedAt: result.serverData.updatedAt ?? Date.now()
                    });
                    return true;
                }
            }

            console.error(`Sync failed for ${item.type}:`, item.id, response.status);
            return false;
        } catch (error) {
            console.error("Sync item error:", error, "Item:", item.id);
            return false;
        }
    }

    private async pullUpdates() {
        try {
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
                    console.log(`✓ Pulled ${newProducts.length} product updates`);
                }
            }
        } catch (error) {
            console.error("Pull error:", error);
        }
    }

    private scheduleNext() {
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => this.startSync(), 30000);
    }
}

export const syncEngine = typeof window !== "undefined" ? new SyncEngine() : null;

"use client";

import Dexie, { type Table } from "dexie";

export interface LocalProduct {
    id: string;
    name: string;
    price: number;
    stock: number;
    version: number;
    updatedAt: number;
}

export interface LocalSale {
    id: string;
    total: number;
    mpesaCode?: string;
    createdAt: number;
    synced: boolean;
    items: {
        productId: string;
        qty: number;
        price: number;
    }[];
}

export interface SyncQueueItem {
    id: string;
    type: "SALE" | "PRODUCT_UPDATE";
    payload: any;
    retries: number;
    lastAttempt: number;
    failed?: boolean;
}

export class POSDatabase extends Dexie {
    products!: Table<LocalProduct>;
    sales!: Table<LocalSale>;
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super("POSDatabase");
        this.version(2).stores({
            products: "id, name, updatedAt, version",
            sales: "id, createdAt, synced",
            syncQueue: "id, type, lastAttempt, failed",
        }).upgrade(tx => {
            // Migrate existing syncQueue entries to add failed field
            return tx.table("syncQueue").toCollection().modify(item => {
                if (item.failed === undefined) {
                    item.failed = false;
                }
            });
        });
    }
}

export const db = new POSDatabase();

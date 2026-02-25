# Offline-POS

Offline-First Point of Sale System for Small Businesses

---

## Project Overview

Local-First POS is a Progressive Web Application (PWA) built to operate fully offline in low-bandwidth, unstable network environments.

**Designed for small businesses in informal economies where:**

- Internet connectivity is unreliable
- Power outages are common
- Devices may be shared
- Data is expensive

**This system ensures that:**

- Sales can be recorded without internet
- Stock updates immediately
- Data syncs automatically when reconnected
- The UI never blocks due to network failure

---

## Core Objectives

- Fully functional offline
- Local-first data storage
- Intelligent background synchronization
- Graceful failure handling
- Optimized for low bandwidth (2G simulation ready)

---

## System Architecture

### High-Level Design

```
Next.js App (Single Codebase)
  ├── Client Layer
  │     ├── IndexedDB (Primary Data Store)
  │     │     ├── Products
  │     │     ├── Sales (Append-Only Event Log)
  │     │     └── Sync Queue
  │     ├── Sync Status Indicator (Live Badge UI)
  │     └── Service Worker (Offline & Caching Layer)
  │
  └── Server Layer (Next.js API Routes)
        ├── POST /api/sales        ← append-only event handler
        └── GET|PUT /api/products  ← version-gated update handler
              └── SQLite via Prisma (server-side DB)
```

### Architectural Philosophy

The network is treated as a synchronization layer, not a dependency.

**All writes follow this flow:**

1. Save locally first
2. Update UI instantly (optimistic)
3. Queue for background sync
4. Update sync status badge (e.g. "3 sales pending sync")

---

## Tech Stack

Next.js serves as the single unified framework — no separate backend. The frontend (React, Service Worker, IndexedDB) and the server (API Routes) all live in the same Next.js project.

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| UI | React Server + Client Components |
| Local Storage | IndexedDB via Dexie.js (client-only) |
| Service Worker | next-pwa (Workbox-based) |
| PWA Manifest | `/public/manifest.json` |
| API Layer | Next.js API Routes (`/app/api/...`) |
| Server Runtime | Node.js (via Next.js) |
| Database | SQLite via Prisma (runs inside Next.js) |

---

## Data Models

### Products

```json
{
  "id": "string",
  "name": "string",
  "price": "number",
  "stock": "number",
  "updatedAt": "number",
  "version": "number"
}
```

### Sales (Immutable Event Log)

```json
{
  "id": "string",
  "items": [
    {
      "productId": "string",
      "qty": "number",
      "price": "number"
    }
  ],
  "total": "number",
  "mpesaCode": "string (optional)",
  "createdAt": "number",
  "synced": "boolean"
}
```

> **Design Note:** Sales are treated as an append-only event log. Once written, a sale is never mutated — only appended. This means there is no conflict surface on sales at all. Stock levels are derived server-side from the total event log, not stored as a raw number that can conflict.

### Sync Queue

```json
{
  "id": "string",
  "type": "SALE | PRODUCT_UPDATE",
  "payload": "object",
  "retries": "number",
  "lastAttempt": "number"
}
```

---

## Local-First Sync Strategy

### Write Flow

```
User Action → Save to IndexedDB → Update UI instantly → Increment sync badge → Add to syncQueue
```

### Background Sync Worker

**If online:**

- Process syncQueue items
- Send to Next.js API route
- Remove on success
- Decrement sync badge count
- Retry with exponential backoff on failure

**Backoff intervals:** `2s → 5s → 10s → 30s → 60s`

### Partial Sync

Sync requests use a timestamp filter so only new or changed records are fetched — never a full database refresh:

```
GET /api/sales?updatedAfter=<timestamp>
GET /api/products?updatedAfter=<timestamp>
```

This minimizes payload size, reduces data cost, and is battery-aware.

---

## Conflict Resolution Strategy

### Sales — No Conflict Possible

Sales are an **append-only immutable event log**. Each sale is a unique event that is never edited after creation. There is nothing to conflict. Both devices simply append their events, and the server merges the log chronologically.

### Product Updates — Version-Controlled

Product edits (price changes, manual stock corrections) are the only real conflict surface.

**Resolution approach:**

1. Every product carries a `version` integer
2. On sync, the client sends its version alongside the update
3. The server rejects updates where the incoming version is behind the current server version
4. The client receives the latest version and re-applies or discards its local change
5. All conflicts are logged server-side for transparency

**In plain terms:** last coherent write wins, with version gating to prevent stale overwrites.

---

## Sync Status Indicator (UI)

A persistent badge in the app header shows sync state at all times:

| State | Badge |
|---|---|
| All synced | ✅ Synced |
| Pending items | 🟡 3 sales pending sync |
| Actively syncing | 🔄 Syncing... |
| Sync failed | 🔴 Sync failed — will retry |

This gives shopkeepers confidence that their data is safe even without internet, and makes the sync moment visible and satisfying during demos.

---

## Service Worker Responsibilities

- Cache app shell for offline boot
- Intercept network requests
- Serve cached responses when offline
- Queue failed POST requests
- Enable background sync

---

## Features

### Product Management

- Add / Edit products
- Track stock
- Automatic versioning for conflict resolution

### Sales Recording

- Record sales offline
- M-Pesa reference logging
- Instant stock deduction (optimistic, local)

### Reporting

- Daily revenue summary
- Total items sold
- Offline-generated analytics

### Sync & Recovery

- Automatic background synchronization
- Retry with exponential backoff
- Sync status badge (pending count visible at all times)
- Graceful UI fallback during server errors

---

## Failure Scenarios Handled

| Scenario | System Response |
|---|---|
| Network drop during sync | Item stays in queue, retries on reconnect |
| API route returns 500 | Exponential backoff, logged in queue |
| App closed during write | IndexedDB transaction ensures write safety |
| Conflicting product edits across devices | Version check on server, stale write rejected |
| Slow (2G) network | Partial sync, compressed payload, no full refresh |
| Device storage nearly full | Warn user, prioritize sync queue flush |

---

## API Contract

All API routes live inside Next.js under `/app/api/`.

### POST /api/sales

**Request:**

```json
{
  "saleId": "string",
  "items": [],
  "total": "number",
  "createdAt": "number"
}
```

**Response:**

```json
{
  "status": "success"
}
```

### GET /api/sales?updatedAfter=timestamp

Returns only sales created after the given timestamp. Enables partial sync — no full database pull required.

### GET /api/products?updatedAfter=timestamp

Returns only products updated after the given timestamp.

### PUT /api/products/:id

**Request:**

```json
{
  "name": "string",
  "price": "number",
  "stock": "number",
  "version": "number"
}
```

**Response (conflict):**

```json
{
  "status": "conflict",
  "currentVersion": "number",
  "serverData": {}
}
```

---

## Security Considerations

- Local encryption (optional enhancement)
- Input validation server-side
- Rate limiting
- Version control for conflict management

---

## Performance Optimizations

- Partial sync (timestamp-based, both sales and products)
- Minimal payload size
- No full database refresh ever
- Optimistic UI updates
- Background sync queues
- Append-only event model eliminates merge complexity

---

## Battery & Data Awareness

- Sync only when online
- Reduced polling
- Compressed payloads
- Efficient caching strategy
- Partial sync keeps transfer sizes minimal

---

## Demo Script (Recommended Flow)

1. **Start online** — show products loaded, badge shows ✅ Synced
2. **Turn off WiFi** — badge shifts to offline indicator
3. **Record 3–5 sales** — stock deducts instantly, badge shows "4 sales pending sync"
4. **Attempt to reload page** — app boots from cache, all data intact
5. **Reconnect WiFi** — badge animates to 🔄 Syncing, then ✅ Synced
6. **Check the API route directly** — hit `/api/sales` in the browser or Postman, show all 4 sales arrived server-side, stock derived correctly from event log
7. **Conflict demo** — edit a product price on two tabs simultaneously, show version rejection on the stale write

---

## Project Structure

```
/app
├── layout.tsx                        ← root layout, mounts SyncBadge
├── page.tsx                          ← POS home / sales screen
├── products/
│   └── page.tsx                      ← product management
├── reports/
│   └── page.tsx                      ← offline-generated analytics
└── api/
    ├── sales/
    │   └── route.ts                  ← POST /api/sales (append-only)
    └── products/
        └── route.ts                  ← GET + PUT /api/products (version-gated)

/components
└── SyncBadge.tsx                     ← live pending sync indicator

/lib
├── db.ts                             ← Dexie schema + helpers (client-only)
├── sync.ts                           ← queue processor + backoff logic (client-only)
└── constants.ts                      ← backoff intervals, retry limits

/public
├── manifest.json                     ← PWA manifest
└── service-worker.js                 ← custom SW or generated by next-pwa

next.config.js                        ← next-pwa config
```

> **Note:** Dexie.js and all IndexedDB access must be client-side only. Use `"use client"` directive on any component or hook that touches `db.ts` or `sync.ts`. API routes in `/app/api/` run server-side and connect to your database.

---

## License

MIT License

---

## Built For

Low-bandwidth, resilient digital infrastructure environments.

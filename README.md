# Offline-Pos

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
Client (PWA)
  ├── IndexedDB (Primary Data Store)
  ├── Sync Queue (Pending Network Actions)
  ├── Service Worker (Offline & Caching Layer)
  │
  └── Backend API
      └── Event-Based Sales Processing
```

### Architectural Philosophy

The network is treated as a synchronization layer, not a dependency.

**All writes follow this flow:**

1. Save locally first
2. Update UI instantly (optimistic)
3. Queue for background sync

---

## Tech Stack

### Frontend

- React (or Vanilla + Vite)
- IndexedDB (via Dexie.js recommended)
- Service Worker (Workbox optional)
- PWA Manifest

### Backend

- Node.js (Express) or Go
- REST API
- Event-based sales storage

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

### Sales

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
User Action → Save to IndexedDB → Update UI instantly → Add to syncQueue
```

### Background Sync Worker

**If online:**

- Process syncQueue items
- Send to backend
- Remove on success
- Retry with exponential backoff on failure

**Backoff intervals:** `2s → 5s → 10s → 30s → 60s`

---

## Conflict Resolution Strategy

Sales are treated as immutable events.

**Instead of directly syncing stock numbers:**

- Sales are appended server-side
- Stock is derived from total sales

**If version conflicts occur:**

- Latest version (timestamp-based) wins
- Conflicts are logged for transparency

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
- Automatic versioning

### Sales Recording

- Record sales offline
- M-Pesa reference logging
- Instant stock deduction

### Reporting

- Daily revenue summary
- Total items sold
- Offline-generated analytics

### Sync & Recovery

- Automatic background synchronization
- Retry with exponential backoff
- Graceful UI fallback during server errors

---

## Failure Scenarios Handled

- Network drop during sync
- Backend returns 500 error
- App closed during write
- Conflicting updates across devices
- Slow (2G) network conditions
- Temporary offline state

**System Response:**

- Never blocks UI
- Queues writes safely
- Retries automatically
- Preserves data integrity

---

## API Contract

### POST /sales

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

### GET /sales?updatedAfter=timestamp

Returns only updated sales for partial sync.

---

## Security Considerations

- Local encryption (optional enhancement)
- Input validation server-side
- Rate limiting
- Version control for conflict management

---

## Performance Optimizations

- Partial sync (timestamp-based)
- Minimal payload size
- No full database refresh
- Optimistic UI updates
- Background sync queues

---

## Battery & Data Awareness

- Sync only when online
- Reduced polling
- Compressed payloads
- Efficient caching strategy

---

## Project Structure

```
/frontend
├── components
├── pages
├── db.js
├── sync.js
├── service-worker.js
└── manifest.json

/backend
├── routes
├── controllers
└── server.js
```

---

## License

MIT License

---

## Built For

Low-bandwidth, resilient digital infrastructure environments.

# Baobab POS - Offline-First Point of Sale System

A Progressive Web Application (PWA) designed for small businesses operating in low-connectivity environments.

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git (for cloning)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/bravian1/offline-pos.git
cd offline-pos
```

1. **Install dependencies**

```bash
npm install
```

1. **Set up the database**

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

1. **Start the development server**

```bash
npm run dev

# To enable PWA features in development:

npm run setup:certs

npm run dev:https

```

1. **Open your browser**

Navigate to `http://localhost:3000`

1. **Create your first user**

- Go to `/register`
- Enter your full name
- Enter a 10-digit phone number
- Create a passcode (minimum 4 characters)
- Click "Register"

1. **Start using the app**

- Record sales at `/` (home page)
- Manage inventory at `/products`
- View reports at `/reports`

---

## Testing Offline Functionality

By default, the service worker is disabled in development for faster development.

**To test offline features:**

```bash
ENABLE_PWA=true npm run dev
```

Then:

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Record sales - they'll queue for sync
4. Set back to "Online" - sales sync automatically

---

## Key Features

### Works Completely Offline

- Record sales without internet
- Access product catalog
- View reports
- All data stored locally in IndexedDB

### Automatic Sync

- Syncs automatically when connection restored
- Exponential backoff retry (2s → 5s → 10s → 30s → 60s)
- Visual sync status indicator
- No data loss

### Product Management

- Add/edit products
- Track stock levels
- Low stock indicators
- Version-controlled updates

### Sales Recording

- Quick sale entry
- M-Pesa reference support
- Instant stock deduction
- Offline-first design

### Reports

- Daily revenue
- Total items sold
- Generated offline from local data

### Authentication

- Phone number-based login
- Secure password hashing (bcrypt)
- Protected routes
- Session management

---

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React with Server/Client Components
- **Database**: SQLite via Prisma
- **Local Storage**: IndexedDB via Dexie.js
- **PWA**: Custom Service Worker
- **Authentication**: bcryptjs

### Data Flow

```txt
User Action → IndexedDB (instant) → UI Update → Sync Queue → API (when online)
```

### Offline-First Design

1. **All writes go to IndexedDB first** - instant UI updates
2. **Sync queue tracks pending changes** - visible in sync badge
3. **Background sync when online** - automatic, no user action needed
4. **Conflict resolution** - version-controlled for products, append-only for sales

---

## Project Structure

```txt
offline-pos/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Login/register endpoints
│   │   ├── sales/        # Sales API
│   │   └── products/     # Products API
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── products/         # Product management
│   ├── reports/          # Analytics
│   └── page.tsx          # Sales screen (home)
├── components/            # React components
│   ├── AuthGuard.tsx     # Route protection
│   ├── SyncBadge.tsx     # Sync status indicator
│   └── Sidebar.tsx       # Navigation
├── lib/                   # Utilities
│   ├── db.ts             # IndexedDB schema (Dexie)
│   ├── sync.ts           # Sync engine
│   └── prisma.ts         # Prisma client
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── dev.db            # SQLite database
├── public/               # Static assets
│   ├── sw.js             # Service worker
│   ├── manifest.json     # PWA manifest
│   └── icons/            # App icons
└── scripts/              # Utility scripts
```

---

## Common Tasks

### Add a New Product

1. Go to `/products`
2. Click "Add Product"
3. Enter name, price, and initial stock
4. Click "Add Product"

### Record a Sale

1. Go to home page (`/`)
2. Click products to add to cart
3. Adjust quantities with +/- buttons
4. (Optional) Enter M-Pesa code
5. Click "Complete Sale"

### View Sync Status

Look at the sync badge in the sidebar:

- "All synced" - everything saved to server
- "X pending" - items waiting to sync
- "Syncing..." - actively syncing
- "Offline" - no internet connection

### Reset Database

```bash
rm prisma/dev.db
npx prisma db push
npm run db:seed
```

---

## Troubleshooting

### "Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

### "Database file not found"

```bash
npx prisma db push
```

### "Port 3000 already in use"

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Service Worker not working

```bash
# Enable PWA in development
ENABLE_PWA=true npm run dev
```

### Clear all local data

1. Open DevTools → Application
2. Clear Storage → Clear site data
3. Refresh page

---

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

Create `.env` file:

```bash
DATABASE_URL="file:./dev.db"
NODE_ENV="production"
```

### Security Recommendations

See `SECURITY.md` for production security guidelines including:

- HTTP-only cookies for authentication
- Server-side session validation
- API route protection
- Rate limiting

---

## Documentation

- **SECURITY.md** - Production security recommendations
- **PR.md** - Detailed changelog and features
- **public/ICONS_README.md** - PWA icon generation guide

---

## Browser Support

- Firefox
- Chrome/Edge (recommended)
- Safari
- Mobile browsers (iOS/Android)

---

## License

MIT License

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review documentation files
3. Open an issue on the repositoryversion-gated)

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

```txt

> **Note:** Dexie.js and all IndexedDB access must be client-side only. Use `"use client"` directive on any component or hook that touches `db.ts` or `sync.ts`. API routes in `/app/api/` run server-side and connect to your database.

---

## License

MIT License

---

## Built For

Low-bandwidth, resilient digital infrastructure environments.

# Database Configuration Alignment

## Current Setup

### Database Location
- **Physical file**: `prisma/dev.db`
- **Connection string**: `file:./prisma/dev.db`

### Environment Variables
- `.env`: `DATABASE_URL="file:./prisma/dev.db"`
- `.env.example`: `DATABASE_URL="file:./prisma/dev.db"`

### Schema Configuration
- `prisma/schema.prisma`: Uses `env("DATABASE_URL")`
- Provider: SQLite
- Location: Resolved from DATABASE_URL environment variable

## Tables
1. **Product** - Product inventory with unique names
2. **User** - User accounts with unique phone numbers
3. **Sale** - Sales transactions
4. **SaleItem** - Individual items in sales

## Usage Points

### Migrations
```bash
npx prisma migrate dev    # Uses DATABASE_URL from .env
npx prisma migrate reset  # Uses DATABASE_URL from .env
```

### Database Operations
```bash
npx prisma db push        # Uses DATABASE_URL from .env
npx prisma db seed        # Uses DATABASE_URL from .env
npx prisma generate       # Generates client based on schema
```

### Application Runtime
- All API routes use `@/lib/prisma` which reads DATABASE_URL
- Prisma Client connects to database specified in DATABASE_URL

## Path Resolution
- Prisma resolves `file:./prisma/dev.db` relative to project root
- Results in: `/home/anonymous_vi/Documents/Private/offline-pos/prisma/dev.db`

## Verification
```bash
# Check database exists
ls -lh prisma/dev.db

# Check tables
sqlite3 prisma/dev.db ".tables"

# Verify Prisma can connect
npx prisma studio
```

## Important Notes
1. **Single source of truth**: Only `prisma/dev.db` exists
2. **No duplicates**: Removed `prisma/prisma/dev.db`
3. **Consistent paths**: All references use `file:./prisma/dev.db`
4. **Environment priority**: `.env.local` removed to avoid conflicts

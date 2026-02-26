# Authentication Security Notes

## Current Implementation (Development)

The current authentication system uses localStorage for session management:
- **Location**: `components/AuthGuard.tsx`
- **Storage**: `localStorage.getItem("user")`
- **Protection**: Client-side only

## Security Limitations

### ⚠️ localStorage Can Be Forged
- Any JavaScript code can access localStorage
- XSS attacks can steal tokens
- No server-side validation
- Tokens persist across sessions

### ⚠️ No Server-Side Protection
- API routes are not protected
- Anyone can call `/api/sales`, `/api/products` directly
- AuthGuard only prevents UI access, not API access

## Production Recommendations

### 1. Implement HTTP-Only Cookies

**Install dependencies:**
```bash
npm install jose
```

**Update login route** (`app/api/auth/login/route.ts`):
```typescript
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

// After successful login:
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const token = await new SignJWT({ userId: user.id })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('7d')
  .sign(secret);

cookies().set('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 // 7 days
});
```

### 2. Create Middleware for Route Protection

**Create** `middleware.ts` in project root:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

### 3. Protect API Routes

**Create helper** `lib/auth.ts`:
```typescript
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function verifyAuth() {
  const token = cookies().get('session')?.value;
  
  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

**Update API routes** (e.g., `app/api/sales/route.ts`):
```typescript
import { verifyAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await verifyAuth(); // Add this line
    
    // ... rest of the code
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 }
      );
    }
    // ... rest of error handling
  }
}
```

### 4. Update Client Components

**Keep AuthGuard** as UI convenience but don't rely on it for security:
```typescript
// components/AuthGuard.tsx - keep as-is for UX
// Security is now enforced server-side
```

**Update logout** (`components/Sidebar.tsx`):
```typescript
const handleLogout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  localStorage.removeItem('user');
  router.push('/login');
};
```

**Create logout route** (`app/api/auth/logout/route.ts`):
```typescript
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  cookies().delete('session');
  return NextResponse.json({ status: 'success' });
}
```

### 5. Environment Variables

**Add to** `.env`:
```bash
JWT_SECRET=your-super-secret-key-min-32-chars
```

**Generate secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Migration Checklist

- [ ] Install `jose` package
- [ ] Generate and set JWT_SECRET
- [ ] Create middleware.ts
- [ ] Create lib/auth.ts helper
- [ ] Update login route to set HTTP-only cookie
- [ ] Create logout route
- [ ] Protect all API routes with verifyAuth()
- [ ] Update client logout to call API
- [ ] Test authentication flow
- [ ] Test API protection
- [ ] Remove localStorage dependency (optional, keep for offline UX)

## Why Not Implemented Now?

This is a **development/demo system** focused on offline-first functionality. The localStorage approach:
- ✅ Works for single-user scenarios
- ✅ Persists across page reloads
- ✅ Simple to understand and debug
- ✅ No server-side session management needed
- ❌ Not secure for production
- ❌ Can be forged
- ❌ No API protection

For production deployment, implement the recommendations above.

## References

- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [jose JWT library](https://github.com/panva/jose)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

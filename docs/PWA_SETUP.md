# PWA Installation Setup

This guide explains how to test PWA installation locally.

## Prerequisites

- Node.js installed
- OpenSSL installed (usually pre-installed on Linux/macOS)

## Setup Steps

### 1. Generate SSL Certificates

PWAs require HTTPS to work. Generate self-signed certificates:

```bash
npm run setup:certs
```

This creates certificates in the `certs/` directory.

### 2. Start HTTPS Development Server

```bash
npm run dev:https
```

The app will be available at: **https://localhost:3000**

### 3. Accept Self-Signed Certificate

When you first visit https://localhost:3000:

**Chrome/Edge:**
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"

**Firefox:**
1. Click "Advanced"
2. Click "Accept the Risk and Continue"

**Safari:**
1. Click "Show Details"
2. Click "visit this website"

### 4. Install PWA

Once the page loads:

**Desktop (Chrome/Edge):**
- Look for the install icon (⊕) in the address bar
- Or click the three dots menu → "Install Offline-POS"

**Mobile (Chrome/Safari):**
- Tap the share button
- Select "Add to Home Screen"

**Desktop (Firefox):**
- Firefox doesn't support PWA installation on desktop

## Verification

After installation:
1. The app should open in a standalone window (no browser UI)
2. Go offline (disable network)
3. The app should still load and function
4. Check DevTools → Application → Service Workers to see it's active

## Production Deployment

For production, use a proper SSL certificate from:
- Let's Encrypt (free)
- Your hosting provider
- Cloudflare (free SSL)

Deploy to platforms that provide HTTPS by default:
- Vercel
- Netlify
- AWS Amplify
- Railway

## Troubleshooting

**Service Worker not registering:**
- Check browser console for errors
- Ensure you're using HTTPS
- Clear browser cache and reload

**Install prompt not showing:**
- Ensure manifest.json is valid
- Check all required icons exist
- Verify HTTPS is working
- Try in Chrome/Edge (best PWA support)

**App not working offline:**
- Check Service Worker is active in DevTools
- Verify cache is populated
- Check Network tab shows cached responses

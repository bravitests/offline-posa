# Offline Sync Testing Guide

## Test Scenarios

### 1. Basic Offline Sale Recording

**Steps:**
1. Open app in browser (Chrome DevTools recommended)
2. Open DevTools → Application → Service Workers → verify SW is active
3. Open DevTools → Network → set to "Offline"
4. Record 2-3 sales with different products
5. Verify:
   - Sales complete successfully
   - Stock deducts locally
   - Sync badge shows "X pending"
   - Sales appear in IndexedDB (Application → IndexedDB → POSDatabase → sales)
   - Sync queue has entries (syncQueue table)

**Expected:**
- ✅ Sales save to IndexedDB
- ✅ UI updates instantly
- ✅ Sync badge shows pending count
- ✅ No errors in console

### 2. Sync on Reconnect

**Steps:**
1. With pending sales from Test 1
2. Open DevTools → Network → set to "Online"
3. Wait 3-5 seconds
4. Verify:
   - Sync badge changes to "Syncing…" then "All synced"
   - Console shows "✓ Synced SALE: [id]"
   - Sync queue empties
   - Sales marked as synced in IndexedDB

**Expected:**
- ✅ All pending items sync
- ✅ Sync queue clears
- ✅ Badge shows "All synced"

### 3. Offline Product Management

**Steps:**
1. Go to /products page
2. Set network to "Offline"
3. Edit a product (price or stock)
4. Verify:
   - Changes save locally
   - Sync badge shows pending
   - Product updates in IndexedDB

**Expected:**
- ✅ Product edits work offline
- ✅ Changes queued for sync

### 4. App Reload While Offline

**Steps:**
1. Record 2 sales offline
2. Verify sync badge shows "2 pending"
3. Refresh the page (F5)
4. Verify:
   - App loads from cache
   - Products still visible
   - Sync badge still shows "2 pending"
   - Previous sales visible in reports

**Expected:**
- ✅ App boots offline
- ✅ All data persists
- ✅ Sync queue intact

### 5. Conflict Resolution

**Steps:**
1. Open app in two browser tabs
2. Edit same product in both tabs (different values)
3. Go offline in Tab 1
4. Edit product in Tab 1
5. Stay online in Tab 2
6. Edit same product in Tab 2 (syncs immediately)
7. Go online in Tab 1
8. Verify:
   - Tab 1 sync fails with conflict
   - Server version wins
   - Tab 1 updates to server value

**Expected:**
- ✅ Version conflict detected
- ✅ Server version preserved
- ✅ Stale edit discarded

### 6. Exponential Backoff

**Steps:**
1. Go offline
2. Record a sale
3. Go online but block API endpoint (DevTools → Network → Block request URL pattern: */api/sales*)
4. Watch console for retry attempts
5. Verify:
   - First retry: ~2s
   - Second retry: ~5s
   - Third retry: ~10s
   - Fourth retry: ~30s
   - Fifth retry: ~60s
   - After 5 retries: marked as failed

**Expected:**
- ✅ Exponential backoff works
- ✅ Max retries enforced
- ✅ Failed items don't retry infinitely

### 7. Service Worker Caching

**Steps:**
1. Load app online
2. Go to DevTools → Application → Cache Storage
3. Verify "baobab-pos-v1" cache exists
4. Check cached resources include:
   - / (home page)
   - /products
   - /reports
5. Go offline
6. Navigate between pages
7. Verify all pages load

**Expected:**
- ✅ Pages cached
- ✅ Navigation works offline
- ✅ No 404 errors

## Common Issues & Fixes

### Issue: Sync badge stuck on "Syncing…"

**Cause:** updateToken not using ref
**Fix:** Applied in this branch - useRef for updateToken

### Issue: Sales not syncing

**Cause:** syncEngine not triggered after sale
**Fix:** Applied - syncEngine.startSync() called after transaction

### Issue: Service worker not caching

**Cause:** SW not registered or cache name mismatch
**Fix:** Verify PWARegister component in layout.tsx

### Issue: IndexedDB version conflict

**Cause:** Schema change without version bump
**Fix:** Increment version in db.ts and add upgrade callback

## Browser DevTools Shortcuts

- **Open DevTools:** F12 or Cmd+Option+I (Mac)
- **Network tab:** Throttle to "Offline" or "Slow 3G"
- **Application tab:** View IndexedDB, Cache Storage, Service Workers
- **Console:** View sync logs and errors

## Success Criteria

All tests pass with:
- ✅ No console errors
- ✅ Data persists across reloads
- ✅ Sync completes when online
- ✅ UI always responsive
- ✅ Conflicts handled gracefully

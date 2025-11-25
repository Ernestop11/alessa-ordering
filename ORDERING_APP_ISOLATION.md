# Ordering App Isolation Configuration

## Summary
Configured the ordering app for isolation with custom port, cookie name, and base URL settings.

## Configuration Changes

### 1. Port Configuration
- **Changed**: `package.json` dev script
- **From**: `PORT=3300 next dev -p 3300`
- **To**: `PORT=3001 next dev -p 3001`
- **Base URL**: `http://localhost:3001`

### 2. Session Cookie Name
- **Changed**: `lib/auth/options.ts`
- **Added**: Custom cookie configuration for NextAuth
- **Cookie Name**: `session_ordering` (configurable via `NEXTAUTH_COOKIE_NAME` env var)
- **Default**: Falls back to `session_ordering` if env var not set

### 3. Environment Variables
- **Updated**: `env.example`
- **NEXTAUTH_URL**: Changed to `http://localhost:3001`
- **NEXTAUTH_COOKIE_NAME**: Added `session_ordering` (new)

## Files Modified

1. **lib/auth/options.ts**
   - Added `cookies` configuration to NextAuth options
   - Uses `process.env.NEXTAUTH_COOKIE_NAME || 'session_ordering'`
   - Maintains security settings (httpOnly, sameSite, secure)

2. **package.json**
   - Updated dev script to use PORT=3001

3. **env.example**
   - Updated NEXTAUTH_URL to port 3001
   - Added NEXTAUTH_COOKIE_NAME documentation

## Isolation Details

### NextAuth Session Cookie
- **Name**: `session_ordering`
- **Scope**: Admin authentication only
- **Isolated from**: Other apps using default NextAuth cookie names

### Customer Session Cookie
- **Name**: `customer_session` (unchanged)
- **Scope**: Customer authentication
- **Note**: Separate system, not affected by NextAuth cookie changes

## Setup Instructions

### 1. Update Environment Variables
Create or update `.env.local`:
```bash
PORT=3001
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_COOKIE_NAME="session_ordering"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 2. Run Development Server
```bash
npm run dev
```
Server will start on `http://localhost:3001`

### 3. Verify Isolation
- Admin login cookies will use `session_ordering` name
- App runs on port 3001 (isolated from other apps)
- Base URL: `http://localhost:3001`

## Testing

1. **Start server**: `npm run dev`
2. **Verify port**: Check `http://localhost:3001` loads
3. **Check cookies**: 
   - Login at `/admin/login`
   - Inspect cookies in browser DevTools
   - Should see `session_ordering` cookie (not default NextAuth name)

## Notes

- ✅ **Isolated**: Cookie name prevents conflicts with other apps
- ✅ **Port isolated**: Runs on 3001 (separate from other services)
- ✅ **No cross-edits**: Changes only affect ordering app configuration
- ✅ **Customer sessions**: Unchanged (separate system)
- ❌ **Not modified**: `/azteka-dsd` folder (as requested)

## Environment Variable Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `PORT` | `3001` | Server port |
| `NEXTAUTH_URL` | `http://localhost:3001` | NextAuth base URL |
| `NEXTAUTH_COOKIE_NAME` | `session_ordering` | Custom session cookie name |
| `NEXTAUTH_SECRET` | (your secret) | NextAuth encryption key |

---

**Status**: ✅ Configuration complete
**Isolation**: Active
**Port**: 3001
**Cookie**: session_ordering


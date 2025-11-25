# DoorDash Production Credentials

## Do You Need Different Keys for Launch?

**Yes, you'll need production credentials for launch.**

### Current Setup (Sandbox)
The credentials you provided are for **Sandbox/Testing**:
- Developer ID: `3b903a63-c35c-4ce7-af02-11469bf9d608`
- Key ID: `bb2bfa5c-8212-4ae1-87f9-38fb4afc9d8f`
- Signing Secret: `7DUdxFpXqpLXa0oKJdNu8vphcrn2J6b9UW8w_zdoloM`
- Environment: Sandbox

### For Production Launch

1. **Request Production Credentials**
   - Go to DoorDash Developer Portal: https://developer.doordash.com/
   - Navigate to Credentials section
   - Create a new credential set for **Production** environment
   - Copy the new Developer ID, Key ID, and Signing Secret

2. **Update Environment Variables**
   ```bash
   # Production credentials
   DOORDASH_DEVELOPER_ID="your-production-developer-id"
   DOORDASH_KEY_ID="your-production-key-id"
   DOORDASH_SIGNING_SECRET="your-production-signing-secret"
   DOORDASH_SANDBOX="false"  # Important: Set to false for production
   ```

3. **Per-Tenant Store IDs**
   - Each restaurant tenant needs their own DoorDash Drive store ID
   - They can get this by:
     - Signing up for DoorDash Drive
     - Contacting DoorDash support
     - Using DoorDash's merchant portal
   - Store IDs are entered in the tenant admin dashboard via the DoorDash Connect button

### Testing Before Launch

1. **Test in Sandbox First**
   - Use sandbox credentials (`DOORDASH_SANDBOX=true`)
   - Test quote, create, and track endpoints
   - Verify JWT authentication works

2. **Switch to Production**
   - Update credentials in production environment
   - Set `DOORDASH_SANDBOX=false`
   - Test with real orders (small test orders first)

### Multi-Tenant Architecture

- **Platform Credentials**: One set per environment (sandbox/production)
  - Stored in environment variables
  - Used for all API calls
  
- **Tenant Store IDs**: One per restaurant
  - Stored in `TenantIntegration.doorDashStoreId`
  - Each tenant connects their store ID via admin dashboard
  - Platform makes API calls using platform credentials + tenant store ID

### Security Notes

- Never commit production credentials to git
- Use environment variables or secrets management
- Rotate credentials periodically
- Monitor API usage and errors


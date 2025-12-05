# Alessa Ecosystem Architecture

## Overview

The Alessa ecosystem is designed as a "mycelium network" - all products communicate and sync with each other seamlessly. This document describes the architecture and communication patterns.

## Products in the Ecosystem

1. **ORDERING** - Restaurant ordering system
2. **SMP** - Digital signage/menu displays
3. **MARKETING_APP** - Marketing automation for grocery stores
4. **WEB_HOSTING** - Website hosting services
5. **DIGITAL_MENU** - Digital menu boards
6. **MINI_BODEGA** - Mini convenience store system

## Communication Patterns

### 1. Event-Driven Architecture

All products emit events when actions occur:

```typescript
// Emit event when menu item is created
await emitEvent(
  'menu_item_added',
  'ORDERING',
  { menuItemId, menuItemName },
  tenantId,
  'SMP' // Target product
);
```

### 2. Bidirectional Sync

Products can read and write to each other:

```typescript
// SMP reads menu from ORDERING
const products = await client.getProducts(tenantId);

// SMP updates menu item
await client.updateProduct(tenantId, productId, updates);
```

### 3. Real-Time Updates

Products listen for events and react in real-time:

```typescript
// SMP listens for menu updates
const events = await listenForEvents(
  ['menu_item_added', 'menu_item_updated'],
  'SMP',
  tenantId
);
```

## Database Schema

### TenantSync
Tracks sync status between products:
- `tenantId` - Which tenant
- `productType` - Which product (SMP, ORDERING, etc.)
- `syncStatus` - pending, syncing, success, error
- `lastSyncAt` - When last synced
- `syncConfig` - Product-specific configuration

### EcosystemEvent
Event queue for cross-product communication:
- `eventType` - Type of event
- `source` - Which product emitted it
- `target` - Which product should receive it
- `payload` - Event data
- `processed` - Whether it's been handled

### CRMActivity
CRM activities for tenant management:
- `activityType` - call, email, meeting, task, etc.
- `tenantId` - Related tenant
- `assignedTo` - Who's responsible
- `dueDate` - When it's due
- `completed` - Completion status

### CRMNote
Notes about tenants:
- `tenantId` - Related tenant
- `author` - Who wrote it
- `content` - Note content
- `tags` - Categorization
- `pinned` - Important notes

## API Structure

### Sync APIs (`/api/sync/*`)
- Tenant information
- Product/service status
- Menu items (products)
- Categories (sections)
- Sync status tracking

### Ecosystem APIs (`/api/ecosystem/*`)
- Event emission
- Event listening
- Event processing

### CRM APIs (`/api/crm/*`)
- Activity management
- Note management
- Tenant relationship tracking

## Integration Flow

### Initial Sync
1. SMP requests tenant info by slug
2. SMP gets tenant services
3. SMP syncs products and categories
4. SMP updates sync status

### Real-Time Updates
1. Ordering creates/updates menu item
2. Ordering emits ecosystem event
3. SMP listens for events
4. SMP processes event and updates display
5. SMP marks event as processed

### Bidirectional Updates
1. SMP updates menu item via API
2. Ordering updates database
3. Ordering emits event
4. Other products react if needed

## Security

### API Key Authentication
- All sync APIs require `X-API-Key` header
- Key stored in environment variables
- Different keys per environment (dev/prod)

### Tenant Isolation
- All APIs verify tenant ownership
- Events are tenant-scoped
- Sync status is per-tenant

## Monitoring

### Sync Status Dashboard
- View sync status for all tenants
- See last sync time
- Monitor sync errors

### Event Queue Monitoring
- View unprocessed events
- Track event processing time
- Debug event failures

### CRM Dashboard
- Track tenant activities
- Manage follow-ups
- Store tenant notes

## Future Enhancements

1. **Webhook Support** - Push events to external systems
2. **GraphQL API** - More flexible querying
3. **Rate Limiting** - Protect against abuse
4. **Event Replay** - Replay events for recovery
5. **Multi-Product Dashboards** - Unified view across products

## Example: Las Reinas Integration

### Setup
1. Las Reinas tenant exists in ORDERING
2. SMP project configured with API key
3. Sync status created for tenant

### Daily Operation
1. Restaurant updates menu in ORDERING
2. Event emitted automatically
3. SMP receives event
4. Digital menu updates in real-time
5. Sync status updated

### Manual Sync
1. Admin triggers sync from SMP
2. SMP fetches latest products
3. SMP updates displays
4. Sync status marked as success

## Best Practices

1. **Idempotency** - Events should be safe to process multiple times
2. **Error Handling** - Always handle sync failures gracefully
3. **Retry Logic** - Implement retries for failed syncs
4. **Logging** - Log all sync operations for debugging
5. **Monitoring** - Monitor sync status and event queue


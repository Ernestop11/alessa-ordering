#!/bin/bash
# Verify tenant isolation - ensure tenants don't contaminate each other

VPS_HOST="root@77.243.85.8"
DEPLOY_PATH="/var/www/alessa-ordering"

echo "🔒 Tenant Isolation Verification"
echo "================================="
echo ""

ssh $VPS_HOST << 'ENDSSH'
    cd /var/www/alessa-ordering
    
    echo "📊 Checking tenant data isolation..."
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function checkIsolation() {
        try {
            // Get all tenants
            const tenants = await prisma.tenant.findMany({
                select: { id: true, slug: true, name: true },
                orderBy: { slug: 'asc' }
            });
            
            console.log('\\n✅ Tenants found:', tenants.length);
            tenants.forEach(t => console.log(\`  - \${t.slug}: \${t.id.substring(0, 8)}...\`));
            
            // Check menu items isolation
            console.log('\\n📦 Menu Items per Tenant:');
            for (const tenant of tenants) {
                const count = await prisma.menuItem.count({
                    where: { tenantId: tenant.id }
                });
                console.log(\`  - \${tenant.slug}: \${count} items\`);
            }
            
            // Check templates isolation
            console.log('\\n🎨 Templates per Tenant:');
            for (const tenant of tenants) {
                const templates = await prisma.tenantTemplate.findMany({
                    where: { tenantId: tenant.id },
                    select: { id: true, name: true }
                });
                console.log(\`  - \${tenant.slug}: \${templates.length} template(s)\`);
                templates.forEach(t => console.log(\`    • \${t.name}\`));
            }
            
            // Check for cross-tenant contamination
            console.log('\\n🔍 Checking for cross-tenant data...');
            const allItems = await prisma.menuItem.findMany({
                select: { id: true, name: true, tenantId: true }
            });
            
            const tenantIds = new Set(tenants.map(t => t.id));
            const orphaned = allItems.filter(item => !tenantIds.has(item.tenantId));
            
            if (orphaned.length > 0) {
                console.log('  ⚠️  WARNING: Found orphaned menu items:', orphaned.length);
                orphaned.slice(0, 5).forEach(item => {
                    console.log(\`    - \${item.name} (tenantId: \${item.tenantId.substring(0, 8)}...)\`);
                });
            } else {
                console.log('  ✅ No orphaned items found');
            }
            
            // Check template isolation
            const allTemplates = await prisma.tenantTemplate.findMany({
                select: { id: true, name: true, tenantId: true, isGlobal: true }
            });
            
            const globalTemplates = allTemplates.filter(t => t.isGlobal);
            const tenantTemplates = allTemplates.filter(t => !t.isGlobal && t.tenantId);
            
            console.log('\\n📋 Template Summary:');
            console.log(\`  - Global templates: \${globalTemplates.length}\`);
            console.log(\`  - Tenant-specific: \${tenantTemplates.length}\`);
            
            // Verify each tenant template belongs to valid tenant
            const invalidTemplates = tenantTemplates.filter(t => {
                return t.tenantId && !tenantIds.has(t.tenantId);
            });
            
            if (invalidTemplates.length > 0) {
                console.log('  ⚠️  WARNING: Templates with invalid tenantId:', invalidTemplates.length);
            } else {
                console.log('  ✅ All templates properly isolated');
            }
            
        } catch (error) {
            console.error('  ❌ Error:', error.message);
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    checkIsolation();
    " 2>&1
ENDSSH

echo ""
echo "✅ Isolation check complete"







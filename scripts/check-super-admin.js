const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    const superAdmins = await prisma.user.findMany({
      where: { role: 'super_admin' },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true
      }
    });

    console.log('\n=== Super Admin Users ===');
    if (superAdmins.length === 0) {
      console.log('❌ No super admin users found');
    } else {
      console.log(`✅ Found ${superAdmins.length} super admin(s):`);
      superAdmins.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.name || 'No name'})`);
        console.log(`    Created: ${admin.createdAt}`);
      });
    }

    console.log('\n=== All Users ===');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        name: true
      }
    });
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();

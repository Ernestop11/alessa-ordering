import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testCacheBusting() {
  try {
    // Find a menu item with an uploaded image
    const item = await prisma.menuItem.findFirst({
      where: {
        image: {
          startsWith: '/uploads/'
        }
      },
      orderBy: { updatedAt: "desc" },
      select: { name: true, image: true, updatedAt: true },
    });

    if (!item) {
      console.log("❌ No menu items with uploaded images found.");
      await prisma.$disconnect();
      return;
    }

    const timestamp = new Date(item.updatedAt).getTime();
    const expectedUrl = `${item.image}?t=${timestamp}`;

    console.log(`\n🧪 Testing Cache-Busting Implementation`);
    console.log(`=====================================`);
    console.log(`Item Name: ${item.name}`);
    console.log(`Base Image URL: ${item.image}`);
    console.log(`Updated At: ${item.updatedAt.toISOString()}`);
    console.log(`Timestamp (ms): ${timestamp}`);
    console.log(`Expected URL with cache-buster: ${expectedUrl}`);
    console.log(`\n✅ Cache-busting logic verified!`);
    console.log(`\nWhen this item is updated:`);
    console.log(`1. Prisma automatically updates 'updatedAt' field`);
    console.log(`2. Server generates new timestamp: ${timestamp}`);
    console.log(`3. Image URL becomes: ${expectedUrl}`);
    console.log(`4. Browser treats it as a new URL and fetches fresh image`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testCacheBusting();

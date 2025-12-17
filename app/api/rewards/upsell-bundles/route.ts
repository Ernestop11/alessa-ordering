import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenant = await requireTenant();

    // Fetch catering packages that can serve as upsell bundles
    // Look for packages marked as "popular" or "bundle" category
    const packages = await prisma.cateringPackage.findMany({
      where: {
        tenantId: tenant.id,
        available: true,
        OR: [
          { category: 'bundle' },
          { category: 'popular' },
        ],
      },
      orderBy: { displayOrder: 'asc' },
      take: 5,
    });

    // Transform to upsell bundle format
    const bundles = packages.map((pkg) => {
      // Calculate original price if there's a discount
      const price = Number(pkg.pricePerGuest) || 0;
      // If badge contains "SAVE" info, extract original price
      let originalPrice = price;
      if (pkg.badge && pkg.badge.toLowerCase().includes('save')) {
        // Assume 10-20% savings for display
        originalPrice = Math.round(price * 1.15 * 100) / 100;
      }

      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || '',
        price,
        originalPrice,
        image: pkg.image,
        badge: pkg.badge,
      };
    });

    // Fetch menu items for upsell categories (sides/snacks, drinks, desserts)
    const menuItems = await prisma.menuItem.findMany({
      where: {
        tenantId: tenant.id,
        available: true,
        OR: [
          { category: { contains: 'side', mode: 'insensitive' } },
          { category: { contains: 'chip', mode: 'insensitive' } },
          { category: { contains: 'snack', mode: 'insensitive' } },
          { category: { contains: 'drink', mode: 'insensitive' } },
          { category: { contains: 'beverage', mode: 'insensitive' } },
          { category: { contains: 'soda', mode: 'insensitive' } },
          { category: { contains: 'agua', mode: 'insensitive' } },
          { category: { contains: 'dessert', mode: 'insensitive' } },
          { category: { contains: 'sweet', mode: 'insensitive' } },
          { category: { contains: 'pan', mode: 'insensitive' } },
          { category: { contains: 'postre', mode: 'insensitive' } },
        ],
      },
      take: 30,
    });

    // Also fetch grocery items for upsell
    const groceryItems = await prisma.groceryItem.findMany({
      where: {
        tenantId: tenant.id,
        available: true,
        OR: [
          { category: { contains: 'chip', mode: 'insensitive' } },
          { category: { contains: 'snack', mode: 'insensitive' } },
          { category: { contains: 'drink', mode: 'insensitive' } },
          { category: { contains: 'beverage', mode: 'insensitive' } },
          { category: { contains: 'soda', mode: 'insensitive' } },
          { category: { contains: 'candy', mode: 'insensitive' } },
          { category: { contains: 'dulce', mode: 'insensitive' } },
          { category: { contains: 'sweet', mode: 'insensitive' } },
        ],
      },
      take: 20,
    });

    // Categorize items
    const snacks: any[] = [];
    const drinks: any[] = [];
    const sweets: any[] = [];

    // Helper to categorize
    const categorizeItem = (item: any, isGrocery: boolean = false) => {
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const baseItem = {
        id: isGrocery ? `grocery-${item.id}` : item.id,
        name: item.name,
        price: Number(item.price) || 0,
        image: item.image || null,
        category: item.category || '',
        description: item.description || '',
      };

      if (cat.includes('drink') || cat.includes('beverage') || cat.includes('soda') || cat.includes('agua') ||
          name.includes('agua') || name.includes('soda') || name.includes('jarritos')) {
        drinks.push({ ...baseItem, emoji: '🥤' });
      } else if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('pan') || cat.includes('postre') ||
                 cat.includes('candy') || cat.includes('dulce') || name.includes('churro') || name.includes('flan')) {
        sweets.push({ ...baseItem, emoji: '🍰' });
      } else if (cat.includes('side') || cat.includes('chip') || cat.includes('snack') ||
                 name.includes('chip') || name.includes('guac') || name.includes('salsa')) {
        snacks.push({ ...baseItem, emoji: '🍟' });
      }
    };

    menuItems.forEach(item => categorizeItem(item, false));
    groceryItems.forEach(item => categorizeItem(item, true));

    // If no real items found, add some fallback suggestions
    if (snacks.length === 0) {
      snacks.push(
        { id: 'chips-guac', name: 'Chips & Guacamole', price: 5.99, image: null, emoji: '🥑', category: 'sides' },
        { id: 'chips-salsa', name: 'Chips & Salsa', price: 3.99, image: null, emoji: '🍟', category: 'sides' },
        { id: 'elote', name: 'Street Corn (Elote)', price: 4.99, image: null, emoji: '🌽', category: 'sides' },
      );
    }

    if (drinks.length === 0) {
      drinks.push(
        { id: 'jarritos', name: 'Jarritos', price: 2.99, image: null, emoji: '🍊', category: 'drinks' },
        { id: 'horchata', name: 'Horchata', price: 3.99, image: null, emoji: '🥛', category: 'drinks' },
        { id: 'agua-fresca', name: 'Agua Fresca', price: 3.49, image: null, emoji: '🍹', category: 'drinks' },
        { id: 'mexican-coke', name: 'Mexican Coca-Cola', price: 2.99, image: null, emoji: '🥤', category: 'drinks' },
      );
    }

    if (sweets.length === 0) {
      sweets.push(
        { id: 'churros', name: 'Churros', price: 4.99, image: null, emoji: '🍩', category: 'desserts' },
        { id: 'flan', name: 'Flan', price: 5.99, image: null, emoji: '🍮', category: 'desserts' },
        { id: 'tres-leches', name: 'Tres Leches', price: 6.99, image: null, emoji: '🍰', category: 'desserts' },
        { id: 'concha', name: 'Concha (Pan Dulce)', price: 2.49, image: null, emoji: '🥐', category: 'desserts' },
      );
    }

    return NextResponse.json({
      bundles,
      snacks: snacks.slice(0, 6),
      drinks: drinks.slice(0, 6),
      sweets: sweets.slice(0, 6),
    });
  } catch (err) {
    console.error('[upsell-bundles] Error:', err);
    return NextResponse.json({ bundles: [], snacks: [], drinks: [], sweets: [] });
  }
}

const CATEGORY_IMAGE_MAP: Record<string, string[]> = {
  tacos: [
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1565299585323-38174c0c0e8c?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1599974177422-591977d8d1f4?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&w=1400&q=80',
  ],
  torta: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=1400&q=80',
  ],
  plates: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80',
  ],
  burritos: [
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1574345342821-9e03db3f25ef?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1400&q=80',
  ],
  nachos: [
    'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1542691457-cbe4df041eb2?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1400&q=80',
  ],
  quesadilla: [
    'https://images.unsplash.com/photo-1521302080490-8c39d3a088e0?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1400&q=80',
  ],
  meat: [
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&w=1400&q=80',
  ],
  breakfast: [
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80',
  ],
  sides: [
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80',
  ],
  drinks: [
    'https://images.unsplash.com/photo-1592329427158-9f28df1b6d37?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1400&q=80',
  ],
  beverages: [
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1592329427158-9f28df1b6d37?auto=format&fit=crop&w=1400&q=80',
  ],
  bakery: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1400&q=80',
  ],
  dessert: [
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1400&q=80',
  ],
  alacarta: [
    'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1521302080490-8c39d3a088e0?auto=format&fit=crop&w=1400&q=80',
  ],
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1565299585323-38174c0c0e8c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1599974177422-591977d8d1f4?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80',
];

export function getStockImageForCategory(category?: string | null, index = 0) {
  if (!category) {
    return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  }

  const key = category.toLowerCase();
  const entries = Object.entries(CATEGORY_IMAGE_MAP);
  const matched = entries.find(([cat]) => key.includes(cat));

  if (matched) {
    const images = matched[1];
    return images[index % images.length];
  }

  const direct = CATEGORY_IMAGE_MAP[key];
  if (direct && direct.length > 0) {
    return direct[index % direct.length];
  }

  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

export function cycleFallbackImage(index = 0) {
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

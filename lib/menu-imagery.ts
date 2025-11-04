const CATEGORY_IMAGE_MAP: Record<string, string[]> = {
  tacos: [
    'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1565299543923-37dd378b9d5d?auto=format&fit=crop&w=1400&q=80',
  ],
  torta: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80'],
  plates: ['https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1400&q=80'],
  mole: ['https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1400&q=80'],
  bakery: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=80',
  ],
  dessert: ['https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=1400&q=80'],
  pastries: ['https://images.unsplash.com/photo-1483699606544-3ffcf99458d4?auto=format&fit=crop&w=1400&q=80'],
  beverages: ['https://images.unsplash.com/photo-1598514982841-61859bfbb1f0?auto=format&fit=crop&w=1400&q=80'],
  drinks: ['https://images.unsplash.com/photo-1592329427158-9f28df1b6d37?auto=format&fit=crop&w=1400&q=80'],
  grocery: ['https://images.unsplash.com/photo-1511689987572-1c1bfb9cfd63?auto=format&fit=crop&w=1400&q=80'],
  breakfast: ['https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1400&q=80'],
  panaderia: ['https://images.unsplash.com/photo-1542691457-cbe4df041eb2?auto=format&fit=crop&w=1400&q=80'],
  specials: ['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=80'],
  chef: ['https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1400&q=80'],
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1542691457-cbe4df041eb2?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1521302080490-8c39d3a088e0?auto=format&fit=crop&w=1400&q=80',
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

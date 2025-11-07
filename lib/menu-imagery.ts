const CATEGORY_IMAGE_MAP: Record<string, string[]> = {
  tacos: [
    'https://picsum.photos/id/1040/1400/800',
    'https://picsum.photos/id/292/1400/800',
  ],
  torta: ['https://picsum.photos/id/1062/1400/800'],
  plates: ['https://picsum.photos/id/1035/1400/800'],
  mole: ['https://picsum.photos/id/1056/1400/800'],
  bakery: [
  'https://picsum.photos/id/1080/1400/800',
  'https://picsum.photos/id/1070/1400/800',
  ],
  dessert: ['https://picsum.photos/id/1058/1400/800'],
  pastries: ['https://picsum.photos/id/1066/1400/800'],
  beverages: ['https://picsum.photos/id/1071/1400/800'],
  drinks: ['https://picsum.photos/id/1084/1400/800'],
  grocery: ['https://picsum.photos/id/1045/1400/800'],
  breakfast: ['https://picsum.photos/id/1062/1400/800'],
  panaderia: ['https://picsum.photos/id/1080/1400/800'],
  specials: ['https://picsum.photos/id/1051/1400/800'],
  chef: ['https://picsum.photos/id/1040/1400/800'],
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

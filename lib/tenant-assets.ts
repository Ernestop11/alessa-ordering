const localAssetMap: Record<string, { hero: string; membership: string }> = {
  lapoblanita: {
    hero: 'https://images.unsplash.com/photo-1601050690597-4d7a18efae85?auto=format&fit=crop&w=1600&q=80',
    membership: 'https://images.unsplash.com/photo-1608039755401-28912c8341d6?auto=format&fit=crop&w=1200&q=80',
  },
  lasreinas: {
    hero: 'https://images.unsplash.com/photo-1604908177073-b7d5be5dbcec?auto=format&fit=crop&w=1600&q=80',
    membership: 'https://images.unsplash.com/photo-1589308078055-124b5c095772?auto=format&fit=crop&w=1200&q=80',
  },
  villacorona: {
    hero: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=1600&q=80',
    membership: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80',
  },
};

const assetBase = process.env.NEXT_PUBLIC_TENANT_ASSET_BASE_URL?.replace(/\/+$/, '');

export function getTenantAssets(slug: string) {
  if (assetBase) {
    return {
      hero: `${assetBase}/${slug}/hero.jpg`,
      membership: `${assetBase}/${slug}/membership.jpg`,
    };
  }
  return localAssetMap[slug] || localAssetMap.lapoblanita;
}

const localAssetMap: Record<string, { hero: string; membership: string }> = {
  lapoblanita: {
    hero: '/tenant/lapoblanita/hero.jpg',
    membership: '/tenant/lapoblanita/membership.jpg',
  },
  lasreinas: {
    hero: '/tenant/lasreinas/hero.jpg',
    membership: '/tenant/lasreinas/membership.jpg',
  },
  villacorona: {
    hero: '/tenant/villacorona/hero.jpg',
    membership: '/tenant/villacorona/membership.jpg',
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

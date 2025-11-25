import { getStaticTenantTheme } from './tenant-theme-map';

export interface TenantAssetPaths {
  hero: string;
  membership: string;
  logo: string;
}

const assetBase = process.env.NEXT_PUBLIC_TENANT_ASSET_BASE_URL?.replace(/\/+$/, '');

function withAssetBase(path: string) {
  if (!assetBase) return path;
  const normalized = path.replace(/^\/+/, '');
  const withoutTenantPrefix = normalized.startsWith('tenant/')
    ? normalized.slice('tenant/'.length)
    : normalized;
  return `${assetBase}/${withoutTenantPrefix}`;
}

export function getTenantAssets(slug: string): TenantAssetPaths {
  const fallbackAssets = getStaticTenantTheme(slug).assets;
  return {
    hero: withAssetBase(fallbackAssets.hero),
    membership: withAssetBase(fallbackAssets.membership),
    logo: withAssetBase(fallbackAssets.logo),
  };
}

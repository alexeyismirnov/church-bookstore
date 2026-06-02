/** Hostnames allowed for next/image product covers. */
export const PRODUCT_IMAGE_HOSTS = [
  'orthodoxy.sgp1.digitaloceanspaces.com',
  'orthodoxbookshop.asia',
  'django.orthodoxbookshop.asia',
  'filedn.com',
] as const;

export function isOptimizableImageUrl(url: string): boolean {
  if (!url || url.startsWith('/')) return true;
  try {
    const { hostname } = new URL(url);
    return PRODUCT_IMAGE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

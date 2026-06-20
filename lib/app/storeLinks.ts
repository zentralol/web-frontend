export const APP_STORE_URL = process.env.NEXT_PUBLIC_IOS_APP_URL ?? "";
export const PLAY_STORE_URL = process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? "";

export function getStoreUrl(userAgent: string): string | null {
  if (/iPhone|iPad|iPod/i.test(userAgent) && APP_STORE_URL) {
    return APP_STORE_URL;
  }
  if (/Android/i.test(userAgent) && PLAY_STORE_URL) {
    return PLAY_STORE_URL;
  }
  return APP_STORE_URL || PLAY_STORE_URL || null;
}

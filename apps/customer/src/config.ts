import { FOODICS_MENU_URL } from '@ramkin/shared';

/** Official Foodics menu — Order Online opens this in a new tab (no API sync). */
export function getFoodicsMenuUrl(): string {
  const fromEnv = import.meta.env.VITE_FOODICS_MENU_URL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : FOODICS_MENU_URL;
}

/**
 * QR stickers should open the customer landing URL.
 * Configurable for a future prod domain; local default is the current origin.
 */
export function getQrLandingUrl(): string {
  const fromEnv = import.meta.env.VITE_QR_LANDING_URL?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:5173';
}

/** Open Foodics without leaving the loyalty session on this tab. */
export function openFoodicsMenu(): void {
  window.open(getFoodicsMenuUrl(), '_blank', 'noopener,noreferrer');
}

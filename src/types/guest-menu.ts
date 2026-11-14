import type { GuestPaymentMethod } from '@/types/guest-checkout';

export type GuestSaleType = 'normal' | 'sponsored' | 'exclusive';

export type GuestMenuClosedReason = 'NOT_CONFIGURED' | 'FEATURE_DISABLED' | 'MACHINE_OFFLINE';

export interface GuestMenuProduct {
  key: string;
  productId: string;
  name: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  price: number;
  available: number;
  saleType: GuestSaleType;
  healthRating: number | null;
  guestBuyable: boolean;
}

export interface GuestMenuCategory {
  id: string;
  name: string;
}

export interface GuestMenu {
  machine: {
    id: string;
    name: string | null;
    location: string | null;
    imageUrl: string | null;
    online: boolean;
  };
  checkout: {
    open: boolean;
    reason: GuestMenuClosedReason | null;
    paymentMethods: GuestPaymentMethod[];
  };
  categories: GuestMenuCategory[];
  products: GuestMenuProduct[];
}

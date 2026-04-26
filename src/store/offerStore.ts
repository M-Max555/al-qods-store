import { create } from 'zustand';
import { offerService } from '../firebase/services/offerService';
import type { Offer } from '../types';

interface OfferState {
  offers: Offer[];
  isLoading: boolean;
  error: string | null;
  fetchActiveOffers: () => Promise<void>;
  getOfferForProduct: (productId: string) => Offer | undefined;
}

export const useOfferStore = create<OfferState>((set, get) => ({
  offers: [],
  isLoading: false,
  error: null,
  
  fetchActiveOffers: async () => {
    set({ isLoading: true, error: null });
    try {
      const activeOffers = await offerService.getActiveOffers();
      set({ offers: activeOffers, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch offers', isLoading: false });
    }
  },

  getOfferForProduct: (productId: string) => {
    // Return the offer with the highest discount if a product is in multiple offers
    const applicableOffers = get().offers.filter(offer => offer.productIds.includes(productId));
    if (applicableOffers.length === 0) return undefined;
    
    return applicableOffers.reduce((prev, current) => 
      (prev.discountPercentage > current.discountPercentage) ? prev : current
    );
  }
}));

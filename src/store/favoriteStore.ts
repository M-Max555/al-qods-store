import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../types';

interface FavoriteState {
  favorites: Product[];
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (product) => {
        if (!get().isFavorite(product.id)) {
          set((state) => ({ favorites: [...state.favorites, product] }));
        }
      },
      removeFavorite: (productId) => {
        set((state) => ({
          favorites: state.favorites.filter((p) => p.id !== productId),
        }));
      },
      isFavorite: (productId) => {
        return get().favorites.some((p) => p.id === productId);
      },
      toggleFavorite: (product) => {
        if (get().isFavorite(product.id)) {
          get().removeFavorite(product.id);
        } else {
          get().addFavorite(product);
        }
      },
    }),
    {
      name: 'favorites-storage',
    }
  )
);

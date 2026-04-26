import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';
import { cartService, auth } from '../firebase';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string;
  couponDiscount: number;

  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  fetchUserCart: () => Promise<void>;

  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  getShippingCost: () => number;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: '',
      couponDiscount: 0,

      fetchUserCart: async () => {
        const user = auth.currentUser;
        if (user) {
          const items = await cartService.getCart(user.uid);
          set({ items });
        }
      },

      addItem: async (product, quantity = 1) => {
        const user = auth.currentUser;
        if (user) {
          await cartService.addToCart(user.uid, product, quantity);
        }

        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            const newQty = Math.min(existing.quantity + quantity, product.stock);
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: newQty } : i
              ),
            };
          }
          return {
            items: [...state.items, { product, quantity: Math.min(quantity, product.stock) }],
          };
        });
      },

      removeItem: async (productId) => {
        const user = auth.currentUser;
        if (user) {
          await cartService.removeFromCart(user.uid, productId);
        }
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) { 
          await get().removeItem(productId); 
          return; 
        }

        const user = auth.currentUser;
        if (user) {
          await cartService.updateQuantity(user.uid, productId, quantity);
        }

        set((state) => ({
          items: state.items.map((i) => {
            if (i.product.id === productId) {
              return { ...i, quantity: Math.min(quantity, i.product.stock) };
            }
            return i;
          }),
        }));
      },

      clearCart: async () => {
        const user = auth.currentUser;
        if (user) {
          await cartService.clearCart(user.uid);
        }
        set({ items: [], couponCode: '', couponDiscount: 0 });
      },
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      removeCoupon: () => set({ couponCode: '', couponDiscount: 0 }),

      getItemCount: () => get().items.reduce((t, i) => t + i.quantity, 0),
      getSubtotal: () => get().items.reduce((t, i) => t + (i.product.finalPrice || i.product.price) * i.quantity, 0),
      getShippingCost: () => (get().getSubtotal() >= 500 ? 0 : 50),
      getTotal: () => {
        const sub = get().getSubtotal();
        const ship = get().getShippingCost();
        const disc = get().couponDiscount > 0 ? (sub * get().couponDiscount) / 100 : 0;
        return Math.max(0, sub + ship - disc);
      },
      isInCart: (productId) => get().items.some((i) => i.product.id === productId),
      getItemQuantity: (productId) => {
        const item = get().items.find((i) => i.product.id === productId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
);

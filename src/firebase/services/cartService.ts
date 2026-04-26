import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firestore';
import type { CartItem, Product } from '../../types';

const COLLECTION_NAME = 'carts';

export const cartService = {
  async getCart(userId: string): Promise<CartItem[]> {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return [];
    return snapshot.data().items as CartItem[];
  },

  async addToCart(userId: string, product: Product, quantity = 1): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const snapshot = await getDoc(docRef);
    
    let items: CartItem[] = [];
    if (snapshot.exists()) {
      items = snapshot.data().items as CartItem[];
    }

    const existingIndex = items.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({ product, quantity });
    }

    await setDoc(docRef, { items, userId }, { merge: true });
  },

  async removeFromCart(userId: string, productId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return;

    let items = snapshot.data().items as CartItem[];
    items = items.filter(item => item.product.id !== productId);
    
    await updateDoc(docRef, { items });
  },

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return;

    const items = snapshot.data().items as CartItem[];
    const item = items.find(i => i.product.id === productId);
    
    if (item) {
      item.quantity = quantity;
      await updateDoc(docRef, { items });
    }
  },

  async clearCart(userId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(docRef, { items: [], userId }, { merge: true });
  }
};

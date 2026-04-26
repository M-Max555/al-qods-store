import { 
  collection, doc, getDocs, 
  addDoc, updateDoc, query, where, orderBy 
} from 'firebase/firestore';
import { db } from '../firestore';
import type { Order, OrderStatusType } from '../../types';

const COLLECTION_NAME = 'orders';

function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QDS-${ts}-${rand}`;
}

export const orderService = {
  async createOrder(orderData: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Order> {
    const newOrder = {
      ...orderData,
      orderId: generateOrderId(),
      status: 'pending' as OrderStatusType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newOrder);
    return { id: docRef.id, ...newOrder } as Order;
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },

  async getAllOrders(): Promise<Order[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },

  async updateOrderStatus(orderId: string, status: OrderStatusType): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, orderId);
    await updateDoc(docRef, { 
      status,
      updatedAt: new Date().toISOString()
    });
  }
};

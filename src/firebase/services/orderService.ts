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

    // Part 12: Order Status Automation
    const snapshot = await getDocs(query(collection(db, COLLECTION_NAME), where('orderId', '==', orderId)));
    if (snapshot.empty) return;
    const order = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Order;
    
    let message = '';
    switch (status) {
      case 'pending': message = 'تم استلام طلبك بنجاح وجاري مراجعته'; break;
      case 'processing': message = 'جار تجهيز طلبك الآن في معرض القدس 📦'; break;
      case 'shipped': 
        message = `طلبك في الطريق 🚚\nموقع التوصيل: https://www.google.com/maps?q=${order.location?.lat},${order.location?.lng}`; 
        break;
      case 'delivered': message = 'تم تسليم طلبك بنجاح! نرجو تقييم تجربتك معنا (1-5) ⭐'; break;
      case 'cancelled': message = 'نعتذر منك، تم إلغاء طلبك. نتمنى خدمتك في المرة القادمة.'; break;
    }

    if (message && order.phone) {
      const encodedMsg = encodeURIComponent(message);
      const waLink = `https://wa.me/${order.phone.startsWith('0') ? '2' + order.phone : order.phone}?text=${encodedMsg}`;
      // In a real automated system, this would be an API call. 
      // For now, we log it and providing the link for admin if needed.
      console.log(`[Notification] Status: ${status}, Link: ${waLink}`);
      // For immediate feedback in admin UI, we could trigger a window.open or toast
    }
  }

};

import { collection, doc, addDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firestore';
import { Coupon } from '../../types';

export const couponService = {
  generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'QDS-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  async createCoupon(userId: string, email: string, phone: string): Promise<string> {
    const code = this.generateCouponCode();
    const coupon: Omit<Coupon, 'id'> = {
      userId,
      email,
      phone,
      code,
      discount: 5,
      isUsed: false,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'coupons'), coupon);
    
    // Update user record with coupon code
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      coupon: code,
      hasUsedCoupon: false
    });

    return code;
  },

  async validateCoupon(code: string, userId: string): Promise<Coupon | null> {
    const q = query(
      collection(db, 'coupons'),
      where('code', '==', code),
      where('userId', '==', userId),
      where('isUsed', '==', false)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Coupon;
  },

  async markCouponAsUsed(code: string, userId: string): Promise<void> {
    const q = query(
      collection(db, 'coupons'),
      where('code', '==', code),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const couponDoc = querySnapshot.docs[0];
      await updateDoc(couponDoc.ref, { isUsed: true });
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { hasUsedCoupon: true });
  }
};

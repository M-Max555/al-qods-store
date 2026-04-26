import { 
  collection, doc, getDocs, getDoc, 
  addDoc, updateDoc, deleteDoc, query, orderBy, where 
} from 'firebase/firestore';
import { db } from '../firestore';
import type { Offer } from '../../types';

const COLLECTION_NAME = 'offers';

export const offerService = {
  async getAllOffers(): Promise<Offer[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
  },

  async getActiveOffers(): Promise<Offer[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    const now = new Date().toISOString();
    
    // Also filter by expiresAt on the client to ensure accuracy if Firestore query is simple
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Offer))
      .filter(offer => offer.expiresAt > now);
  },

  async getOfferById(id: string): Promise<Offer> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error('Offer not found');
    return { id: snapshot.id, ...snapshot.data() } as Offer;
  },

  async addOffer(offer: Omit<Offer, 'id'>): Promise<Offer> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), offer);
    return { id: docRef.id, ...offer };
  },

  async updateOffer(id: string, updates: Partial<Offer>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  },

  async deleteOffer(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};

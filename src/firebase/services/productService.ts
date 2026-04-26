import { 
  collection, doc, getDocs, getDoc, 
  addDoc, updateDoc, deleteDoc, query, orderBy 
} from 'firebase/firestore';
import { db } from '../firestore';
import type { Product, Review } from '../../types';
import { mapOldCategoryToKey } from '../../constants/categories';

const COLLECTION_NAME = 'products';

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        category: mapOldCategoryToKey(data.category || 'uncategorized'),
        isOffer: data.isOffer || (data.discount > 0),
        isFeatured: data.isFeatured || false,
        // Fallbacks for new high-conversion fields
        ratingAverage: data.ratingAverage || data.rating || 0,
        ratingCount: data.ratingCount || data.reviewCount || 0,
        reviews: data.reviews || [],
        shippingDetails: data.shippingDetails || 'شحن سريع ومجاني للطلبات فوق 5000 ج.م',
        warranty: data.warranty || 'ضمان سنتين من الوكيل المعتمد',
        returnPolicy: data.returnPolicy || 'إمكانية الاستبدال أو الاسترجاع خلال 14 يوم'
      } as Product;
    });
  },

  async getProductById(id: string): Promise<Product> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error('Product not found');
    const data = snapshot.data();
    return { 
      id: snapshot.id, 
      ...data,
      category: mapOldCategoryToKey(data.category || 'uncategorized'),
      isOffer: data.isOffer || (data.discount > 0),
      isFeatured: data.isFeatured || false,
      // Fallbacks
      ratingAverage: data.ratingAverage || data.rating || 0,
      ratingCount: data.ratingCount || data.reviewCount || 0,
      reviews: data.reviews || [],
      shippingDetails: data.shippingDetails || 'شحن سريع ومجاني للطلبات فوق 5000 ج.م',
      warranty: data.warranty || 'ضمان سنتين من الوكيل المعتمد',
      returnPolicy: data.returnPolicy || 'إمكانية الاستبدال أو الاسترجاع خلال 14 يوم'
    } as Product;
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const category = mapOldCategoryToKey(product.category || 'uncategorized');
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...product,
      category,
      ratingAverage: product.ratingAverage || 0,
      ratingCount: product.ratingCount || 0,
      reviews: product.reviews || [],
      isOffer: product.isOffer || (product.discount > 0),
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...product, category };
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async addReview(productId: string, review: Omit<Review, 'id' | 'date'>): Promise<void> {
    const product = await this.getProductById(productId);
    const newReview: Review = {
      ...review,
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString()
    };
    
    const updatedReviews = [newReview, ...product.reviews];
    const newRatingCount = updatedReviews.length;
    const newRatingAverage = Number((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / newRatingCount).toFixed(1));

    await this.updateProduct(productId, {
      reviews: updatedReviews,
      ratingAverage: newRatingAverage,
      ratingCount: newRatingCount,
      rating: newRatingAverage, // Keep legacy field in sync
      reviewCount: newRatingCount // Keep legacy field in sync
    });
  },

  async deleteProduct(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};

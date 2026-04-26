import { collection, doc, writeBatch, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firestore';
import { mockProducts, mockCategories } from '../data/mockData';

export async function seedFirestore(): Promise<void> {
  console.log('🌱 Starting Firestore seed...');
  
  try {
    // Check if products already exist
    const existingProducts = await getDocs(collection(db, 'products'));
    if (!existingProducts.empty) {
      console.log(`⚠️ Products collection already has ${existingProducts.size} docs. Skipping seed.`);
      return;
    }

    const batch1 = writeBatch(db);
    
    // Seed Products
    for (const product of mockProducts) {
      const { id, ...productData } = product;
      const docRef = doc(collection(db, 'products'));
      batch1.set(docRef, { ...productData, createdAt: serverTimestamp() });
    }
    
    await batch1.commit();
    console.log(`✅ Seeded ${mockProducts.length} products`);

    // We can also seed categories here if they were moved to Firebase.
    // Currently, categories are in mockData, but if needed they can be seeded similar to products.
    // Let's seed categories as well.
    const existingCategories = await getDocs(collection(db, 'categories'));
    if (existingCategories.empty) {
      const batch2 = writeBatch(db);
      for (const cat of mockCategories) {
        const { id, ...catData } = cat;
        const docRef = doc(db, 'categories', id); // Using the mock ID directly for categories
        batch2.set(docRef, { ...catData, createdAt: serverTimestamp() });
      }
      await batch2.commit();
      console.log(`✅ Seeded ${mockCategories.length} categories`);
    }

    console.log('🎉 Firestore seed complete!');
  } catch (error) {
    console.error('❌ Error during Firestore seed:', error);
  }
}

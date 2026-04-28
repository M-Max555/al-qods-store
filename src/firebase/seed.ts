// import { mockProducts, mockCategories } from '../data/mockData';

export async function seedFirestore(): Promise<void> {
  console.log('🌱 Seed logic disabled — No mock data available.');
  return;
  /*
  try {
    // Check if products already exist
    const existingProducts = await getDocs(collection(db, 'products'));
    if (!existingProducts.empty) {
      console.log(`⚠️ Products collection already has ${existingProducts.size} docs. Skipping seed.`);
      return;
    }
    // ... rest of seeding logic ...
  } catch (error) {
    console.error('❌ Error during Firestore seed:', error);
  }
  */
}

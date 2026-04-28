import { create } from 'zustand';
import type { Product, ProductFilters } from '../types';
import { productService } from '../firebase';

interface ProductState {
  products: Product[];
  filteredProducts: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  filters: ProductFilters;
  searchQuery: string;

  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  addReview: (productId: string, review: { name: string; comment: string; rating: number }) => Promise<void>;
  setFilters: (filters: Partial<ProductFilters>) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  applyFilters: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  filteredProducts: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  filters: {},
  searchQuery: '',

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await productService.getAllProducts();
      set({ products, isLoading: false });
      get().applyFilters();
    } catch (error) {
      set({ isLoading: false, error: 'حدث خطأ أثناء تحميل المنتجات' });
    }
  },

  fetchProductById: async (id: string) => {
    set({ isLoading: true, error: null, selectedProduct: null });
    try {
      const product = await productService.getProductById(id);
      set({ selectedProduct: product, isLoading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل المنتج';
      set({ isLoading: false, error: msg });
    }
  },

  addReview: async (productId, review) => {
    try {
      await productService.addReview(productId, review);
      // Refresh local state
      const product = await productService.getProductById(productId);
      set((state) => ({
        products: state.products.map((p) => p.id === productId ? product : p),
        selectedProduct: state.selectedProduct?.id === productId ? product : state.selectedProduct
      }));
      get().applyFilters();
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().applyFilters();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  clearFilters: () => {
    set({ filters: {}, searchQuery: '' });
    get().applyFilters();
  },

  applyFilters: () => {
    const { products, filters, searchQuery } = get();
    let result = [...products];

    // Arabic Search Normalization Helper
    const normalize = (text: string) => {
      if (!text) return '';
      return text
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ىي]/g, 'ي')
        .replace(/ال/g, ' ') // Remove 'Al' prefix and separate
        .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep only letters/numbers
        .trim();
    };

    const stopWords = ['كويسه', 'نضيفه', 'حلوه', 'جميله', 'افضل', 'احسن', 'عايز', 'اريد', 'بكام', 'سعر', 'في', 'من', 'على'];

    if (searchQuery.trim()) {
      const originalQuery = searchQuery.trim().toLowerCase();
      const normalizedQuery = normalize(originalQuery);
      
      // Split query into keywords, filter out stop words and short terms
      const keywords = normalizedQuery.split(/\s+/)
        .filter(k => k.length > 2 && !stopWords.includes(k));

      if (keywords.length > 0) {
        result = result.filter(p => {
          const productText = normalize(`${p.nameAr} ${p.name} ${p.descriptionAr} ${p.categoryAr} ${p.tags.join(' ')}`);
          
          // Rank by how many keywords match
          const matchesCount = keywords.filter(k => productText.includes(k)).length;
          
          // Fuzzy match: handles singular/plural better
          return matchesCount > 0 || productText.includes(normalizedQuery.substring(0, 4));
        });

        // Advanced sorting: most keyword matches first
        result.sort((a, b) => {
          const textA = normalize(`${a.nameAr} ${a.name} ${a.tags.join(' ')}`);
          const textB = normalize(`${b.nameAr} ${b.name} ${b.tags.join(' ')}`);
          const matchesA = keywords.filter(k => textA.includes(k)).length;
          const matchesB = keywords.filter(k => textB.includes(k)).length;
          return matchesB - matchesA;
        });
      } else if (originalQuery.length > 0) {
        // Fallback for very short queries
        result = result.filter(p => 
          normalize(p.nameAr).includes(normalizedQuery) || 
          normalize(p.name).includes(normalizedQuery)
        );
      }
    }

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }
    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc': result.sort((a, b) => a.price - b.price); break;
        case 'price_desc': result.sort((a, b) => b.price - a.price); break;
        case 'rating': result.sort((a, b) => b.rating - a.rating); break;
        case 'newest': result = result.filter((p) => p.isNew).concat(result.filter((p) => !p.isNew)); break;
        case 'popular': result.sort((a, b) => b.reviewCount - a.reviewCount); break;
      }
    }

    set({ filteredProducts: result });
  },
}));

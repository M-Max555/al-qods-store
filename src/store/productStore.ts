import { create } from 'zustand';
import type { Product, ProductFilters } from '../types';
import { productService } from '../firebase';
import { smartMatch } from '../utils/searchUtils';

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

    // 1. Search Query
    if (searchQuery.trim()) {
      result = result.filter(p => {
        const productData = `${p.nameAr} ${p.name} ${p.descriptionAr} ${p.categoryAr} ${p.brand || ''} ${p.tags.join(' ')}`;
        return smartMatch(searchQuery, productData);
      });
    }

    // 2. Category
    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    // 3. Brand (Multi-select)
    if (filters.brand && filters.brand.length > 0) {
      result = result.filter((p) => p.brand && filters.brand!.includes(p.brand));
    }

    // 4. Color (Multi-select)
    if (filters.color && filters.color.length > 0) {
      result = result.filter((p) => p.color && filters.color!.includes(p.color));
    }

    // 5. Condition (Multi-select)
    if (filters.condition && filters.condition.length > 0) {
      result = result.filter((p) => p.condition && filters.condition!.includes(p.condition));
    }

    // 6. Rating (Min rating)
    if (filters.rating !== undefined) {
      result = result.filter((p) => (p.ratingAverage || p.rating) >= filters.rating!);
    }

    // 7. Price Range
    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    // 8. Dynamic Attributes
    if (filters.attributes && Object.keys(filters.attributes).length > 0) {
      result = result.filter((p) => {
        if (!p.attributes) return false;
        return Object.entries(filters.attributes!).every(([key, values]) => {
          const productValue = p.attributes![key];
          return values.includes(String(productValue));
        });
      });
    }

    // 9. Sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc': result.sort((a, b) => a.price - b.price); break;
        case 'price_desc': result.sort((a, b) => b.price - a.price); break;
        case 'rating': result.sort((a, b) => (b.ratingAverage || b.rating) - (a.ratingAverage || a.rating)); break;
        case 'newest': result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
        case 'popular': result.sort((a, b) => b.reviewCount - a.reviewCount); break;
      }
    }

    set({ filteredProducts: result });
  },
}));

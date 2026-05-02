import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal, Search, Grid, List, X, ChevronDown, TrendingUp,
} from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useOfferStore } from '../store/offerStore';
import ProductCard from '../components/ui/ProductCard';
import { ProductGridSkeleton } from '../components/ui/LoadingSpinner';
import Breadcrumb from '../components/ui/Breadcrumb';

import { CATEGORY_OPTIONS } from '../constants/categories';

const staticCategories = CATEGORY_OPTIONS.map(cat => ({
  id: cat.key,
  nameAr: cat.label,
  icon: cat.key === 'appliances' ? '⚡' : 
        cat.key === 'kitchen' ? '🍳' : 
        cat.key === 'furniture' ? '🪑' : 
        cat.key === 'decor' ? '🛏️' : 
        cat.key === 'home_supplies' ? '🏠' : '🏷️',
  slug: cat.key
}));

const sortOptions = [
  { value: '', label: 'الافتراضي' },
  { value: 'price_asc', label: 'السعر: من الأقل' },
  { value: 'price_desc', label: 'السعر: من الأعلى' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'popular', label: 'الأكثر شعبية' },
];

const priceRanges = [
  { label: 'أقل من 1,000 ج.م', min: 0, max: 1000 },
  { label: '1,000 - 5,000 ج.م', min: 1000, max: 5000 },
  { label: '5,000 - 15,000 ج.م', min: 5000, max: 15000 },
  { label: '15,000 - 30,000 ج.م', min: 15000, max: 30000 },
  { label: 'أكثر من 30,000 ج.م', min: 30000, max: 999999 },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const {
    filteredProducts, isLoading, fetchProducts,
    setFilters, setSearchQuery, clearFilters, filters, searchQuery,
    products
  } = useProductStore();
  
  const { offers } = useOfferStore();

  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const filterParam = searchParams.get('filter') || '';
  const sortParam = searchParams.get('sort') || '';

  // 1. Compute Dynamic Filter Options
  const brands = Array.from(new Set(products.filter(p => !categoryParam || p.category === categoryParam).map(p => p.brand).filter(Boolean))) as string[];
  const colors = Array.from(new Set(products.filter(p => !categoryParam || p.category === categoryParam).map(p => p.color).filter(Boolean))) as string[];
  const conditions = Array.from(new Set(products.filter(p => !categoryParam || p.category === categoryParam).map(p => p.condition).filter(Boolean))) as string[];
  
  // Dynamic Attributes based on category
  const dynamicAttributes: Record<string, string[]> = {};
  products.filter(p => p.category === categoryParam).forEach(p => {
    if (p.attributes) {
      Object.entries(p.attributes).forEach(([key, value]) => {
        if (!dynamicAttributes[key]) dynamicAttributes[key] = [];
        const strVal = String(value);
        if (!dynamicAttributes[key].includes(strVal)) {
          dynamicAttributes[key].push(strVal);
        }
      });
    }
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const newFilters: Record<string, unknown> = { ...filters };
    if (categoryParam) newFilters.category = categoryParam;
    if (sortParam) newFilters.sortBy = sortParam;
    
    // Parse array params from URL if needed
    const brandParam = searchParams.get('brand');
    if (brandParam) newFilters.brand = brandParam.split(',');

    setFilters(newFilters as Parameters<typeof setFilters>[0]);

    if (searchParam) {
      setLocalSearch(searchParam);
      setSearchQuery(searchParam);
    }
  }, [categoryParam, searchParam, filterParam, sortParam]);

  // 2. Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchParam) {
        setSearchQuery(localSearch);
        setSearchParams((prev) => {
          if (localSearch) prev.set('search', localSearch);
          else prev.delete('search');
          return prev;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
  };

  const handleCategoryFilter = (slug: string) => {
    setFilters({ category: slug || undefined, brand: [], color: [], condition: [], attributes: {} });
    setSearchParams((prev) => {
      if (slug) prev.set('category', slug);
      else prev.delete('category');
      // Reset other filters in URL
      prev.delete('brand');
      prev.delete('color');
      prev.delete('condition');
      return prev;
    });
  };

  const toggleMultiSelect = (key: keyof typeof filters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value) 
      ? current.filter(v => v !== value) 
      : [...current, value];
    
    setFilters({ [key]: updated });
    
    setSearchParams((prev) => {
      if (updated.length > 0) prev.set(key as string, updated.join(','));
      else prev.delete(key as string);
      return prev;
    });
  };

  const toggleAttribute = (key: string, value: string) => {
    const currentAttr = filters.attributes || {};
    const currentValues = currentAttr[key] || [];
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    const updatedAttr = { ...currentAttr };
    if (updatedValues.length > 0) updatedAttr[key] = updatedValues;
    else delete updatedAttr[key];

    setFilters({ attributes: updatedAttr });
  };

  const handleSortChange = (value: string) => {
    setFilters({ sortBy: (value as Parameters<typeof setFilters>[0]['sortBy']) || undefined });
    setSearchParams((prev) => {
      if (value) prev.set('sort', value);
      else prev.delete('sort');
      return prev;
    });
  };

  const handlePriceRange = (min: number, max: number) => {
    setFilters({ minPrice: min, maxPrice: max });
  };

  const handleRatingFilter = (rating: number) => {
    setFilters({ rating: filters.rating === rating ? undefined : rating });
  };

  const handleClearAll = () => {
    clearFilters();
    setLocalSearch('');
    setSearchParams({});
  };

  const offerParam = searchParams.get('offer') || '';
  const currentOffer = offers.find(o => o.id === offerParam);

  const displayProducts = offerParam && currentOffer
    ? filteredProducts.filter((p) => currentOffer.productIds.includes(p.id))
    : filterParam === 'sale'
    ? filteredProducts.filter((p) => p.discount > 0 || p.isOffer)
    : filterParam === 'new'
    ? [...filteredProducts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : filteredProducts;

  const hasActiveFilters = !!filters.category || !!filters.minPrice || !!filters.maxPrice || !!searchQuery || 
                           (filters.brand?.length || 0) > 0 || (filters.color?.length || 0) > 0 || 
                           (filters.condition?.length || 0) > 0 || !!filters.rating || 
                           Object.keys(filters.attributes || {}).length > 0;

  return (
    <div className="min-h-screen bg-surface-container-low animate-fade-in">
      <div className="page-container py-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'المنتجات' },
          ]}
        />

        {/* Page Header */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-on-surface">
              {offerParam && currentOffer
                ? `عرض: ${currentOffer.title}`
                : categoryParam
                ? staticCategories.find((c) => c.slug === categoryParam)?.nameAr || 'المنتجات'
                : searchQuery
                ? `نتائج البحث: "${searchQuery}"`
                : filterParam === 'sale'
                ? 'العروض والتخفيضات'
                : 'جميع المنتجات'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center justify-center bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {displayProducts.length}
              </span>
              <p className="text-secondary text-sm">
                {isLoading ? 'جاري التحميل...' : 'منتج تم العثور عليه'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className={`
            fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl overflow-y-auto transition-transform duration-300 
            lg:relative lg:inset-auto lg:z-auto lg:w-64 lg:shadow-none lg:bg-transparent
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-container lg:hidden">
              <h2 className="font-bold text-on-surface">الفلاتر</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg hover:bg-surface-container">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 lg:p-0 space-y-6">
              {/* Search */}
              <div className="bg-white rounded-2xl p-4 border border-surface-container">
                <h3 className="font-bold text-on-surface mb-3 text-sm">البحث</h3>
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      placeholder="ابحث عن منتج..."
                      className="input-field pr-9 text-sm py-2.5"
                    />
                  </div>
                </form>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-2xl p-4 border border-surface-container">
                <h3 className="font-bold text-on-surface mb-3 text-sm">الأقسام</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleCategoryFilter('')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                      !filters.category
                        ? 'bg-red-50 text-red-600 font-semibold'
                        : 'text-secondary hover:bg-surface-container-low'
                    }`}
                  >
                    <span>جميع الأقسام</span>
                  </button>
                  {staticCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryFilter(cat.slug)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                        filters.category === cat.slug
                          ? 'bg-red-50 text-red-600 font-semibold'
                          : 'text-secondary hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.nameAr}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              {brands.length > 1 && (
                <div className="bg-white rounded-2xl p-4 border border-surface-container">
                  <h3 className="font-bold text-on-surface mb-3 text-sm">العلامة التجارية</h3>
                  <div className="space-y-2">
                    {brands.map((brand) => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.brand?.includes(brand)}
                          onChange={() => toggleMultiSelect('brand', brand)}
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-secondary group-hover:text-on-surface transition-colors">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="bg-white rounded-2xl p-4 border border-surface-container">
                <h3 className="font-bold text-on-surface mb-3 text-sm">نطاق السعر</h3>
                <div className="space-y-1">
                  {priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => handlePriceRange(range.min, range.max)}
                      className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-colors ${
                        filters.minPrice === range.min && filters.maxPrice === range.max
                          ? 'bg-red-50 text-red-600 font-semibold'
                          : 'text-secondary hover:bg-surface-container-low'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="bg-white rounded-2xl p-4 border border-surface-container">
                <h3 className="font-bold text-on-surface mb-3 text-sm">التقييم</h3>
                <div className="space-y-1">
                  {[4, 3, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRatingFilter(r)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                        filters.rating === r
                          ? 'bg-red-50 text-red-600 font-semibold'
                          : 'text-secondary hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        <span>{r} نجوم وأكثر</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              {conditions.length > 1 && (
                <div className="bg-white rounded-2xl p-4 border border-surface-container">
                  <h3 className="font-bold text-on-surface mb-3 text-sm">الحالة</h3>
                  <div className="space-y-2">
                    {conditions.map((cond) => (
                      <label key={cond} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.condition?.includes(cond)}
                          onChange={() => toggleMultiSelect('condition', cond)}
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-secondary group-hover:text-on-surface transition-colors">
                          {cond === 'new' ? 'جديد' : cond === 'refurbished' ? 'مجدد' : 'مستعمل'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Attributes */}
              {Object.entries(dynamicAttributes).map(([key, values]) => (
                <div key={key} className="bg-white rounded-2xl p-4 border border-surface-container">
                  <h3 className="font-bold text-on-surface mb-3 text-sm capitalize">{key}</h3>
                  <div className="space-y-2">
                    {values.map((val) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.attributes?.[key]?.includes(val)}
                          onChange={() => toggleAttribute(key, val)}
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-secondary group-hover:text-on-surface transition-colors">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearAll}
                  className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <X size={14} />
                  <span>مسح الفلاتر</span>
                </button>
              )}
            </div>
          </aside>

          {/* Mobile Backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-5 bg-white rounded-2xl p-3 border border-surface-container">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-container-high hover:border-red-300 text-sm font-medium text-on-surface hover:text-red-600 transition-colors"
                >
                  <SlidersHorizontal size={15} />
                  <span>فلتر</span>
                </button>

                {/* Active Filters Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {filters.category && (
                    <span className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-medium px-2.5 py-1 rounded-lg">
                      {staticCategories.find((c) => c.slug === filters.category)?.nameAr}
                      <button onClick={() => handleCategoryFilter('')}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {filters.brand?.map(b => (
                    <span key={b} className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-medium px-2.5 py-1 rounded-lg">
                      {b}
                      <button onClick={() => toggleMultiSelect('brand', b)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  {filters.rating && (
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-medium px-2.5 py-1 rounded-lg">
                      {filters.rating}★ +
                      <button onClick={() => handleRatingFilter(filters.rating!)}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-medium px-2.5 py-1 rounded-lg">
                      {searchQuery}
                      <button onClick={() => { setSearchQuery(''); setLocalSearch(''); }}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={filters.sortBy || ''}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none bg-surface-container-low border border-surface-container-high rounded-xl pr-3 pl-8 py-2 text-sm font-medium text-on-surface focus:outline-none focus:border-red-400 cursor-pointer"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* View Toggle */}
                <div className="flex border border-surface-container-high rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-white text-secondary hover:bg-surface-container-low'}`}
                    aria-label="عرض شبكي"
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-white text-secondary hover:bg-surface-container-low'}`}
                    aria-label="عرض قائمة"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : displayProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <Search size={32} className="text-red-600" />
                </div>
                <h3 className="font-black text-on-surface text-xl mb-2">لم نجد ما تبحث عنه بالضبط</h3>
                <p className="text-secondary text-sm mb-8 max-w-xs mx-auto">
                  جرب تغيير كلمات البحث أو مسح الفلاتر للحصول على نتائج أفضل
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <button onClick={() => setLocalSearch('ثلاجة')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all">ثلاجات</button>
                  <button onClick={() => setLocalSearch('غسالة')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all">غسالات</button>
                  <button onClick={() => setLocalSearch('بوتاجاز')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all">بوتاجازات</button>
                </div>
                <button onClick={handleClearAll} className="btn-primary px-10">
                  مسح جميع الفلاتر
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} view="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} view="list" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

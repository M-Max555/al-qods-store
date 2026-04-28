import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/ui/ProductCard';
import { ProductGridSkeleton } from '../components/ui/LoadingSpinner';

/* ─── Static Banner Data ───────────────────────────────────────────────────── */
const banners = [
  {
    id: 1,
    title: 'جهز بيتك من القدس',
    subtitle: 'كل ما تحتاجه لمنزلك من أجهزة كهربائية ومفروشات وأثاث بضمان وخدمة ما بعد البيع',
    cta: 'تسوق الآن',
    gradient: 'from-gray-900 via-gray-800 to-gray-900',
    badge: 'جديد',
  },
  {
    id: 2,
    title: 'أقوى العروض الموسمية',
    subtitle: 'خصومات تصل إلى 50% على أفضل الأجهزة الكهربائية ولوازم المطابخ',
    cta: 'تسوق العروض',
    gradient: 'from-red-800 via-red-700 to-red-900',
    badge: 'عرض محدود',
  },
  {
    id: 3,
    title: 'تجهيز العرائس من القدس',
    subtitle: 'عروض خاصة لتجهيز بيت العمر — غرف نوم، مطابخ، وأجهزة كهربائية بأفضل الأسعار',
    cta: 'ابدأ التسوق',
    gradient: 'from-gray-800 via-gray-900 to-red-900',
    badge: 'ضمان شامل',
  },
];

/* ─── Static Categories ────────────────────────────────────────────────────── */
import { CATEGORY_OPTIONS } from '../constants/categories';

const categories = CATEGORY_OPTIONS.map(cat => ({
  id: cat.key,
  nameAr: cat.label,
  slug: cat.key,
  icon: cat.key === 'appliances' ? '⚡' : 
        cat.key === 'kitchen' ? '🍳' : 
        cat.key === 'furniture' ? '🪑' : 
        cat.key === 'decor' ? '🛏️' : 
        cat.key === 'home_supplies' ? '🏠' : '🏷️'
}));

const categoryIcons: Record<string, string> = {
  appliances: 'dishwasher',
  kitchen: 'countertops',
  furniture: 'chair',
  decor: 'bed',
  home_supplies: 'home_repair_service',
  offers: 'loyalty',
};

export default function Home() {
  const [activeBanner, setActiveBanner] = useState(0);
  const navigate = useNavigate();
  const { products, isLoading, fetchProducts, clearFilters } = useProductStore();

  useEffect(() => {
    clearFilters();
    fetchProducts();
  }, [clearFilters, fetchProducts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);
  const newProducts = [...products].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 4);
  const bestOffers = products.filter((p) => p.discount > 0 || p.isOffer).slice(0, 4);

  const handleCategoryClick = (slug: string) => {
    navigate(`/products?category=${slug}`);
  };

  return (
    <div className="animate-fade-in">
      {/* ─── Hero Section ───────────────────────────────────────────────── */}
      <section className="relative h-[500px] md:h-[620px] flex items-center justify-center overflow-hidden">
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === activeBanner ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className={`w-full h-full bg-gradient-to-l ${banner.gradient} flex items-center justify-center`}>
              <div className="hero-gradient-overlay absolute inset-0" />
            </div>
          </div>
        ))}

        <div className="relative z-10 text-white text-center px-6">
          <h1 className="font-headline-xl mb-4 text-shadow">{banners[activeBanner].title}</h1>
          <p className="font-body-lg mb-8 opacity-90 max-w-2xl mx-auto">{banners[activeBanner].subtitle}</p>
          <Link
            to="/products"
            className="bg-primary-container text-white px-8 py-3 rounded-xl font-label-md hover:bg-primary transition-all active:scale-95 inline-flex items-center gap-2 shadow-lg"
          >
            <span>{banners[activeBanner].cta}</span>
          </Link>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveBanner(idx)}
              className={`transition-all duration-300 rounded-full ${idx === activeBanner ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`}
              aria-label={`البانر ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setActiveBanner((prev) => (prev - 1 + banners.length) % banners.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={() => setActiveBanner((prev) => (prev + 1) % banners.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronLeft size={20} />
        </button>
      </section>

      {/* ─── Featured Categories — High-end grid ─────────────── */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="font-headline-lg border-r-4 border-red-600 pr-4 mb-2">أقوى الأقسام</h2>
            <p className="text-gray-500 mr-5 text-sm">تصفح أفضل المنتجات المختارة لك</p>
          </div>
          <Link to="/products" className="flex items-center gap-2 text-red-600 font-black hover:text-red-700 transition-all group">
            <span>عرض كل الأقسام</span>
            <ArrowLeft size={18} className="rtl-flip group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link to="/products?category=appliances" className="relative rounded-3xl overflow-hidden h-80 group cursor-pointer block shadow-lg shadow-gray-200">
            <img 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              alt="الأجهزة الكهربائية" 
              src="/assets/appliances-cat.png" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-white font-black text-2xl">الأجهزة الكهربائية</h3>
              <p className="text-red-100 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">أحدث الثلاجات والغسالات والبوتاجازات</p>
            </div>
          </Link>

          <Link to="/products?category=kitchen" className="relative rounded-3xl overflow-hidden h-80 group cursor-pointer block shadow-lg shadow-gray-200">
            <img 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              alt="لوازم المطابخ" 
              src="/assets/kitchen-cat.png" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-white font-black text-2xl">لوازم المطابخ</h3>
              <p className="text-red-100 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">كل ما تحتاجه لطبخ أشهى الوجبات</p>
            </div>
          </Link>

          <Link to="/products?category=home_supplies" className="relative rounded-3xl overflow-hidden h-80 group cursor-pointer block shadow-lg shadow-gray-200">
            <img 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              alt="لوازم المنزل" 
              src="/assets/home-cat.png" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-white font-black text-2xl">لوازم المنزل</h3>
              <p className="text-red-100 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">أرقى المفروشات ولوازم البيت العصري</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── Req #3: Categories — EXACTLY 5, circular icons ────────────── */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-headline-lg mb-2">تسوق حسب القسم</h2>
            <p className="text-secondary font-body-md">كل ما تحتاجه لمنزلك في مكان واحد</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-8 max-w-3xl mx-auto">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                onClick={() => handleCategoryClick(cat.slug)}
                className="flex flex-col items-center gap-3 sm:gap-4 group cursor-pointer"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:bg-red-600 transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl text-red-600 group-hover:text-white transition-colors">
                    {categoryIcons[cat.slug] || 'category'}
                  </span>
                </div>
                <span className="font-label-md text-center text-sm">{cat.nameAr}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products Section ────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-headline-lg mb-8 border-r-4 border-red-600 pr-4">منتجات مميزة</h2>
          {isLoading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── Latest Products Section ───────────────────────────────────── */}
      <section className="py-16 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-headline-lg mb-8 border-r-4 border-red-600 pr-4">وصلنا حديثاً</h2>
          {isLoading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Flash Sale Banner ──────────────────────────────────────────── */}
      <section className="py-6">
        <div className="page-container">
          <div className="bg-gradient-to-l from-red-600 via-red-700 to-red-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={18} className="text-yellow-300" />
                  <span className="text-yellow-300 font-bold text-sm">عرض محدود</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-1">تخفيضات حصرية</h2>
                <p className="text-red-100 text-sm">خصومات تصل إلى 50% على منتجات مختارة</p>
              </div>
              <Link
                to="/products?filter=sale"
                className="flex items-center gap-2 bg-white text-red-700 font-bold px-5 py-3 rounded-2xl hover:bg-red-50 transition-all active:scale-95 whitespace-nowrap"
              >
                <span>تسوق الآن</span>
                <ArrowLeft size={14} className="rtl-flip" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Best Offers Section ───────────────────────────────────────── */}
      {bestOffers.length > 0 && (
        <section className="py-12">
          <div className="page-container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline-lg border-r-4 border-red-600 pr-4">أقوى التخفيضات</h2>
              <Link
                to="/products?filter=sale"
                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold text-sm border border-red-200 hover:border-red-400 px-4 py-2 rounded-xl transition-all"
              >
                <span>عرض الكل</span>
                <ArrowLeft size={14} className="rtl-flip" />
              </Link>
            </div>
            {isLoading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {bestOffers.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Req #5: CTA — "احصل على عرضك الآن" (sales-focused) ────────── */}
      <section className="py-12 bg-red-600">
        <div className="page-container">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">احصل على عرضك الآن</h2>
            <p className="text-red-100 mb-6 text-sm">أدخل رقم هاتفك وسنتواصل معك بأفضل العروض والأسعار الحصرية</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="tel"
                placeholder="أدخل رقم هاتفك"
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-white placeholder-red-200 focus:outline-none focus:border-white text-sm"
              />
              <button className="bg-white text-red-700 hover:bg-red-50 font-bold px-5 py-3 rounded-xl transition-all active:scale-95 text-sm whitespace-nowrap">
                أرسل الآن
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


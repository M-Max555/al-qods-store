import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Clock, Percent } from 'lucide-react';
import { useOfferStore } from '../store/offerStore';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/ui/ProductCard';

export default function Offers() {
  const { offers, isLoading: offersLoading, fetchActiveOffers } = useOfferStore();
  const { products, isLoading: productsLoading, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchActiveOffers();
    fetchProducts();
  }, []);

  const autoOffers = products.filter(p => p.discount > 0 || p.isOffer);
  const isLoading = offersLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider inline-block mb-4">
            تخفيضات حصرية
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">عروض القدس المميزة</h1>
          <p className="text-gray-600">اكتشف أحدث العروض والخصومات على تشكيلة واسعة من الأجهزة الكهربائية والمفروشات.</p>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Tag size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد عروض حالياً</h3>
            <p className="text-gray-500 mb-6">يرجى العودة لاحقاً لمتابعة أحدث العروض.</p>
            <Link to="/products" className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors inline-block font-bold">
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {offers.map(offer => (
              <div key={offer.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-shadow flex flex-col md:flex-row">
                
                <div className="md:w-2/5 relative h-48 md:h-auto shrink-0 bg-zinc-900">
                  <img 
                    src={offer.image || 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=80'} 
                    alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                    <Tag size={16} />
                    <span>خصم {offer.discountPercentage}%</span>
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-red-500 mb-3 text-sm font-semibold">
                    <Clock size={16} />
                    <span>ينتهي في: {new Date(offer.expiresAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{offer.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">
                    {offer.description}
                  </p>
                  
                  <Link 
                    to={`/products?offer=${offer.id}`} // We can filter by offer ID in products later if needed, or just link to generic sales
                    className="bg-gray-900 text-white text-center px-6 py-3 rounded-xl hover:bg-red-600 transition-colors font-bold mt-auto"
                  >
                    عرض المنتجات المشمولة ({offer.productIds.length})
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Automatic Offers Section */}
        {autoOffers.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-3 border-r-4 border-red-600 pr-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                  <Percent size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">تخفيضات فورية</h2>
                  <p className="text-gray-500 text-sm">منتجات عليها خصومات كبيرة الآن</p>
                </div>
              </div>
              <Link 
                to="/products?filter=sale" 
                className="bg-white border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-6 py-2.5 rounded-xl transition-all font-bold text-center"
              >
                تصفح كل الخصومات
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {autoOffers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

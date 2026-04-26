import { useFavoriteStore } from '../store/favoriteStore';
import ProductCard from '../components/ui/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function Favorites() {
  const { favorites } = useFavoriteStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <Breadcrumb items={[
        { label: 'الرئيسية', href: '/' },
        { label: 'المفضلة' }
      ]} />

      <div className="mt-8">
        <div className="flex items-center gap-4 mb-10 border-r-4 border-red-600 pr-4">
          <Heart className="text-red-600 fill-red-600" size={32} />
          <div>
            <h1 className="text-3xl font-black text-gray-900">منتجاتي المفضلة</h1>
            <p className="text-gray-500">قائمة المنتجات التي نالت إعجابك وترغب في شرائها لاحقاً</p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={48} className="text-red-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">قائمة المفضلة فارغة</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">لم تقم بإضافة أي منتجات إلى مفضلتك بعد. ابدأ بالتسوق الآن وأضف ما يعجبك!</p>
            <Link 
              to="/products" 
              className="bg-red-600 text-white px-8 py-3 rounded-2xl hover:bg-red-700 transition-all font-bold shadow-lg shadow-red-200 inline-flex items-center gap-2"
            >
              <ShoppingBag size={20} />
              <span>ابدأ التسوق الآن</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

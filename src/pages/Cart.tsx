import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal, getSubtotal, getShippingCost } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">السلة فارغة حالياً</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">يبدو أنك لم تقم بإضافة أي منتجات إلى سلة التسوق الخاصة بك بعد.</p>
        <Link to="/products" className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 transition-all inline-block shadow-lg shadow-red-100">
          تصفح المنتجات الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 bg-gray-50/50 min-h-screen">
      <Breadcrumb items={[
        { label: 'الرئيسية', href: '/' },
        { label: 'سلة التسوق' }
      ]} />

      <h1 className="text-3xl font-black text-gray-900 mt-8 mb-12">سلة التسوق الخاصة بك</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-all">
              <div className="w-full sm:w-32 h-32 flex-shrink-0">
                <img 
                  src={product.images[0]} 
                  alt={product.nameAr} 
                  className="w-full h-full object-cover rounded-2xl border border-gray-50"
                />
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{product.nameAr}</h3>
                    <button 
                      onClick={() => removeItem(product.id)}
                      className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-bold">{product.category}</p>
                </div>

                <div className="flex items-center justify-between mt-4 sm:mt-0">
                  <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                    <button 
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all shadow-sm border border-gray-100"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-black text-lg w-6 text-center">{quantity}</span>
                    <button 
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all shadow-sm border border-gray-100 disabled:opacity-30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-red-600">{formatPrice((product.finalPrice || product.price) * quantity)}</p>
                    <p className="text-xs text-gray-400 font-bold">سعر القطعة: {formatPrice(product.finalPrice || product.price)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Side */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="text-xl font-black text-gray-900 mb-6">ملخص الطلب</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600 font-bold">
                <span>المجموع الفرعي</span>
                <span>{formatPrice(getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-bold">
                <span>الشحن</span>
                <span className={getShippingCost() === 0 ? 'text-green-600' : ''}>
                  {getShippingCost() === 0 ? 'مجاني 🎉' : formatPrice(getShippingCost())}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center font-black text-2xl text-gray-900">
                <span>الإجمالي</span>
                <span className="text-red-600">{formatPrice(getTotal())}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3 active:scale-95"
            >
              <span>إتمام الشراء</span>
              <ArrowLeft size={24} className="rtl-flip" />
            </button>
            
            <Link 
              to="/products" 
              className="w-full mt-4 flex items-center justify-center gap-2 text-gray-500 font-bold hover:text-gray-900 transition-all text-sm"
            >
              <span>متابعة التسوق</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

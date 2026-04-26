import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Tag, Loader2 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../utils/format';
import { couponService } from '../../firebase/services/couponService';
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const {
    items, isOpen, closeCart, removeItem, updateQuantity,
    getSubtotal, getShippingCost, getTotal, getItemCount,
    couponCode, couponDiscount, removeCoupon
  } = useCartStore();

  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotal();
  const itemCount = getItemCount();
  const discountAmount = couponDiscount > 0 ? (subtotal * couponDiscount) / 100 : 0;

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    if (!isAuthenticated() || !user) {
      closeCart();
      navigate('/login');
      return;
    }

    closeCart();
    navigate('/checkout');
  };

  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const { applyCoupon } = useCartStore();

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const coupon = await couponService.validateCoupon(couponInput.trim(), user.id);
      if (coupon) {
        applyCoupon(coupon.code, coupon.discount);
        toast.success('تم تطبيق الكوبون بنجاح 🎉');
        setCouponInput('');
      } else {
        toast.error('الكوبون غير صحيح أو منتهي الصلاحية');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء التحقق من الكوبون');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 left-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <ShoppingCart size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">سلة التسوق</h2>
              <p className="text-xs text-gray-500">{itemCount} منتج</p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">السلة فارغة</h3>
              <p className="text-gray-400 text-sm mb-5">أضف بعض المنتجات للمتابعة</p>
              <button
                onClick={closeCart}
                className="btn-primary text-sm"
              >
                تسوق الآن
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-red-50/30 transition-colors group"
                >
                  {/* Product Image */}
                  <div className="w-18 h-18 flex-shrink-0">
                    <img
                      src={product.images[0]}
                      alt={product.nameAr}
                      className="w-[70px] h-[70px] object-cover rounded-xl"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                      {product.nameAr}
                    </h4>
                    <p className="text-red-600 font-bold text-sm">
                      {formatPrice(product.finalPrice || product.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-colors"
                        aria-label="تقليل"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-sm font-bold text-gray-900 min-w-[20px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="زيادة"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(product.id)}
                    className="opacity-0 group-hover:opacity-100 self-start p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all"
                    aria-label="حذف من السلة"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-white px-5 py-4 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
            {/* Coupon Section */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 mr-1">كوبون الخصم</p>
              
              {couponCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-green-600" />
                    <div>
                      <span className="text-sm font-bold text-green-700 block leading-none">{couponCode}</span>
                      <span className="text-[10px] text-green-600">تم تطبيق الخصم بنجاح 🎉</span>
                    </div>
                  </div>
                  <button 
                    onClick={removeCoupon}
                    className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="أدخل الكود هنا"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm font-bold tracking-wider"
                    />
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidatingCoupon ? <Loader2 size={18} className="animate-spin" /> : 'تطبيق'}
                  </button>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-gray-600">
                <span>المجموع الفرعي</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>الخصم ({couponDiscount}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>الشحن</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>
                  {shipping === 0 ? 'مجاني 🎉' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-orange-500">
                  أضف {formatPrice(500 - subtotal)} للحصول على شحن مجاني
                </p>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>الإجمالي</span>
                <span className="text-red-600">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleCheckout}
                className="btn-primary text-center text-sm py-3 flex items-center justify-center gap-2 w-full"
              >
                <span>إتمام الطلب</span>
                <ArrowLeft size={16} className="rtl-flip" />
              </button>
              <Link
                to="/cart"
                onClick={closeCart}
                className="btn-secondary text-center text-sm py-2.5"
              >
                عرض السلة الكاملة
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  MapPin, 
  CreditCard, 
  ShoppingBag, 
  Tag, 
  CheckCircle2, 
  Loader2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { couponService } from '../firebase/services/couponService';
import { orderService } from '../firebase/services/orderService';
import { formatPrice } from '../utils/format';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    items, getSubtotal, getShippingCost, getTotal, 
    couponCode, couponDiscount, applyCoupon, removeCoupon, clearCart 
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState(user?.location?.address || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotal();
  const discountAmount = couponDiscount > 0 ? (subtotal * couponDiscount) / 100 : 0;

  // Protect route
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else if (items.length === 0) {
      navigate('/products');
    }
  }, [isAuthenticated, items.length, navigate]);

  // Auto-fill coupon if user has one from registration
  useEffect(() => {
    if (user?.coupon && !user.hasUsedCoupon && !couponCode) {
      setCouponInput(user.coupon);
    }
  }, [user, couponCode]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!user) return;

    setIsValidating(true);
    try {
      const coupon = await couponService.validateCoupon(couponInput.trim(), user.id);
      if (coupon) {
        applyCoupon(coupon.code, coupon.discount);
        toast.success('تم تطبيق الخصم بنجاح 🎉');
      } else {
        toast.error('كود غير صالح أو تم استخدامه');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء التحقق من الكوبون');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!user) return;
    if (!address.trim()) {
      toast.error('من فضلك أدخل العنوان بالتفصيل');
      return;
    }
    if (!phone.trim()) {
      toast.error('من فضلك أدخل رقم الهاتف');
      return;
    }
    setIsSubmitting(true);

    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        name: item.product.nameAr,
        price: item.product.finalPrice || item.product.price,
        quantity: item.quantity,
        image: item.product.images[0]
      }));

      await orderService.createOrder({
        userId: user.id,
        items: orderItems,
        totalPrice: total,
        shippingCost: shipping,
        paymentMethod: 'cod',
        paymentStatus: 'unpaid',
        address: address.trim(),
        phone: phone.trim(),
      });

      // Mark coupon as used if applied
      if (couponCode) {
        await couponService.markCouponAsUsed(couponCode, user.id);
      }

      await clearCart();
      toast.success('تم إرسال طلبك بنجاح! 🎉');
      
      // WhatsApp notification
      const productLines = items.map(item => `- ${item.product.nameAr} (عدد ${item.quantity})`).join('\n');
      const message = `طلب جديد من موقع القدس 🔥🛒
      
الاسم: ${user.firstName} ${user.lastName}
رقم الهاتف: ${phone}
العنوان: ${address}

المنتجات:
${productLines}

الإجمالي: ${formatPrice(total)}
طريقة الدفع: عند الاستلام`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappURL = `https://wa.me/201020733671?text=${encodedMessage}`;
      
      window.open(whatsappURL, '_blank');
      navigate('/');
    } catch (err) {
      toast.error('حدث خطأ أثناء إتمام الطلب');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-10" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-red-600 transition-colors">الرئيسية</Link>
          <ChevronRight size={14} />
          <Link to="/products" className="hover:text-red-600 transition-colors">السلة</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-bold">الدفع</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <h2 className="text-xl font-black">معلومات التوصيل</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">الاسم بالكامل</p>
                  <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                </div>
                <div className="space-y-4 md:col-span-2">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs text-gray-400 mb-1 block">رقم الهاتف للتواصل *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="رقم الهاتف"
                      className="w-full bg-transparent font-bold text-gray-900 outline-none placeholder:text-gray-300"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs text-gray-400 mb-1 block">عنوان التوصيل بالتفصيل *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="العنوان بالتفصيل (المدينة - الشارع - رقم البيت)"
                      className="w-full bg-transparent font-bold text-gray-900 outline-none placeholder:text-gray-300 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-xl font-black">طريقة الدفع</h2>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <CheckCircle2 className="text-red-600" size={24} />
                <div>
                  <p className="font-bold text-gray-900">الدفع عند الاستلام (COD)</p>
                  <p className="text-sm text-red-600 font-medium">ادفع كاش لما المنتج يوصل لحد باب بيتك</p>
                </div>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <h2 className="text-xl font-black">مراجعة المنتجات</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.product.id} className="py-4 flex gap-4">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.nameAr}
                      className="w-20 h-20 object-cover rounded-xl border border-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{item.product.nameAr}</h4>
                      <p className="text-sm text-gray-500 mt-1">الكمية: {item.quantity}</p>
                      <p className="text-red-600 font-black mt-1">{formatPrice((item.product.finalPrice || item.product.price) * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary / Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24">
              <h3 className="text-lg font-black mb-6 border-b border-gray-50 pb-4">ملخص الطلب</h3>
              
              {/* Coupon Section */}
              <div className="mb-6 space-y-3">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Tag size={16} className="text-red-600" />
                  هل لديك كود خصم؟
                </label>
                
                {couponCode ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-green-600" />
                      <div>
                        <span className="text-sm font-black text-green-700 block leading-none">{couponCode}</span>
                        <span className="text-[10px] text-green-600">تم تطبيق خصم 5% 🎉</span>
                      </div>
                    </div>
                    <button 
                      onClick={removeCoupon}
                      className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="أدخل الكود هنا"
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-bold font-mono uppercase tracking-widest"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isValidating || !couponInput.trim()}
                      className="px-6 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50"
                    >
                      {isValidating ? <Loader2 size={18} className="animate-spin" /> : 'تطبيق'}
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>المجموع الفرعي</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>خصم الكوبون (5%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>تكلفة الشحن</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>
                    {shipping === 0 ? 'مجاني 🎉' : formatPrice(shipping)}
                  </span>
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">الإجمالي النهائي</p>
                    {discountAmount > 0 && (
                      <p className="text-sm text-gray-300 line-through mb-1">{formatPrice(subtotal + shipping)}</p>
                    )}
                    <p className="text-2xl font-black text-gray-900 leading-none">{formatPrice(total)}</p>
                  </div>
                  <div className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-full">
                    الدفع عند الاستلام
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3 active:scale-95 transform"
              >
                {isSubmitting ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <span>تأكيد الطلب والشراء</span>
                    <ArrowRight size={20} className="rtl-flip" />
                  </>
                )}
              </button>
              
              <p className="mt-4 text-[10px] text-gray-400 text-center px-4 leading-relaxed">
                بالضغط على تأكيد الطلب، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمعرض القدس.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

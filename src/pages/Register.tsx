import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, MapPin, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userService } from '../firebase/services/userService';
import { couponService } from '../firebase/services/couponService';
import type { RegisterData } from '../types';
import toast from 'react-hot-toast';
import CouponModal from '../components/ui/CouponModal';

export default function Register() {
  const [form, setForm] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    phone: '',
    location: null,
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [isLocating, setIsLocating] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState('');

  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const update = (key: string, val: any) => setForm((prev) => ({ ...prev, [key]: val }));

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error("متصفحك لا يدعم تحديد الموقع");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=ar`;
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.status === 'OK' && data.results.length > 0) {
            const address = data.results[0].formatted_address;
            update('location', { lat: latitude, lng: longitude, address });
          } else {
            throw new Error(data.error_message || 'تعذر تحديد العنوان');
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          update('location', { 
            lat: latitude, 
            lng: longitude, 
            address: `تم تحديد الإحداثيات (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` 
          });
        } finally {
          setIsLocating(false);
        }
      },
      (_error) => {
        setIsLocating(false);
        toast.error("من فضلك فعل تحديد الموقع علشان نحدد أقرب خدمة ليك");
      }
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location) {
      toast.error("من فضلك حدد موقعك أولاً");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    clearError();
    
    try {
      // Step 1: Check if email or phone exists
      const existingEmail = await userService.getUserByEmail(form.email);
      if (existingEmail) {
        toast.error("البريد الإلكتروني مسجل مسبقاً");
        return;
      }

      const existingPhone = await userService.getUserByPhone(form.phone);
      if (existingPhone) {
        toast.error("رقم الهاتف مسجل مسبقاً");
        return;
      }

      // Step 2: Register User
      const user = await register(form);
      if (user) {
        toast.success("تم إنشاء الحساب بنجاح! 🎉");
        
        // Step 3: Generate Coupon
        const code = await couponService.createCoupon(user.id, user.email, user.phone);
        setGeneratedCoupon(code);
        setShowCouponModal(true);
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      toast.error("حدث خطأ أثناء إنشاء الحساب");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-slide-up">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
            <UserPlus size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">إنشاء حساب جديد</h1>
          <p className="text-gray-500 mt-2 font-medium">سجّل الآن واحصل على خصم 5% فوراً 🎁</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-2xl px-4 py-4 mb-6 border border-red-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">الاسم الأول</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                placeholder="أحمد"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">اسم العائلة</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                placeholder="علي"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">رقم الهاتف</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm font-mono"
              placeholder="01xxxxxxxxx"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 mb-1 px-1 text-right">الموقع الحالي</label>
            <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
              form.location ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                form.location ? 'bg-green-100 text-green-600' : 'bg-white text-gray-300'
              }`}>
                {isLocating ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                {form.location ? (
                  <p className="text-sm text-gray-800 font-medium truncate">{form.location.address}</p>
                ) : (
                  <p className="text-xs text-gray-400">يرجى تحديد موقعك لتوصيل أسرع</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={fetchLocation}
              disabled={isLocating}
              className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all text-xs font-bold flex items-center justify-center gap-2"
            >
              {isLocating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
              تحديد الموقع تلقائياً
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                  placeholder="••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">تأكيد المرور</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:opacity-50 mt-4 active:scale-95 transform"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'إنشاء حساب واستلام الهدية 🎁'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-red-600 hover:underline font-bold">تسجيل الدخول</Link>
        </div>
      </div>

      <CouponModal 
        isOpen={showCouponModal} 
        onClose={() => {
          setShowCouponModal(false);
          navigate('/');
        }} 
        couponCode={generatedCoupon} 
      />
    </div>
  );
}





import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, Phone, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [isLocating, setIsLocating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleUpdateLocation = () => {
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
            const newLocation = { lat: latitude, lng: longitude, address };
            
            // Save to Firestore
            setIsUpdating(true);
            const userRef = doc(db, 'users', user!.id);
            await updateDoc(userRef, { location: newLocation });
            
            // Update local state
            setUser({ ...user!, location: newLocation });
            toast.success("تم تحديث الموقع بنجاح");
          } else {
            throw new Error(data.error_message || 'تعذر تحديد العنوان');
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          toast.error("فشل في تحديد العنوان، تأكد من مفتاح الخريطة");
        } finally {
          setIsLocating(false);
          setIsUpdating(false);
        }
      },
      (_error) => {
        setIsLocating(false);
        toast.error("من فضلك فعل تحديد الموقع علشان نحدد أقرب خدمة ليك");
      }
    );
  };

  const handleLanguageChange = async (lang: 'ar' | 'en') => {
    if (user.language === lang) return;
    try {
      const userRef = doc(db, 'users', user!.id);
      await updateDoc(userRef, { language: lang });
      setUser({ ...user, language: lang });
      localStorage.setItem('alquds_lang', lang);
      toast.success(lang === 'ar' ? 'تم تغيير اللغة للعربية' : 'Language changed to English');
      // In a real app, this would trigger i18n reload
    } catch (err) {
      toast.error('حدث خطأ أثناء تغيير اللغة');
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    if (user.theme === theme) return;
    try {
      const userRef = doc(db, 'users', user!.id);
      await updateDoc(userRef, { theme });
      setUser({ ...user, theme });
      localStorage.setItem('alquds_theme', theme);
      
      // Apply theme instantly
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      toast.success(theme === 'dark' ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري');
    } catch (err) {
      toast.error('حدث خطأ أثناء تغيير المظهر');
    }
  };


  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowRight size={20} />
          <span>العودة</span>
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-red-600 p-8 text-white relative">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl overflow-hidden">
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=fff&color=d32f2f&size=128`} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-3xl font-black">{user.firstName} {user.lastName}</h1>
                <p className="text-red-100 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  {user.role === 'admin' ? 'مدير النظام' : 'عميل مميز'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* User Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Mail size={14} /> البريد الإلكتروني
                </label>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 font-medium">
                  {user.email}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Phone size={14} /> رقم الهاتف
                </label>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 font-medium">
                  {user.phone || 'غير محدد'}
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4 pt-4 border-t border-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={22} className="text-red-600" /> عنوان الشحن الحالي
                </h2>
              </div>

              <div className={`p-6 rounded-3xl border-2 transition-all duration-300 ${
                user.location ? 'bg-red-50/30 border-red-100' : 'bg-gray-50 border-gray-200'
              }`}>
                {user.location ? (
                  <div className="space-y-3">
                    <p className="text-lg text-gray-800 font-medium leading-relaxed">
                      {user.location.address}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-400 font-mono">
                      <span>Lat: {user.location.lat.toFixed(6)}</span>
                      <span>Lng: {user.location.lng.toFixed(6)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">لم يتم تحديد موقعك بعد</p>
                )}
              </div>

              <button
                onClick={handleUpdateLocation}
                disabled={isLocating || isUpdating}
                className="w-full group flex items-center justify-center gap-3 py-4 px-6 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none transform active:scale-95"
              >
                {isLocating || isUpdating ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <MapPin size={22} className="group-hover:animate-bounce" />
                )}
                <span className="font-bold text-lg">
                  {isLocating ? 'جاري تحديد موقعك...' : isUpdating ? 'جاري الحفظ...' : 'تحديث الموقع الحالي'}
                </span>
              </button>
            </div>

            {/* Settings Section (Req #3) */}
            <div className="space-y-6 pt-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">settings</span> الإعدادات
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Language Switch */}
                <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-red-100 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">language</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">اللغة</p>
                        <p className="text-xs text-gray-500">اختر لغة الموقع</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleLanguageChange('ar')}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                        (user.language || 'ar') === 'ar' 
                        ? 'bg-red-600 text-white shadow-md' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      العربية
                    </button>
                    <button 
                      onClick={() => handleLanguageChange('en')}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                        user.language === 'en' 
                        ? 'bg-red-600 text-white shadow-md' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Theme Switch */}
                <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-red-100 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <span className="material-symbols-outlined">
                          {user.theme === 'dark' ? 'dark_mode' : 'light_mode'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">المظهر</p>
                        <p className="text-xs text-gray-500">الوضع الليلي / النهاري</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleThemeChange('light')}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                        (user.theme || 'light') === 'light' 
                        ? 'bg-zinc-900 text-white shadow-md' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      نهاري
                    </button>
                    <button 
                      onClick={() => handleThemeChange('dark')}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                        user.theme === 'dark' 
                        ? 'bg-zinc-900 text-white shadow-md' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      ليلي
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400">
              * يتم حفظ إعداداتك تلقائياً وتطبيقها فوراً
            </p>
          </div>
        </div>
      </div>
    </div>

  );
}

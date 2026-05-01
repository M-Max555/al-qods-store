import { useAuthStore } from '../../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firestore';
import { Moon, Sun, Languages, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsSection({ isCompact = false }: { isCompact?: boolean }) {
  const { user, setUser } = useAuthStore();

  if (!user) return null;

  const handleLanguageChange = async (lang: 'ar' | 'en') => {
    if (user.language === lang) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { language: lang });
      setUser({ ...user, language: lang });
      localStorage.setItem('alquds_lang', lang);
      
      if (lang === 'en') {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.classList.add('lang-en');
      } else {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.classList.remove('lang-en');
      }
      
      toast.success(lang === 'ar' ? 'تم تغيير اللغة للعربية' : 'Language changed to English');
    } catch (err) {
      toast.error('حدث خطأ أثناء تغيير اللغة');
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    if (user.theme === theme) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { theme });
      setUser({ ...user, theme });
      localStorage.setItem('alquds_theme', theme);
      
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

  if (isCompact) {
    return (
      <div className="space-y-4 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            <Languages size={16} />
            <span className="text-sm font-medium">اللغة / Language</span>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => handleLanguageChange('ar')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${user.language !== 'en' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
            >
              AR
            </button>
            <button 
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${user.language === 'en' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            {user.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            <span className="text-sm font-medium">المظهر / Theme</span>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => handleThemeChange('light')}
              className={`p-1.5 rounded-md transition-all ${user.theme !== 'dark' ? 'bg-white shadow-sm text-amber-500' : 'text-gray-500'}`}
            >
              <Sun size={14} />
            </button>
            <button 
              onClick={() => handleThemeChange('dark')}
              className={`p-1.5 rounded-md transition-all ${user.theme === 'dark' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              <Moon size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Language Toggle */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
            <Languages size={24} />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-lg">اللغة مفضلة</h3>
            <p className="text-sm text-gray-500">اختر لغة عرض الموقع</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleLanguageChange('ar')}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${
              (user.language || 'ar') === 'ar'
                ? 'bg-red-600 text-white shadow-lg shadow-red-100'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {(user.language || 'ar') === 'ar' && <Check size={18} />}
            <span>العربية</span>
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${
              user.language === 'en'
                ? 'bg-red-600 text-white shadow-lg shadow-red-100'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {user.language === 'en' && <Check size={18} />}
            <span>English</span>
          </button>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
            user.theme === 'dark' ? 'bg-zinc-800 text-blue-400' : 'bg-orange-50 text-orange-600'
          }`}>
            {user.theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-lg">مظهر الموقع</h3>
            <p className="text-sm text-gray-500">الوضع الليلي أو النهاري</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${
              (user.theme || 'light') === 'light'
                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {(user.theme || 'light') === 'light' && <Check size={18} />}
            <span>نهاري</span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${
              user.theme === 'dark'
                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {user.theme === 'dark' && <Check size={18} />}
            <span>ليلي</span>
          </button>
        </div>
      </div>
    </div>
  );
}

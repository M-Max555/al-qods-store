import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { userService } from '../firebase/services/userService';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function SetupOwnerPage() {
  const { user, setUser } = useAuthStore();
  const [isPromoting, setIsPromoting] = useState(false);
  const navigate = useNavigate();

  const handlePromoteToOwner = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!confirm('هل تريد ترقية حسابك إلى "صاحب الموقع" (Owner)؟ ستحصل على كامل الصلاحيات.')) return;

    setIsPromoting(true);
    try {
      await userService.updateUserRole(user.id, 'owner');
      setUser({ ...user, role: 'owner' });
      toast.success('تمت ترقية حسابك لصاحب الموقع بنجاح! 🎉');
      setTimeout(() => navigate('/admin'), 2000);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء الترقية');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Link to="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft size={20} className="rtl-flip" />
        <span>العودة للوحة التحكم</span>
      </Link>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck size={40} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900">إعداد صاحب الموقع</h1>
          <p className="text-gray-500">
            أهلاً بك في نظام القدس. من هنا يمكنك ترقية حسابك الحالي ليكون حساب "المالك" أو "صاحب الموقع" (Owner).
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-800 text-sm text-right">
          <strong>تنبيه:</strong> حساب Owner يمتلك صلاحيات كاملة بما في ذلك إدارة المديرين والمستخدمين الآخرين. لا تقم بهذه الخطوة إلا لحسابك الشخصي الأساسي.
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">الحساب الحالي:</p>
          <p className="font-bold text-gray-900">{user?.name} ({user?.email})</p>
          <p className="text-xs text-red-600 mt-1 font-bold">الرتبة الحالية: {user?.role}</p>
        </div>

        <button
          onClick={handlePromoteToOwner}
          disabled={isPromoting || user?.role === 'owner'}
          className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transform"
        >
          {isPromoting ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <ShieldCheck size={24} />
              <span>{user?.role === 'owner' ? 'أنت صاحب الموقع بالفعل' : 'ترقية حسابي لصاحب الموقع'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

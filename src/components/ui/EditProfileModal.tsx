import { useState } from 'react';
import { X, User, Phone, Loader2, Check } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface ModalProps {
  onClose: () => void;
}

/* ─── Shared Modal Shell ───────────────────────────────────────────────────── */
function ModalShell({ title, icon, onClose, children }: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              {icon}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* ─── Change Name Modal ─────────────────────────────────────────────────────── */
export function ChangeNameModal({ onClose }: ModalProps) {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ChangeNameModal] Submit clicked', { firstName, lastName });

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('الاسم لا يمكن أن يكون فارغاً');
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      const updates = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`
      };
      await updateDoc(userRef, updates);
      setUser({ ...user, ...updates });
      toast.success('تم تحديث الاسم بنجاح 👌');
      onClose();
    } catch (err) {
      console.error('[ChangeNameModal] Error:', err);
      toast.error('حصل مشكلة حاول تاني');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalShell title="تغيير الاسم" icon={<User size={20} />} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم الأول</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
            placeholder="الاسم الأول"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم العائلة</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
            placeholder="اسم العائلة"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            إلغاء
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── Change Phone Modal ────────────────────────────────────────────────────── */
export function ChangePhoneModal({ onClose }: ModalProps) {
  const { user, setUser } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const isValidPhone = (p: string) => /^01[0-2,5]\d{8}$/.test(p.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ChangePhoneModal] Submit clicked', { phone });

    if (!phone.trim()) {
      toast.error('رقم الهاتف لا يمكن أن يكون فارغاً');
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error('رقم الهاتف غير صحيح، يجب أن يبدأ بـ 01 ويتكون من 11 رقم');
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { phone: phone.trim() });
      setUser({ ...user, phone: phone.trim() });
      toast.success('تم تحديث رقم الهاتف بنجاح 👌');
      onClose();
    } catch (err) {
      console.error('[ChangePhoneModal] Error:', err);
      toast.error('حصل مشكلة حاول تاني');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalShell title="تغيير رقم الهاتف" icon={<Phone size={20} />} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهاتف الجديد</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
            placeholder="01xxxxxxxxx"
            maxLength={11}
            required
          />
          <p className="text-xs text-gray-400 mt-1.5">مثال: 01012345678</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            إلغاء
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

import { useState, useEffect } from 'react';
import { userService } from '../firebase/services/userService';
import type { User } from '../types';
import toast from 'react-hot-toast';
import { Search, ShieldMinus, UserPlus } from 'lucide-react';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setAdmins(allUsers.filter(u => u.role === 'admin'));
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل المديرين');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    try {
      const user = await userService.getUserByEmail(searchEmail.trim());
      if (!user) {
        toast.error('لم يتم العثور على مستخدم بهذا البريد الإلكتروني');
        return;
      }
      if (user.role === 'admin') {
        toast.error('هذا المستخدم مدير بالفعل');
        return;
      }

      await userService.updateUserRole(user.id, 'admin');
      toast.success('تمت إضافة المدير بنجاح');
      setSearchEmail('');
      fetchAdmins();
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة المدير');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('هل أنت متأكد من إزالة صلاحيات المدير؟')) return;
    
    try {
      await userService.updateUserRole(userId, 'user');
      toast.success('تمت إزالة المدير بنجاح');
      fetchAdmins();
    } catch (error) {
      toast.error('حدث خطأ أثناء إزالة المدير');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المديرين</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">إضافة مدير جديد</h2>
        <form onSubmit={handleAddAdmin} className="flex gap-3 max-w-lg">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="ابحث بالبريد الإلكتروني للمستخدم..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlus size={20} />
            <span>إضافة</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">الاسم</th>
                <th className="p-4 font-semibold text-gray-600">البريد الإلكتروني</th>
                <th className="p-4 font-semibold text-gray-600">رقم الهاتف</th>
                <th className="p-4 font-semibold text-gray-600">تاريخ الانضمام</th>
                <th className="p-4 font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">لا يوجد مديرين</td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                          {admin.firstName[0]}
                        </div>
                        <span className="font-medium text-gray-900">{admin.firstName} {admin.lastName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{admin.email}</td>
                    <td className="p-4 text-gray-600">{admin.phone || '-'}</td>
                    <td className="p-4 text-gray-600">
                      {new Date(admin.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        <ShieldMinus size={16} />
                        إزالة الصلاحية
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

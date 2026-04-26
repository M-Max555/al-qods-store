import { useState, useEffect } from 'react';
import { userService } from '../firebase/services/userService';
import type { User } from '../types';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone && u.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
        
        <div className="relative max-w-sm w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث بالاسم، الإيميل، أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">الاسم</th>
                <th className="p-4 font-semibold text-gray-600">البريد الإلكتروني</th>
                <th className="p-4 font-semibold text-gray-600">رقم الهاتف</th>
                <th className="p-4 font-semibold text-gray-600">العنوان</th>
                <th className="p-4 font-semibold text-gray-600">الدور</th>
                <th className="p-4 font-semibold text-gray-600">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">لم يتم العثور على مستخدمين</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                    </td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4 text-gray-600">{user.phone || '-'}</td>
                    <td className="p-4 text-gray-600 max-w-xs truncate">{user.location?.address || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
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

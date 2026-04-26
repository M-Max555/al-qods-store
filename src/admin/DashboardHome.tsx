import { useEffect, useState } from 'react';
import { orderService } from '../firebase/services/orderService';
import { userService } from '../firebase/services/userService';
import { productService } from '../firebase/services/productService';
import { ShoppingBag, Users, Package, DollarSign } from 'lucide-react';
import { formatPrice } from '../utils/format';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orders, users, products] = await Promise.all([
          orderService.getAllOrders(),
          userService.getAllUsers(),
          productService.getAllProducts()
        ]);

        const revenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, order) => sum + order.totalPrice, 0);

        setStats({
          totalOrders: orders.length,
          totalRevenue: revenue,
          totalUsers: users.length,
          totalProducts: products.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) return <div className="text-center py-20 text-gray-500">جاري تحميل البيانات...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">نظرة عامة</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الطلبات" value={stats.totalOrders.toString()} icon={ShoppingBag} color="bg-blue-50 text-blue-600" />
        <StatCard title="إجمالي الإيرادات" value={formatPrice(stats.totalRevenue)} icon={DollarSign} color="bg-green-50 text-green-600" />
        <StatCard title="المستخدمين" value={stats.totalUsers.toString()} icon={Users} color="bg-purple-50 text-purple-600" />
        <StatCard title="المنتجات" value={stats.totalProducts.toString()} icon={Package} color="bg-orange-50 text-orange-600" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

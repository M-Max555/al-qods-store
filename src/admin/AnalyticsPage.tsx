import { useState, useEffect } from 'react';
import { orderService } from '../firebase/services/orderService';
import { userService } from '../firebase/services/userService';
import { format, parseISO, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { formatPrice } from '../utils/format';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState({
    dailyRevenue: [] as any[],
    topProducts: [] as any[],
    totalOrders: 0,
    totalRevenue: 0,
    conversionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [orders, users] = await Promise.all([
        orderService.getAllOrders(),
        userService.getAllUsers(),
      ]);

      // Calculate totals
      const validOrders = orders.filter(o => o.status !== 'cancelled');
      const totalRevenue = validOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      const conversionRate = users.length > 0 ? (orders.length / users.length) * 100 : 0;

      // Group orders by day for the last 7 days
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), i);
        return format(d, 'yyyy-MM-dd');
      }).reverse();

      const dailyRevenue = last7Days.map(dateStr => {
        const dayOrders = validOrders.filter(o => o.createdAt.startsWith(dateStr));
        const revenue = dayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        return {
          name: format(parseISO(dateStr), 'EEEE', { locale: ar }),
          revenue,
          orders: dayOrders.length
        };
      });

      // Calculate top products
      const productCounts: Record<string, { name: string, count: number, revenue: number }> = {};
      validOrders.forEach(order => {
        order.items.forEach(item => {
          if (!productCounts[item.productId]) {
            productCounts[item.productId] = { name: item.name, count: 0, revenue: 0 };
          }
          productCounts[item.productId].count += item.quantity;
          productCounts[item.productId].revenue += (item.price * item.quantity);
        });
      });

      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setData({
        dailyRevenue,
        topProducts,
        totalOrders: orders.length,
        totalRevenue,
        conversionRate,
      });

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500">جاري تحميل التحليلات...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">التحليلات والإحصائيات</h1>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6">الإيرادات (آخر 7 أيام)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyRevenue} margin={{ right: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`${value} جنيه`, 'الإيرادات']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#e60023" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6">عدد الطلبات (آخر 7 أيام)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyRevenue} margin={{ right: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [value, 'عدد الطلبات']}
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="orders" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4">المنتجات الأكثر مبيعاً</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">المنتج</th>
                <th className="p-4 font-semibold text-gray-600">الكمية المباعة</th>
                <th className="p-4 font-semibold text-gray-600">الإيرادات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.topProducts.map((product, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{product.name}</td>
                  <td className="p-4 text-blue-600 font-bold">{product.count}</td>
                  <td className="p-4 text-green-600 font-bold">{formatPrice(product.revenue)}</td>
                </tr>
              ))}
              {data.topProducts.length === 0 && (
                <tr><td colSpan={3} className="p-4 text-center text-gray-500">لا توجد بيانات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

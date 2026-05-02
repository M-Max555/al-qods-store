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
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  Activity
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState({
    dailyRevenue: [] as any[],
    topProducts: [] as any[],
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
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
        totalCustomers: users.length,
        conversionRate,
      });

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-bold">جاري تحميل التحليلات والبيانات...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">التحليلات والإحصائيات</h1>
          <p className="text-gray-500 text-sm mt-1">نظرة عامة على أداء متجرك ونمو مبيعاتك</p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-red-600"
          title="تحديث البيانات"
        >
          <Activity size={20} />
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold mb-1">إجمالي الإيرادات</p>
            <h3 className="text-xl font-black text-gray-900">{formatPrice(data.totalRevenue)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold mb-1">إجمالي الطلبات</p>
            <h3 className="text-xl font-black text-gray-900">{data.totalOrders}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold mb-1">إجمالي العملاء</p>
            <h3 className="text-xl font-black text-gray-900">{data.totalCustomers}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold mb-1">معدل التحويل</p>
            <h3 className="text-xl font-black text-gray-900">{data.conversionRate.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-black text-gray-900">الإيرادات اليومية</h2>
              <p className="text-xs text-gray-400 mt-0.5">آخر 7 أيام من النشاط</p>
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-[10px] font-bold">
              <ArrowUpRight size={12} />
              <span>مباشر</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyRevenue} margin={{ right: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value.toLocaleString()} ج.م`, 'الإيرادات']}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: '#e60023' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#e60023" 
                  strokeWidth={4} 
                  dot={{ r: 0 }} 
                  activeDot={{ r: 6, fill: '#e60023', strokeWidth: 4, stroke: '#fff' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-black text-gray-900">حجم الطلبات</h2>
              <p className="text-xs text-gray-400 mt-0.5">توزيع الطلبات على أيام الأسبوع</p>
            </div>
            <Package size={20} className="text-blue-500" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyRevenue} margin={{ right: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value: any) => [value, 'عدد الطلبات']}
                  cursor={{ fill: '#f9fafb', radius: 12 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar 
                  dataKey="orders" 
                  fill="#2563eb" 
                  radius={[8, 8, 0, 0]} 
                  barSize={32}
                />
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
                <th className="p-4 font-bold text-gray-700 text-sm">المنتج</th>
                <th className="p-4 font-bold text-gray-700 text-sm text-center">الكمية المباعة</th>
                <th className="p-4 font-bold text-gray-700 text-sm text-center">الإيرادات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.topProducts.map((product, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-900">{product.name}</td>
                  <td className="p-4 text-center">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-sm">{product.count}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg font-black text-sm">{formatPrice(product.revenue)}</span>
                  </td>
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

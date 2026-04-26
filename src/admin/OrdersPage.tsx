import { useState, useEffect } from 'react';
import { orderService } from '../firebase/services/orderService';
import type { Order, OrderStatusType } from '../types';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/format';
// lucide-react not used currently

const STATUS_LABELS: Record<OrderStatusType, string> = {
  pending: 'قيد التنفيذ',
  processing: 'جاري التجهيز',
  shipped: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const STATUS_COLORS: Record<OrderStatusType, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatusType | 'all'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const allOrders = await orderService.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatusType) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success('تم تحديث حالة الطلب');
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      toast.error('حدث خطأ أثناء التحديث');
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            الكل
          </button>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as OrderStatusType)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === key ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">رقم الطلب</th>
                <th className="p-4 font-semibold text-gray-600">التاريخ</th>
                <th className="p-4 font-semibold text-gray-600">العميل</th>
                <th className="p-4 font-semibold text-gray-600">الإجمالي</th>
                <th className="p-4 font-semibold text-gray-600">الحالة</th>
                <th className="p-4 font-semibold text-gray-600">تحديث الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">لا يوجد طلبات بهذا التصنيف</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{order.orderId}</td>
                    <td className="p-4 text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-gray-900">{order.phone}</p>
                        <p className="text-xs text-gray-500 max-w-[150px] truncate">{order.address}</p>
                      </div>
                    </td>
                    <td className="p-4 text-red-600 font-bold">{formatPrice(order.totalPrice)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as OrderStatusType)}
                        className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400"
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
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

import { useState, useEffect } from 'react';
import { orderService } from '../firebase/services/orderService';
import { userService } from '../firebase/services/userService';
import type { Order, OrderStatusType } from '../types';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/format';
import { 
  Search, 
  MapPin, 
  Clock, 
  User as UserIcon, 
  Package, 
  ChevronDown, 
  ExternalLink,
  Phone
} from 'lucide-react';

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
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatusType | 'all'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const [allOrders, allUsers] = await Promise.all([
        orderService.getAllOrders(),
        userService.getAllUsers()
      ]);
      
      const nameMap: Record<string, string> = {};
      allUsers.forEach(u => {
        nameMap[u.id] = `${u.firstName} ${u.lastName}`;
      });
      
      setUserNames(nameMap);
      setOrders(allOrders);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'بدون تاريخ';
    
    let d: Date;
    // Handle Firestore Timestamp object
    if (date && typeof date === 'object' && 'seconds' in date) {
      d = new Date(date.seconds * 1000);
    } else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) return 'تاريخ غير صالح';
    return d;
  };

  const updateStatus = async (docId: string, readableId: string, newStatus: OrderStatusType) => {
    try {
      await orderService.updateOrderStatus(readableId, newStatus);
      toast.success('تم تحديث حالة الطلب بنجاح 👌');
      setOrders(orders.map(o => o.id === docId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('Update status error:', error);
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
                <th className="p-4 font-bold text-gray-700 text-sm">رقم الطلب</th>
                <th className="p-4 font-bold text-gray-700 text-sm">التاريخ والوقت</th>
                <th className="p-4 font-bold text-gray-700 text-sm">العميل</th>
                <th className="p-4 font-bold text-gray-700 text-sm">المنتجات</th>
                <th className="p-4 font-bold text-gray-700 text-sm">الموقع والتوصيل</th>
                <th className="p-4 font-bold text-gray-700 text-sm">الإجمالي</th>
                <th className="p-4 font-bold text-gray-700 text-sm">الحالة</th>
                <th className="p-4 font-bold text-gray-700 text-sm text-center">تحديث الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-500 font-bold">جاري تحميل الطلبات...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Search size={48} strokeWidth={1.5} />
                      <p className="font-bold text-lg">لا توجد طلبات بهذا التصنيف</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                    <td className="p-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 border border-gray-200">
                        {order.orderId}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-900 font-bold text-sm">
                          <Clock size={14} className="text-red-600" />
                          <span>
                            {typeof formatDate(order.createdAt) === 'string' 
                              ? formatDate(order.createdAt) 
                              : (formatDate(order.createdAt) as Date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium mr-5">
                          {typeof formatDate(order.createdAt) === 'string' 
                            ? '' 
                            : (formatDate(order.createdAt) as Date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-900 font-bold text-sm">
                          <UserIcon size={14} className="text-blue-600" />
                          <span>{order.customerName || userNames[order.userId] || 'عميل مجهول'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-5">
                          <Phone size={12} />
                          <span className="font-mono">{order.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <img src={item.image} alt="" className="w-6 h-6 rounded-md object-cover border border-gray-100" />
                            <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{item.name}</span>
                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">x{item.quantity}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-[10px] text-red-600 font-bold mr-8">+ {order.items.length - 2} منتجات أخرى</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1 max-w-[180px]">
                        <div className="flex items-start gap-1.5 text-xs text-gray-600">
                          <MapPin size={14} className="text-red-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed font-medium">{order.address}</span>
                        </div>
                        {order.location && (
                          <a 
                            href={`https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold mr-5 mt-1"
                          >
                            <ExternalLink size={10} />
                            <span>عرض على الخريطة</span>
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col items-end">
                        <span className="text-red-600 font-black text-sm">{formatPrice(order.totalPrice)}</span>
                        <span className="text-[10px] text-gray-400">شامل الضريبة</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="relative group">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, order.orderId, e.target.value as OrderStatusType)}
                          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all cursor-pointer"
                        >
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-red-600 transition-colors" />
                      </div>
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

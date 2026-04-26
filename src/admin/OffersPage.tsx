import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { offerService } from '../firebase/services/offerService';
import type { Offer } from '../types';
import toast from 'react-hot-toast';
import { PlusCircle, Edit2, Trash2, Tag, Power, PowerOff } from 'lucide-react';

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const data = await offerService.getAllOffers();
      setOffers(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل العروض');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    try {
      await offerService.deleteOffer(id);
      toast.success('تم حذف العرض بنجاح');
      setOffers(offers.filter(o => o.id !== id));
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      const newStatus = !offer.isActive;
      await offerService.updateOffer(offer.id, { isActive: newStatus });
      toast.success(newStatus ? 'تم تفعيل العرض' : 'تم إيقاف العرض');
      setOffers(offers.map(o => o.id === offer.id ? { ...o, isActive: newStatus } : o));
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة العرض');
    }
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">إدارة العروض والخصومات</h1>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/admin/offers/add"
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <PlusCircle size={20} />
            <span>إضافة عرض جديد</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">العرض</th>
                <th className="p-4 font-semibold text-gray-600">الخصم</th>
                <th className="p-4 font-semibold text-gray-600">تاريخ الانتهاء</th>
                <th className="p-4 font-semibold text-gray-600">الحالة</th>
                <th className="p-4 font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">لم يتم العثور على عروض</td>
                </tr>
              ) : (
                offers.map((offer) => {
                  const expired = isExpired(offer.expiresAt);
                  return (
                    <tr key={offer.id} className={`transition-colors ${expired ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 overflow-hidden">
                            {offer.image ? (
                                <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                            ) : (
                                <Tag size={24} />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">{offer.title}</span>
                            <span className="text-xs text-gray-500">{offer.productIds.length} منتجات</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-red-600">
                        {offer.discountPercentage}%
                      </td>
                      <td className="p-4">
                        <div className={`text-sm ${expired ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                          {new Date(offer.expiresAt).toLocaleDateString('ar-EG')}
                          {expired && <span className="block text-xs">منتهي</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(offer)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                            offer.isActive && !expired
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {offer.isActive && !expired ? <Power size={14} /> : <PowerOff size={14} />}
                          {offer.isActive ? (expired ? 'نشط (منتهي)' : 'نشط') : 'غير نشط'}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/admin/offers/edit/${offer.id}`} 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(offer.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

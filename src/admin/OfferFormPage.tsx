import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { offerService } from '../firebase/services/offerService';
import { productService } from '../firebase/services/productService';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import type { Product } from '../types';
import toast from 'react-hot-toast';
import { Upload, ArrowRight, Loader2, Search, CheckSquare, Square } from 'lucide-react';

export default function OfferFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountPercentage: 0,
    category: '',
    isActive: true,
    expiresAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  });
  
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    if (isEdit && id) {
      loadOffer(id);
    }
  }, [id]);

  const fetchProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل المنتجات');
    }
  };

  const loadOffer = async (offerId: string) => {
    try {
      const offer = await offerService.getOfferById(offerId);
      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        discountPercentage: offer.discountPercentage || 0,
        category: offer.category || '',
        isActive: offer.isActive ?? true,
        expiresAt: offer.expiresAt ? offer.expiresAt.split('T')[0] : '',
      });
      setSelectedProductIds(offer.productIds || []);
      if (offer.image) {
        setImagePreview(offer.image);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل العرض');
      navigate('/admin/offers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const sendWhatsAppBroadcast = async (offerTitle: string, discount: number) => {
    try {
      const response = await fetch('/api/send-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerTitle,
          discount,
          offerUrl: window.location.origin + '/offers'
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('تم إرسال العرض لجميع العملاء عبر واتساب 📢');
      }
    } catch (err) {
      console.error("Failed to send broadcast:", err);
      toast.error("فشل إرسال التنبيهات عبر واتساب");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('يرجى إدخال اسم العرض');
      return;
    }
    if (formData.discountPercentage < 1 || formData.discountPercentage > 90) {
      toast.error('نسبة الخصم يجب أن تكون بين 1% و 90%');
      return;
    }
    if (selectedProductIds.length === 0) {
      toast.error('يجب اختيار منتج واحد على الأقل للعرض');
      return;
    }
    if (!formData.expiresAt) {
      toast.error('يرجى تحديد تاريخ انتهاء العرض');
      return;
    }
    if (!isEdit && !imageFile && !imagePreview) {
       toast.error('يرجى رفع صورة للعرض');
       return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = imagePreview;

      if (imageFile) {
        try {
          imageUrl = await uploadImageToCloudinary(imageFile);
        } catch (uploadError: any) {
          toast.error("فشل رفع الصورة");
        }
      }

      const offerData = {
        title: formData.title,
        description: formData.description,
        discountPercentage: formData.discountPercentage,
        productIds: selectedProductIds,
        category: formData.category,
        isActive: formData.isActive,
        expiresAt: new Date(formData.expiresAt).toISOString(),
        image: imageUrl,
      };

      if (isEdit && id) {
        await offerService.updateOffer(id, offerData);
        toast.success('تم تحديث العرض بنجاح 👌');
      } else {
        await offerService.addOffer({
          ...offerData,
          createdAt: new Date().toISOString()
        });
        toast.success('تم إنشاء العرض بنجاح 👌');
        
        // Auto-Broadcast for NEW offers
        if (formData.isActive) {
           sendWhatsAppBroadcast(formData.title, formData.discountPercentage);
        }
      }
      
      navigate('/admin/offers');
    } catch (error) {
      toast.error(isEdit ? 'حدث خطأ أثناء تحديث العرض' : 'حدث خطأ أثناء حفظ العرض');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nameAr.toLowerCase().includes(searchProduct.toLowerCase()) || 
    p.categoryAr?.includes(searchProduct)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'تعديل العرض' : 'إضافة عرض جديد'}</h1>
        <button 
          onClick={() => navigate('/admin/offers')}
          className="text-gray-500 hover:text-gray-900 flex items-center gap-2"
        >
          <span>رجوع</span>
          <ArrowRight size={20} className="rtl-flip" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        
        {/* Basic Info */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">بيانات العرض الأساسية</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">عنوان العرض *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="مثال: عروض الصيف الكبرى"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">نسبة الخصم (%) *</label>
              <input
                type="number"
                required
                min="1"
                max="90"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({...formData, discountPercentage: Number(e.target.value)})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">تاريخ الانتهاء *</label>
              <input
                type="date"
                required
                value={formData.expiresAt}
                onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              />
            </div>

            <div className="space-y-2 flex items-end">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl w-full hover:bg-gray-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500" 
                />
                <span className="font-semibold text-gray-700">تفعيل العرض حالاً</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">وصف العرض</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="وصف جذاب للعرض يظهر للعملاء..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-y"
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">صورة العرض (تظهر في الرئيسية)</h2>
          <div className="flex items-center gap-6">
            <label className="cursor-pointer flex-1 border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:bg-gray-50 hover:border-red-400 transition-colors flex flex-col items-center justify-center gap-2">
              <Upload size={32} className="text-gray-400" />
              <span className="text-gray-600 font-medium">اضغط لرفع/تغيير الصورة</span>
              <span className="text-xs text-gray-400">بانر العرض يفضل أن يكون عريض (16:9)</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {imagePreview && (
              <div className="w-64 h-36 rounded-xl border border-gray-200 overflow-hidden relative shrink-0">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Select Products */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-2">
            <h2 className="text-lg font-bold text-gray-900">
              المنتجات المشمولة في العرض 
              <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded-lg mr-2 font-normal">
                {selectedProductIds.length} منتج محدد
              </span>
            </h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="ابحث لاختيار المنتجات..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full pl-4 pr-9 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
            {filteredProducts.map(product => {
              const isSelected = selectedProductIds.includes(product.id);
              return (
                <div 
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50 hover:border-red-200'
                  }`}
                >
                  <div className="text-red-500 shrink-0">
                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-gray-300" />}
                  </div>
                  <img src={product.images[0]} alt={product.nameAr} className="w-10 h-10 rounded-md object-cover bg-white shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{product.nameAr}</p>
                    <p className="text-xs text-gray-500">{product.price} ج.م</p>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-8 text-center text-gray-500">لا توجد منتجات مطابقة للبحث</div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-zinc-900 text-white font-black py-4 rounded-2xl hover:bg-red-600 transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-lg shadow-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>{isEdit ? 'تحديث العرض وحفظ التعديلات' : 'إنشاء ونشر العرض'}</span>
            )}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={() => sendWhatsAppBroadcast(formData.title, formData.discountPercentage)}
              className="md:w-auto px-8 bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-all flex justify-center items-center gap-2 shadow-xl"
            >
              <span>إرسال تنبيه واتساب الآن</span>
              📢
            </button>
          )}
        </div>

      </form>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../firebase/services/productService';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import toast from 'react-hot-toast';
import { Upload, ArrowRight, Loader2 } from 'lucide-react';

import { CATEGORY_OPTIONS } from '../constants/categories';

export default function AddProductPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    nameAr: '',
    name: '',
    descriptionAr: '',
    description: '',
    price: 0,
    discount: 0,
    category: CATEGORY_OPTIONS[0].key,
    stock: 0,
    sku: '',
    isFeatured: false,
    isOffer: false,
    shippingDetails: 'شحن سريع ومجاني للطلبات فوق 5000 ج.م',
    warranty: 'ضمان سنتين من الوكيل المعتمد',
    returnPolicy: 'إمكانية الاستبدال أو الاسترجاع خلال 14 يوم',
  });

  const finalPrice = Math.max(0, formData.price - (formData.price * formData.discount) / 100);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDATION
    if (!formData.nameAr.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }
    if (formData.price <= 0 || isNaN(formData.price)) {
      toast.error('يرجى إدخال سعر صحيح للمنتج');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = '';
      
      // IMAGE UPLOAD WITH CLOUDINARY
      if (imageFile) {
        try {
          console.log("Uploading image to Cloudinary...");
          imageUrl = await uploadImageToCloudinary(imageFile);
          console.log("Upload done. URL:", imageUrl);
        } catch (uploadError: any) {
          console.error("فشل رفع الصورة:", uploadError);
          toast.error("فشل رفع الصورة، سيتم الحفظ بدون صورة");
          // Fallback: continue without image
        }
      }

      // PART 3 & 5: FIRESTORE SAVE
      await productService.addProduct({
        ...formData,
        name: formData.nameAr,
        description: formData.descriptionAr,
        images: imageUrl ? [imageUrl] : [], // Handle fallback
        finalPrice,
        rating: 5,
        reviewCount: 0,
        ratingAverage: 5,
        ratingCount: 0,
        reviews: [],
        tags: [],
        createdAt: new Date().toISOString()
      });

      toast.success('تمت إضافة المنتج بنجاح');
      navigate('/admin/products');
    } catch (error: any) {
      console.error('[DEBUG] ERROR during saving process:', error);
      toast.error('حدث خطأ أثناء حفظ المنتج: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إضافة منتج جديد</h1>
        <button 
          onClick={() => navigate('/admin/products')}
          className="text-gray-500 hover:text-gray-900 flex items-center gap-2"
        >
          <span>رجوع</span>
          <ArrowRight size={20} className="rtl-flip" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">اسم المنتج (عربي) *</label>
            <input
              type="text"
              required
              value={formData.nameAr}
              onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">القسم *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">الوصف (عربي) *</label>
          <textarea
            required
            rows={4}
            value={formData.descriptionAr}
            onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-y"
          />
        </div>

        {/* High Conversion Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">تفاصيل الشحن</label>
            <input
              type="text"
              value={formData.shippingDetails}
              onChange={(e) => setFormData({...formData, shippingDetails: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              placeholder="مثال: شحن خلال 48 ساعة"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">الضمان</label>
            <input
              type="text"
              value={formData.warranty}
              onChange={(e) => setFormData({...formData, warranty: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              placeholder="مثال: ضمان 12 شهر"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">سياسة الاسترجاع</label>
            <input
              type="text"
              value={formData.returnPolicy}
              onChange={(e) => setFormData({...formData, returnPolicy: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              placeholder="مثال: استرجاع خلال 14 يوم"
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">السعر الأساسي *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">نسبة الخصم (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">السعر النهائي</label>
            <input
              type="number"
              disabled
              value={finalPrice}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-bold outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">المخزون المتوفر *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">رمز المنتج (SKU)</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>
        </div>

        {/* Status Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <input 
              type="checkbox" 
              checked={formData.isFeatured}
              onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
              className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500" 
            />
            <div>
              <span className="font-semibold text-gray-700 block">منتج مميز (Featured)</span>
              <span className="text-xs text-gray-500">يظهر في الصفحة الرئيسية</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <input 
              type="checkbox" 
              checked={formData.isOffer}
              onChange={(e) => setFormData({...formData, isOffer: e.target.checked})}
              className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500" 
            />
            <div>
              <span className="font-semibold text-gray-700 block">عرض خاص (Offer)</span>
              <span className="text-xs text-gray-500">يظهر تلقائياً في قسم العروض</span>
            </div>
          </label>
        </div>

        {/* Image Upload */}
        <div className="pt-4 border-t border-gray-100">
          <label className="text-sm font-semibold text-gray-700 block mb-2">صورة المنتج *</label>
          <div className="flex items-center gap-6">
            <label className="cursor-pointer flex-1 border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:bg-gray-50 hover:border-red-400 transition-colors flex flex-col items-center justify-center gap-2">
              <Upload size={32} className="text-gray-400" />
              <span className="text-gray-600 font-medium">اضغط لرفع الصورة</span>
              <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {imagePreview && (
              <div className="w-40 h-40 rounded-2xl border border-gray-200 overflow-hidden relative">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <span>حفظ المنتج</span>
          )}
        </button>

      </form>
    </div>
  );
}

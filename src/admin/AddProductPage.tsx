import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../firebase/services/productService';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import toast from 'react-hot-toast';
import { Upload, ArrowRight, Loader2, X, Image as ImageIcon } from 'lucide-react';

import { CATEGORY_OPTIONS } from '../constants/categories';

export default function AddProductPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
    brand: '',
    condition: 'new' as 'new' | 'used' | 'refurbished',
    color: '',
    isFeatured: false,
    isOffer: false,
    shippingDetails: 'شحن سريع ومجاني للطلبات فوق 5000 ج.م',
    warranty: 'ضمان سنتين من الوكيل المعتمد',
    returnPolicy: 'إمكانية الاستبدال أو الاسترجاع خلال 14 يوم',
  });

  const [attributes, setAttributes] = useState<{key: string, value: string}[]>([]);

  const finalPrice = Math.max(0, formData.price - (formData.price * formData.discount) / 100);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (imageFiles.length + files.length > 5) {
        toast.error('أقصى عدد للصور هو 5 صور');
        return;
      }

      const newFiles = [...imageFiles, ...files];
      const newPreviews = [...imagePreviews, ...files.map(file => URL.createObjectURL(file))];
      
      setImageFiles(newFiles);
      setImagePreviews(newPreviews);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    
    // Revoke URL to prevent memory leak
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameAr.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }
    if (formData.price <= 0 || isNaN(formData.price)) {
      toast.error('يرجى إدخال سعر صحيح للمنتج');
      return;
    }
    if (imageFiles.length === 0) {
      toast.error('يرجى رفع صورة واحدة على الأقل');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      // Upload all images
      for (const file of imageFiles) {
        try {
          const url = await uploadImageToCloudinary(file);
          uploadedUrls.push(url);
        } catch (uploadError) {
          console.error("Failed to upload one image:", uploadError);
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error('فشل رفع الصور');
      }

      await productService.addProduct({
        ...formData,
        name: formData.nameAr,
        description: formData.descriptionAr,
        images: uploadedUrls,
        finalPrice,
        brand: formData.brand,
        condition: formData.condition,
        color: formData.color,
        attributes: attributes.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}),
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
      toast.error('حدث خطأ أثناء حفظ المنتج: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

        </div>

        {/* Brand, Condition, Color */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">العلامة التجارية</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({...formData, brand: e.target.value})}
              placeholder="مثلاً: LG, Samsung..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">الحالة</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value as any})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            >
              <option value="new">جديد</option>
              <option value="used">مستعمل</option>
              <option value="refurbished">مجدد</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">اللون</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              placeholder="مثلاً: أسود, فضي..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>
        </div>

        {/* Dynamic Attributes */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <label className="text-sm font-bold text-gray-900">المواصفات الفنية (Attributes)</label>
          <div className="space-y-3">
            {attributes.map((attr, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="الخاصية (مثلاً: السعة)"
                  value={attr.key}
                  onChange={(e) => {
                    const newAttrs = [...attributes];
                    newAttrs[index].key = e.target.value;
                    setAttributes(newAttrs);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none"
                />
                <input
                  type="text"
                  placeholder="القيمة (مثلاً: 500 لتر)"
                  value={attr.value}
                  onChange={(e) => {
                    const newAttrs = [...attributes];
                    newAttrs[index].value = e.target.value;
                    setAttributes(newAttrs);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAttributes(attributes.filter((_, i) => i !== index))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAttributes([...attributes, { key: '', value: '' }])}
              className="text-sm text-red-600 font-bold hover:underline"
            >
              + إضافة خاصية جديدة
            </button>
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

        {/* Pricing & Stock */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
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
            <label className="text-sm font-semibold text-gray-700">السعر النهائي</label>
            <div className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-red-600 font-black text-center">
              {finalPrice.toLocaleString()} ج.م
            </div>
          </div>
        </div>

        {/* Image Upload System (Amazon Style) */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-red-600" />
              <span>صور المنتج (حتى 5 صور) *</span>
            </label>
            <span className="text-xs text-gray-500">{imageFiles.length} / 5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="aspect-square rounded-2xl border border-gray-200 overflow-hidden relative group shadow-sm hover:shadow-md transition-all">
                <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-red-600 hover:text-white text-gray-600 p-1.5 rounded-lg shadow-lg transition-all"
                >
                  <X size={14} />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 text-white text-[10px] py-1 text-center font-bold">
                    الصورة الرئيسية
                  </div>
                )}
              </div>
            ))}
            
            {imageFiles.length < 5 && (
              <label className="aspect-square cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 hover:border-red-400 transition-all text-gray-400 hover:text-red-600">
                <Upload size={24} />
                <span className="text-[10px] font-bold">إضافة صورة</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-xl active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>جاري رفع الصور وحفظ المنتج...</span>
            </>
          ) : (
            <span>حفظ ونشر المنتج</span>
          )}
        </button>

      </form>
    </div>
  );
}


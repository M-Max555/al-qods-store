import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../firebase/services/productService';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import toast from 'react-hot-toast';
import { Upload, ArrowRight, Loader2, X, Image as ImageIcon } from 'lucide-react';

import { CATEGORY_OPTIONS, mapOldCategoryToKey } from '../constants/categories';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mix of strings (existing URLs) and Files (newly uploaded)
  const [images, setImages] = useState<(string | File)[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

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
    shippingDetails: '',
    warranty: '',
    returnPolicy: '',
  });

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const product = await productService.getProductById(id!);
      setFormData({
        nameAr: product.nameAr || '',
        name: product.name || '',
        descriptionAr: product.descriptionAr || '',
        description: product.description || '',
        price: product.price || 0,
        discount: product.discount || 0,
        category: mapOldCategoryToKey(product.category || CATEGORY_OPTIONS[0].key),
        stock: product.stock || 0,
        sku: product.sku || '',
        isFeatured: product.isFeatured || false,
        isOffer: product.isOffer || (product.discount > 0),
        shippingDetails: product.shippingDetails || 'شحن سريع ومجاني للطلبات فوق 5000 ج.م',
        warranty: product.warranty || 'ضمان سنتين من الوكيل المعتمد',
        returnPolicy: product.returnPolicy || 'إمكانية الاستبدال أو الاسترجاع خلال 14 يوم',
      });
      
      if (product.images) {
        setImages(product.images);
        setPreviews(product.images);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل بيانات المنتج');
      navigate('/admin/products');
    } finally {
      setIsLoading(false);
    }
  };

  const finalPrice = Math.max(0, formData.price - (formData.price * formData.discount) / 100);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (images.length + files.length > 5) {
        toast.error('أقصى عدد للصور هو 5 صور');
        return;
      }

      setImages([...images, ...files]);
      setPreviews([...previews, ...files.map(file => URL.createObjectURL(file))]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    
    if (typeof newPreviews[index] === 'string' && newPreviews[index].startsWith('blob:')) {
      URL.revokeObjectURL(newPreviews[index]);
    }
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!formData.nameAr.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }
    if (images.length === 0) {
      toast.error('يرجى إضافة صورة واحدة على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalUrls: string[] = [];
      
      for (const img of images) {
        if (typeof img === 'string') {
          finalUrls.push(img); // Already uploaded
        } else {
          // New file to upload
          try {
            const url = await uploadImageToCloudinary(img);
            finalUrls.push(url);
          } catch (err) {
            console.error("Failed to upload image:", err);
          }
        }
      }

      await productService.updateProduct(id, {
        ...formData,
        name: formData.nameAr,
        description: formData.descriptionAr,
        images: finalUrls,
        finalPrice,
        updatedAt: new Date().toISOString()
      });

      toast.success('تم تحديث المنتج بنجاح 👌');
      navigate('/admin/products');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث المنتج');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">تعديل المنتج</h1>
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

        {/* Image Upload System */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-red-600" />
              <span>صور المنتج (حتى 5 صور) *</span>
            </label>
            <span className="text-xs text-gray-500">{images.length} / 5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {previews.map((preview, index) => (
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
            
            {images.length < 5 && (
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
              <span>جاري تحديث الصور والبيانات...</span>
            </>
          ) : (
            <span>تحديث ونشر التعديلات</span>
          )}
        </button>

      </form>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, ShoppingCart, Star, Check, 
  ShieldCheck, Truck, RefreshCcw, Loader2 
} from 'lucide-react';
import { productService } from '../firebase/services/productService';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import { useFavoriteStore } from '../store/favoriteStore';
import { formatPrice } from '../utils/format';
import { formatDate } from '../utils/date';
import type { Product, Review } from '../types';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', comment: '', rating: 5 });
  
  const { addItem, isInCart } = useCartStore();
  const { addReview } = useProductStore();
  const { toggleFavorite, isFavorite } = useFavoriteStore();

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('المنتج غير موجود');
        navigate('/products');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">جاري تحميل تفاصيل المنتج...</p>
      </div>
    );
  }

  if (!product) return null;

  const inCart = isInCart(product.id);
  const isWished = isFavorite(product.id);

  const handleAddToCart = () => {
    if (product.stock === 0) return;
    addItem(product);
    toast.success('تمت الإضافة إلى السلة');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      await addReview(product.id, reviewForm);
      toast.success('تم إضافة تقييمك بنجاح');
      setReviewForm({ name: '', comment: '', rating: 5 });
      // Refresh product data
      const updatedProduct = await productService.getProductById(product.id);
      setProduct(updatedProduct);
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة التقييم');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <Breadcrumb items={[
        { label: 'الرئيسية', href: '/' },
        { label: 'المنتجات', href: '/products' },
        { label: product.nameAr }
      ]} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images Section */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm relative group">
            <img 
              src={product.images[activeImage]} 
              alt={product.nameAr}
              className="w-full h-full object-cover"
            />
            {product.discount > 0 && (
              <span className="absolute top-6 right-6 bg-red-600 text-white font-black px-4 py-1.5 rounded-2xl shadow-lg">
                خصم {product.discount}%
              </span>
            )}
          </div>
          
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImage === idx ? 'border-red-600 ring-4 ring-red-100' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100">
              <Star size={14} className="fill-amber-500 text-amber-500" />
              <span className="text-sm font-bold">{product.ratingAverage || 0}</span>
              <span className="text-xs opacity-75">({product.ratingCount || 0} تقييم)</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">{product.nameAr}</h1>
          
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-4xl font-black text-red-600">{formatPrice(product.finalPrice)}</span>
            {product.discount > 0 && (
              <span className="text-xl text-gray-400 line-through font-bold">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div className="bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-3">وصف المنتج</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {product.descriptionAr}
            </p>
          </div>

          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg ${
                  inCart 
                  ? 'bg-green-600 text-white shadow-green-200' 
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {inCart ? (
                  <><Check size={24} /> <span>في السلة</span></>
                ) : (
                  <><ShoppingCart size={24} /> <span>أضف للسلة الآن</span></>
                )}
              </button>
              
              <button
                onClick={() => toggleFavorite(product)}
                className={`p-4 rounded-2xl border-2 transition-all active:scale-90 ${
                  isWished 
                  ? 'bg-red-50 border-red-200 text-red-500' 
                  : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'
                }`}
              >
                <Heart size={28} className={isWished ? 'fill-red-500' : ''} />
              </button>
            </div>
            
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-orange-600 text-sm font-bold flex items-center gap-2 justify-center">
                <Loader2 className="animate-spin" size={14} />
                سارع بالشراء! تبقى فقط {product.stock} قطع في المخزون
              </p>
            )}
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-8">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <Truck size={24} />
              </div>
              <span className="text-[11px] font-bold text-gray-700">{product.shippingDetails || 'توصيل سريع'}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <ShieldCheck size={24} />
              </div>
              <span className="text-[11px] font-bold text-gray-700">{product.warranty || 'ضمان سنة'}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                <RefreshCcw size={24} />
              </div>
              <span className="text-[11px] font-bold text-gray-700">{product.returnPolicy || 'إرجاع خلال 14 يوم'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Reviews & Ratings Section ─── */}
      <div className="mt-16 pt-16 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Rating Summary */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-black text-gray-900">تقييمات العملاء</h2>
            <div className="bg-gray-50 rounded-3xl p-8 text-center border border-gray-100">
              <div className="text-5xl font-black text-gray-900 mb-2">{product.ratingAverage || 0}</div>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={20} className={s <= Math.round(product.ratingAverage || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                ))}
              </div>
              <p className="text-gray-500 font-medium">بناءً على {product.ratingCount || 0} تقييم</p>
            </div>

            {/* Review Form */}
            <form onSubmit={handleReviewSubmit} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900">أضف تقييمك</h3>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 px-1">الاسم</label>
                <input 
                  type="text" 
                  required
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 outline-none transition-all"
                  placeholder="اسمك بالكامل"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 px-1">التقييم</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                      className={`p-1 transition-all ${reviewForm.rating >= s ? 'text-amber-400' : 'text-gray-200'}`}
                    >
                      <Star size={24} className={reviewForm.rating >= s ? 'fill-current' : ''} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 px-1">تعليقك</label>
                <textarea 
                  required
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 outline-none transition-all resize-none"
                  placeholder="ما رأيك في المنتج؟"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {isSubmittingReview ? 'جاري الإرسال...' : 'إرسال التقييم'}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              التعليقات
              <span className="text-sm font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{product.reviews?.length || 0}</span>
            </h2>
            
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((review: Review) => (
                  <div key={review.id} className="bg-white rounded-3xl p-6 border border-gray-50 shadow-sm hover:border-red-100 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-black text-lg">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{review.name}</h4>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={10} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(review.date)}</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                  <p className="text-gray-400">لا توجد تعليقات بعد. كن أول من يقيم هذا المنتج!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

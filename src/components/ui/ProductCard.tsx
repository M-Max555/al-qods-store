import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Check, ShoppingCart, Info } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useOfferStore } from '../../store/offerStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { formatPrice } from '../../utils/format';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  view?: 'grid' | 'list';
}

/**
 * ProductCard Component
 * Renders a product in either grid or list view with support for 
 * cart actions, wishlist toggling, and offer detection.
 */
const ProductCard = memo(({ product, view = 'grid' }: ProductCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Custom hooks for state management
  const { addItem, isInCart, getItemQuantity } = useCartStore();
  const getOfferForProduct = useOfferStore(state => state.getOfferForProduct);
  const { toggleFavorite, isFavorite } = useFavoriteStore();

  // Safety check: If product is missing, render nothing or a placeholder to prevent crash
  if (!product || !product.id) {
    console.error('[ProductCard] Missing product data:', product);
    return null;
  }

  const isWished = isFavorite(product.id);
  const inCart = isInCart(product.id);
  const qty = getItemQuantity(product.id);
  
  // Calculate final prices including offers
  const activeOffer = getOfferForProduct(product.id);
  const displayDiscount = activeOffer ? activeOffer.discountPercentage : (product.discount || 0);
  
  // Original price fallback logic
  const displayOriginalPrice = activeOffer ? product.price : (product.originalPrice || product.price);
  
  // The final price displayed (calculated to ensure consistency with offers)
  const displayPrice = displayDiscount > 0 
    ? Math.max(0, displayOriginalPrice - (displayOriginalPrice * displayDiscount / 100))
    : (product.finalPrice || product.price);

  const productToCart = {
    ...product,
    finalPrice: displayPrice,
    discount: displayDiscount
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) {
      toast.error('عذراً، هذا المنتج نفذ من المخزون');
      return;
    }
    addItem(productToCart);
    toast.success(`${product.nameAr || product.name} أُضيف إلى السلة`, {
      icon: '🛒',
      duration: 2000,
      style: { direction: 'rtl', fontFamily: 'IBM Plex Sans Arabic, sans-serif' },
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
    toast(isWished ? 'تم الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة ❤️', {
      duration: 1500,
      style: { direction: 'rtl', fontFamily: 'IBM Plex Sans Arabic, sans-serif' },
    });
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  // Image fallback logic
  const productImage = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop';

  /* ─── List View ───────────────────────────────────────────────────── */
  if (view === 'list') {
    return (
      <div 
        onClick={handleCardClick}
        className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 card-hover group cursor-pointer"
      >
        <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
          {!imageLoaded && <div className="absolute inset-0 skeleton" />}
          <img
            src={productImage}
            alt={product.nameAr || product.name}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          {displayDiscount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
              -{displayDiscount}% {activeOffer ? '🔥' : ''}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{product.categoryAr || product.category}</p>
              <h3 className="font-bold mt-1 text-gray-900 leading-tight line-clamp-1">{product.nameAr || product.name}</h3>
            </div>
            <button 
              onClick={handleWishlist}
              className="p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0 transition-colors"
              aria-label="Add to wishlist"
            >
              <Heart size={16} className={isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={11} className={s <= Math.round(product.ratingAverage || 0) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {product.ratingAverage || 0} ({product.ratingCount || 0} تقييم)
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-red-600 font-bold text-lg">{formatPrice(displayPrice)}</span>
              {displayDiscount > 0 && (
                <span className="text-gray-400 text-xs line-through mr-2">
                  {formatPrice(displayOriginalPrice)}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                inCart
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
            >
              {inCart ? (
                <>
                  <Check size={12} />
                  <span>في السلة ({qty})</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={12} />
                  <span>أضف للسلة</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Grid View ───────────────────────────────────────────────────── */
  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 h-full flex flex-col cursor-pointer"
    >
      {/* Image Area */}
      <div className="relative h-56 sm:h-64 bg-gray-50 overflow-hidden">
        {!imageLoaded && <div className="absolute inset-0 skeleton" />}
        <img
          src={productImage}
          alt={product.nameAr || product.name}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Wishlist Floating Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-2 rounded-full text-gray-400 hover:text-red-600 transition-all shadow-sm active:scale-90 z-20"
          aria-label="Add to wishlist"
        >
          <Heart size={18} className={isWished ? 'fill-red-500 text-red-500' : ''} />
        </button>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          {displayDiscount > 0 && (
            <span className="bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg animate-pulse">
              -{displayDiscount}% {activeOffer ? '🔥 عرض' : ''}
            </span>
          )}
          {product.isNew && (
            <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg">
              جديد
            </span>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
           <div className="bg-white text-gray-900 px-5 py-2.5 rounded-xl text-xs font-black shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
             <Info size={14} />
             <span>عرض التفاصيل</span>
           </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">
          {product.categoryAr || product.category}
        </span>
        <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-1 mb-2 text-sm sm:text-base">
          {product.nameAr || product.name}
        </h3>

        {/* Rating Section */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={11}
                className={
                  star <= Math.round(product.ratingAverage || 0)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200'
                }
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-500 font-bold">
            {product.ratingAverage || 0} ({product.ratingCount || 0} تقييم)
          </span>
        </div>

        {/* Price & Action Area */}
        <div className="flex justify-between items-center mt-auto gap-2">
          <div className="flex flex-col">
            <span className="text-gray-900 font-black text-lg leading-none">{formatPrice(displayPrice)}</span>
            {displayDiscount > 0 && (
              <span className="text-gray-400 text-xs line-through mt-1">
                {formatPrice(displayOriginalPrice)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center active:scale-90 shadow-sm ${
              inCart
                ? 'bg-green-600 text-white'
                : 'bg-gray-900 text-white hover:bg-red-600'
            } disabled:opacity-50`}
            aria-label="Add to cart"
          >
            {inCart ? (
              <Check size={18} />
            ) : (
              <ShoppingCart size={18} />
            )}
          </button>
        </div>

        {/* Stock Alert */}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] text-orange-600 font-black">باقي {product.stock} فقط!</span>
          </div>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

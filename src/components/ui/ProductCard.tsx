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

const ProductCard = memo(({ product, view = 'grid' }: ProductCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { addItem, isInCart, getItemQuantity } = useCartStore();
  const getOfferForProduct = useOfferStore(state => state.getOfferForProduct);
  const { toggleFavorite, isFavorite } = useFavoriteStore();

  if (!product || !product.id) return null;

  const isWished = isFavorite(product.id);
  const inCart = isInCart(product.id);
  const qty = getItemQuantity(product.id);
  
  const activeOffer = getOfferForProduct(product.id);
  const displayDiscount = activeOffer ? activeOffer.discountPercentage : (product.discount || 0);
  const displayOriginalPrice = activeOffer ? product.price : (product.originalPrice || product.price);
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
    toast.success(`${product.nameAr || product.name} أُضيف إلى السلة`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleMouseEnter = () => {
    if (product.images && product.images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  const productImage = (product.images && product.images.length > 0) 
    ? product.images[currentImageIndex] 
    : 'https://via.placeholder.com/600x600?text=No+Image';

  if (view === 'list') {
    return (
      <div 
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 card-hover group cursor-pointer transition-all hover:shadow-lg"
      >
        <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
          {!imageLoaded && <div className="absolute inset-0 skeleton" />}
          <img
            src={productImage}
            alt={product.nameAr || product.name}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${currentImageIndex === 1 ? 'scale-110' : 'scale-100'}`}
          />
          {displayDiscount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              -{displayDiscount}%
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] text-gray-500 font-bold mb-1">{product.categoryAr || product.category}</p>
              <h3 className="font-bold text-gray-900 leading-tight line-clamp-1">{product.nameAr || product.name}</h3>
            </div>
            <button onClick={handleWishlist} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <Heart size={16} className={isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs text-gray-500 font-bold">{product.ratingAverage || 0}</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-col">
              <span className="text-red-600 font-black">{formatPrice(displayPrice)}</span>
              {displayDiscount > 0 && <span className="text-gray-400 text-[10px] line-through">{formatPrice(displayOriginalPrice)}</span>}
            </div>
            <button
              onClick={handleAddToCart}
              className={`p-2 rounded-xl transition-all ${inCart ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white hover:bg-red-600'}`}
            >
              {inCart ? <Check size={16} /> : <ShoppingCart size={16} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group border border-gray-100 h-full flex flex-col cursor-pointer"
    >
      <div className="relative h-56 sm:h-64 bg-gray-50 overflow-hidden">
        {!imageLoaded && <div className="absolute inset-0 skeleton" />}
        <img
          src={productImage}
          alt={product.nameAr || product.name}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${currentImageIndex === 1 ? 'scale-110' : 'scale-100'}`}
        />
        
        <button
          onClick={handleWishlist}
          className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-full text-gray-400 hover:text-red-600 transition-all shadow-sm z-20"
        >
          <Heart size={18} className={isWished ? 'fill-red-500 text-red-500' : ''} />
        </button>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          {displayDiscount > 0 && (
            <span className="bg-red-600 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg">
              -{displayDiscount}% {activeOffer ? '🔥' : ''}
            </span>
          )}
          {product.isNew && (
            <span className="bg-blue-600 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg">
              جديد
            </span>
          )}
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10 backdrop-blur-[2px]">
           <div className="bg-white text-zinc-900 px-6 py-3 rounded-2xl text-xs font-black shadow-2xl transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 flex items-center gap-2">
             <Info size={16} />
             <span>التفاصيل</span>
           </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">
          {product.categoryAr || product.category}
        </span>
        <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-1 mb-3 text-sm sm:text-base">
          {product.nameAr || product.name}
        </h3>

        <div className="flex items-center gap-1 mb-4">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="text-xs text-gray-500 font-bold">{product.ratingAverage || 0}</span>
        </div>

        <div className="flex justify-between items-end mt-auto">
          <div className="flex flex-col">
            <span className="text-zinc-900 font-black text-xl leading-none">{formatPrice(displayPrice)}</span>
            {displayDiscount > 0 && (
              <span className="text-gray-400 text-xs line-through mt-2 font-medium">
                {formatPrice(displayOriginalPrice)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-lg active:scale-90 ${
              inCart ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white hover:bg-red-600'
            }`}
          >
            {inCart ? <Check size={22} /> : <ShoppingCart size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;

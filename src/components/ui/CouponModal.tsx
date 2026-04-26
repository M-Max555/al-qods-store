import { useState, useEffect } from 'react';
import { X, Copy, Check, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponCode: string;
}

export default function CouponModal({ isOpen, onClose, couponCode }: CouponModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast.success('تم نسخ الكوبون بنجاح!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header with Gift Icon */}
        <div className="bg-red-600 p-8 text-center text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
            <Gift size={40} className="animate-bounce" />
          </div>
          
          <h2 className="text-3xl font-black mb-2">مبروك 🎉</h2>
          <p className="text-red-100 font-medium">حصلت على خصم 5% على أول طلب لك!</p>
        </div>

        <div className="p-8 text-center">
          <p className="text-gray-500 mb-6 text-sm">
            استخدم هذا الكوبون عند إتمام عملية الشراء للحصول على الخصم المباشر.
          </p>

          {/* Coupon Display */}
          <div className="bg-gray-50 border-2 border-dashed border-red-200 rounded-2xl p-6 mb-8 flex flex-col items-center gap-4 group">
            <span className="text-4xl font-black text-red-600 tracking-widest font-mono">
              {couponCode}
            </span>
            
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 py-2 px-6 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-red-500 transition-all text-sm font-bold text-gray-700"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-500" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy size={16} className="text-gray-400" />
                  <span>نسخ الكوبون</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200 active:scale-95 transform"
          >
            بدء التسوق الآن
          </button>
          
          <p className="mt-4 text-xs text-gray-400">
            * هذا الكوبون صالح للاستخدام مرة واحدة فقط لعملاء الموقع الجدد.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowUp, Phone } from 'lucide-react';

const WHATSAPP_NUMBER = '201010959687';
const PHONE_NUMBER = '01010959687';
const WHATSAPP_MESSAGE = 'مرحباً، أود الاستفسار عن منتجات القدس للإلكترونيات';

export default function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const callPhone = () => {
    window.location.href = `tel:${PHONE_NUMBER}`;
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-center gap-3">
      {/* Scroll To Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="w-11 h-11 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm animate-scale-in"
          aria-label="الرجوع للأعلى"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* Expanded Buttons */}
      <div className="flex flex-col items-center gap-2">
        {isExpanded && (
          <>
            {/* Phone Call */}
            <button
              onClick={callPhone}
              className="group flex items-center gap-2 animate-scale-in"
              aria-label="اتصل بنا"
            >
              <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                اتصل بنا
              </span>
              <div className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                <Phone size={20} className="text-white" />
              </div>
            </button>

            {/* WhatsApp */}
            <button
              onClick={openWhatsApp}
              className="group flex items-center gap-2 animate-scale-in"
              aria-label="واتساب"
            >
              <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap border border-gray-100 group-hover:bg-green-50 group-hover:text-green-700 transition-colors">
                واتساب
              </span>
              <div className="w-12 h-12 bg-[#25D366] hover:bg-[#1fa855] rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.892-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.412 0 6.556-5.332 11.892-11.893 11.892-1.997 0-3.951-.5-5.688-1.448l-6.305 1.657zm6.59-4.835c1.558.926 3.3 1.414 5.083 1.415h.001c5.448 0 9.878-4.43 9.878-9.879 0-2.64-1.03-5.117-2.892-6.983-1.862-1.866-4.341-2.895-6.978-2.895-5.45 0-9.881 4.43-9.881 9.879 0 2.126.567 4.191 1.639 5.952l-.992 3.613 3.701-.972zm10.17-7.112c-.333-.167-1.96-.967-2.264-1.077-.306-.11-.528-.167-.75.167-.221.333-.859 1.077-1.054 1.303-.194.225-.389.252-.722.084-.333-.167-1.405-.518-2.675-1.651-.989-.882-1.657-1.971-1.852-2.305-.194-.333-.021-.514.145-.68.149-.148.333-.389.5-.583.167-.194.222-.333.333-.556.111-.222.056-.417-.028-.583-.083-.167-.75-1.806-1.027-2.472-.27-.648-.545-.561-.75-.572-.192-.01-.414-.011-.636-.011-.222 0-.583.083-.889.417-.306.333-1.166 1.139-1.166 2.778 0 1.639 1.194 3.222 1.361 3.444.167.222 2.35 3.589 5.692 5.033.794.344 1.415.549 1.899.704.797.254 1.522.218 2.096.132.639-.096 1.96-.801 2.237-1.575.277-.773.277-1.434.194-1.575-.083-.142-.305-.222-.639-.389z" />
                </svg>
              </div>
            </button>
          </>
        )}

        {/* Main Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative w-14 h-14 bg-[#25D366] hover:bg-[#1fa855] rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="تواصل معنا"
        >
          {!isExpanded && (
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
          )}
          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-45' : 'rotate-0'}`}>
            {isExpanded ? (
              <span className="text-white text-2xl font-light">×</span>
            ) : (
              <svg className="w-7 h-7 fill-current text-white" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.892-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.412 0 6.556-5.332 11.892-11.893 11.892-1.997 0-3.951-.5-5.688-1.448l-6.305 1.657zm6.59-4.835c1.558.926 3.3 1.414 5.083 1.415h.001c5.448 0 9.878-4.43 9.878-9.879 0-2.64-1.03-5.117-2.892-6.983-1.862-1.866-4.341-2.895-6.978-2.895-5.45 0-9.881 4.43-9.881 9.879 0 2.126.567 4.191 1.639 5.952l-.992 3.613 3.701-.972zm10.17-7.112c-.333-.167-1.96-.967-2.264-1.077-.306-.11-.528-.167-.75.167-.221.333-.859 1.077-1.054 1.303-.194.225-.389.252-.722.084-.333-.167-1.405-.518-2.675-1.651-.989-.882-1.657-1.971-1.852-2.305-.194-.333-.021-.514.145-.68.149-.148.333-.389.5-.583.167-.194.222-.333.333-.556.111-.222.056-.417-.028-.583-.083-.167-.75-1.806-1.027-2.472-.27-.648-.545-.561-.75-.572-.192-.01-.414-.011-.636-.011-.222 0-.583.083-.889.417-.306.333-1.166 1.139-1.166 2.778 0 1.639 1.194 3.222 1.361 3.444.167.222 2.35 3.589 5.692 5.033.794.344 1.415.549 1.899.704.797.254 1.522.218 2.096.132.639-.096 1.96-.801 2.237-1.575.277-.773.277-1.434.194-1.575-.083-.142-.305-.222-.639-.389z" />
              </svg>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

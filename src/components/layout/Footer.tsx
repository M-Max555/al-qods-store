import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, X } from 'lucide-react';

import ownerImg from '../../assets/owner.jpg';

/* ─── Req #6D: Quick Links (replaced) ──────────────────────────────────────── */
const quickLinks = [
  { label: 'الرئيسية', href: '/' },
  { label: 'العروض', href: '/products?filter=sale' },
  { label: 'الأقسام', href: '/products' },
  { label: 'تواصل معنا', href: '#contact' },
];

/* ─── Req #6F: Main categories — same as navbar ────────────────────────────── */
const mainCategories = [
  { label: 'الأجهزة الكهربائية', href: '/products?category=appliances' },
  { label: 'لوازم المطابخ', href: '/products?category=kitchen' },
  { label: 'الأثاث', href: '/products?category=furniture' },
  { label: 'المفروشات', href: '/products?category=decor' },
  { label: 'لوازم المنزل', href: '/products?category=home_supplies' },
];

export default function Footer() {
  const [showBranch, setShowBranch] = useState(false);

  return (
    <footer className="bg-zinc-100 w-full border-t border-zinc-200 py-12 px-6 text-right" id="contact">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* ─── Brand Column (Req #6A + #6B) ─── */}
        <div className="flex flex-col gap-4">
          {/* Req #6A: Brand Title */}
          <div className="text-xl font-black text-zinc-900">القدس للأجهزة المنزلية</div>
          <p className="text-zinc-500 font-body-sm leading-relaxed">
            المكان الأول لتجهيز منزلك بأحدث الأجهزة الكهربائية والمفروشات والأثاث. ثقة، ضمان، وأفضل خدمة ما بعد البيع.
          </p>

          {/* Req #6B: Owner Section — "أحمد علي" with real image */}
          <div className="flex items-center gap-3 mt-2">
            <img
              className="w-16 h-16 rounded-full border-2 border-red-600 object-cover object-[center_20%] shadow-lg transition-transform hover:scale-110 duration-300"
              alt="أحمد علي — صاحب القدس"
              src={ownerImg}
            />
            <div>
              <div className="text-zinc-900 font-bold">أحمد علي</div>
              <div className="text-zinc-500 text-xs">صاحب القدس للأجهزة المنزلية</div>
            </div>
          </div>
        </div>

        {/* ─── Quick Links (Req #6D) ─── */}
        <div className="flex flex-col gap-3">
          <h4 className="font-label-md text-zinc-900">روابط سريعة</h4>
          {quickLinks.map((link) =>
            link.href.startsWith('/') ? (
              <Link
                key={link.label}
                to={link.href}
                className="text-zinc-500 hover:text-red-600 transition-colors font-body-sm"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-zinc-500 hover:text-red-600 transition-colors font-body-sm"
              >
                {link.label}
              </a>
            )
          )}

          {/* Req #6E: Branches */}
          <button
            onClick={() => setShowBranch(true)}
            className="text-zinc-500 hover:text-red-600 transition-colors font-body-sm text-right"
          >
            الفروع
          </button>
        </div>

        {/* ─── Main Categories (Req #6F) ─── */}
        <div className="flex flex-col gap-3">
          <h4 className="font-label-md text-zinc-900">الأقسام الرئيسية</h4>
          {mainCategories.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-zinc-500 hover:text-red-600 transition-colors font-body-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ─── Contact Info (Req #6C) ─── */}
        <div className="flex flex-col gap-4">
          <h4 className="font-label-md text-zinc-900">اتصل بنا</h4>
          <div className="flex items-center gap-2 text-zinc-500 font-body-sm">
            <MapPin size={14} className="text-red-600 flex-shrink-0" />
            <span>أوسيم، الجيزة، مصر</span>
          </div>
          <a href="tel:01143033292" className="flex items-center gap-2 text-zinc-500 hover:text-red-600 transition-colors font-body-sm">
            <Phone size={14} className="text-red-600 flex-shrink-0" />
            <span>01143033292</span>
          </a>
          {/* Email REMOVED per Req #6C */}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-zinc-200 text-center text-zinc-400 text-xs">
        © {new Date().getFullYear()} القدس للأجهزة المنزلية. جميع الحقوق محفوظة.
      </div>

      {/* ─── Branch Modal (Req #6E) ─── */}
      {showBranch && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowBranch(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 w-[90%] max-w-sm animate-scale-in text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-md text-zinc-900">فروعنا</h3>
              <button onClick={() => setShowBranch(false)} className="p-1 rounded-lg hover:bg-zinc-100">
                <X size={18} className="text-zinc-500" />
              </button>
            </div>
            <div className="flex items-center gap-3 bg-red-50 rounded-xl p-4">
              <MapPin size={20} className="text-red-600 flex-shrink-0" />
              <div className="text-right">
                <p className="font-semibold text-zinc-900 text-sm">فرع واحد</p>
                <p className="text-zinc-600 text-sm">أوسيم — الجيزة — مصر</p>
              </div>
            </div>
          </div>
        </>
      )}
    </footer>
  );
}

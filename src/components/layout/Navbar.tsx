import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Search, User, Menu, X, Heart, ChevronDown, LogOut,
  UserCog, Phone, KeyRound,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useProductStore } from '../../store/productStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { ChangeNameModal, ChangePhoneModal } from '../ui/EditProfileModal';
import SettingsSection from '../settings/SettingsSection';
import { t } from '../../utils/i18n';
import logo from '../../assets/logo.png';



/* ─── Nav links: ONLY the required categories ──────────────────────────────── */
const navLinks = [
  { label: 'home', href: '/' },
  { label: 'offers', href: '/offers' },
  { label: 'appliances', href: '/products?category=appliances' },
  { label: 'kitchen', href: '/products?category=kitchen' },
  { label: 'furniture', href: '/products?category=furniture' },
  { label: 'decor', href: '/products?category=decor' },
  { label: 'home_supplies', href: '/products?category=home_supplies' },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showChangeName, setShowChangeName] = useState(false);
  const [showChangePhone, setShowChangePhone] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { getItemCount, openCart } = useCartStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { setSearchQuery } = useProductStore();

  const itemCount = getItemCount();
  const { favorites } = useFavoriteStore();
  const favCount = favorites.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menus are open
  useEffect(() => {
    if ((isMobileMenuOpen || isUserMenuOpen) && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isUserMenuOpen]);

  useEffect(() => {
    if (isSearchOpen && searchRef.current) searchRef.current.focus();
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSearchQuery(searchValue.trim());
      navigate(`/products?search=${encodeURIComponent(searchValue.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname + location.search === href;
  };

  return (
    <>
    <header className="bg-zinc-950 fixed top-0 left-0 w-full z-[1000] shadow-[0_2px_10px_rgba(0,0,0,0.2)] border-b border-zinc-800 transition-all">
      <div className="flex flex-row-reverse justify-between items-center w-full px-5 h-[70px] max-w-[1280px] mx-auto gap-4 sm:gap-6">
        {/* ─── Logo ─── */}
        <Link to="/" className="flex items-center gap-4 flex-shrink-0">
          <img 
            src={logo} 
            alt="القدس للأجهزة المنزلية"
            className="h-[40px] max-h-[40px] object-contain cursor-pointer transition-transform hover:scale-105 duration-300 drop-shadow-[0_0_10px_rgba(220,38,38,0.2)]"
          />
        </Link>

        {/* ─── Desktop Nav ─── */}
        <nav className="hidden lg:flex flex-row-reverse items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive(link.href)
                  ? 'text-red-500 bg-zinc-800/60'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {t(link.label)}
            </Link>

          ))}
        </nav>

        {/* ─── Actions (RTL order: Search → Cart → User → Wishlist) ─── */}
        <div className="flex items-center gap-1.5">
          {/* Search (Desktop) */}
          <form onSubmit={handleSearch} className="relative hidden lg:block">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="bg-zinc-800 text-white rounded-full px-4 py-1.5 pr-10 focus:outline-none focus:ring-2 focus:ring-red-600 border-none text-sm w-56 placeholder-zinc-400 text-right"
              placeholder={t('search_placeholder')}
            />

            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">search</span>
          </form>

          {/* Search (Mobile) */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="lg:hidden hover:bg-zinc-800/50 rounded-lg transition-all p-2 text-zinc-300 active:scale-95"
            aria-label="بحث"
          >
            <Search size={20} />
          </button>

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative hover:bg-zinc-800/50 rounded-lg transition-all p-2 text-zinc-300 active:scale-95"
            aria-label={`السلة - ${itemCount} منتج`}
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -left-1 badge bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] animate-bounce-in">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>

          {/* User / Profile */}
          <div className="relative" ref={userMenuRef}>
            {isAuthenticated() ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=d32f2f&color=fff`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-red-800"
                />
                <ChevronDown size={14} className={`text-zinc-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hover:bg-zinc-800/50 rounded-lg transition-all p-2 text-zinc-300 active:scale-95"
                aria-label="حسابي"
              >
                <User size={20} />
              </button>
            )}

            {/* ─── User Dropdown (Req #7) ─── */}
            {isUserMenuOpen && (
              <div className="fixed inset-0 w-full h-screen bg-white z-[9999] overflow-y-auto overscroll-contain sm:absolute sm:inset-auto sm:top-full sm:mt-3 sm:w-64 sm:h-auto sm:right-0 sm:left-auto sm:rounded-2xl sm:shadow-2xl sm:border sm:border-gray-100 sm:py-2 animate-slide-from-right sm:animate-slide-down p-0 flex flex-col max-h-screen">
                
                {/* Mobile Header with Close Button */}
                <div className="flex sm:hidden items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
                  <span className="font-bold text-lg text-gray-900">{t('profile')}</span>
                  <button 
                    onClick={() => setIsUserMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-gray-600" />
                  </button>
                </div>

                <div className="px-6 py-6 sm:px-4 sm:py-3 border-b border-gray-100 flex items-center gap-4 sm:block">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=d32f2f&color=fff`}
                    alt={user?.name}
                    className="w-16 h-16 sm:hidden rounded-full object-cover border-4 border-red-50 flex-shrink-0"
                  />
                  <div>
                    <p className="font-bold sm:font-semibold text-gray-900 text-lg sm:text-sm truncate max-w-[200px] sm:max-w-none">{user?.name}</p>
                    <p className="text-gray-500 text-sm sm:text-xs mt-0.5 truncate">{user?.phone || user?.email}</p>
                  </div>
                </div>

                <div className="flex-1 p-2 sm:p-0 flex flex-col sm:block overflow-y-auto">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-4 sm:gap-3 px-6 sm:px-4 py-4 sm:py-2.5 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-base sm:text-sm rounded-xl sm:rounded-none"
                  >
                    <UserCog size={20} className="sm:w-4 sm:h-4 text-zinc-400" />
                    <span>{t('edit_data')}</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setShowChangeName(true);
                    }}
                    className="flex items-center gap-4 sm:gap-3 px-6 sm:px-4 py-4 sm:py-2.5 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-base sm:text-sm w-full text-right rounded-xl sm:rounded-none"
                  >
                    <User size={20} className="sm:w-4 sm:h-4 text-zinc-400" />
                    <span>{t('change_name')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setShowChangePhone(true);
                    }}
                    className="flex items-center gap-4 sm:gap-3 px-6 sm:px-4 py-4 sm:py-2.5 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-base sm:text-sm w-full text-right rounded-xl sm:rounded-none"
                  >
                    <Phone size={20} className="sm:w-4 sm:h-4 text-zinc-400" />
                    <span>{t('change_phone')}</span>
                  </button>

                  <div className="border-t border-gray-100 my-2 bg-gray-50/50 sm:bg-transparent">
                    <SettingsSection isCompact />
                  </div>

                  <div className="border-t border-gray-100 mt-auto sm:mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-4 sm:gap-3 px-6 sm:px-4 py-4 sm:py-2.5 hover:bg-red-50 text-red-600 transition-colors text-base sm:text-sm w-full text-right rounded-xl sm:rounded-none"
                    >
                      <LogOut size={20} className="sm:w-4 sm:h-4" />
                      <span>{t('logout')}</span>
                    </button>

                    <button
                      onClick={() => { handleLogout(); navigate('/login'); }}
                      className="flex items-center gap-4 sm:gap-3 px-6 sm:px-4 py-4 sm:py-2.5 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-base sm:text-sm w-full text-right rounded-xl sm:rounded-none"
                    >
                      <KeyRound size={20} className="sm:w-4 sm:h-4 text-zinc-400" />
                      <span>تسجيل دخول بحساب آخر</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist */}
          <Link
            to="/favorites"
            className="hidden sm:flex relative hover:bg-zinc-800/50 rounded-lg transition-all p-2 text-zinc-300 active:scale-95"
            aria-label="المفضلة"
          >
            <Heart size={20} className={favCount > 0 ? 'fill-red-600 text-red-600' : ''} />
            {favCount > 0 && (
              <span className="absolute -top-1 -left-1 badge bg-red-600 text-white text-[10px] min-w-[18px] h-[18px]">
                {favCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden hover:bg-zinc-800/50 rounded-lg transition-all p-2 text-zinc-300 active:scale-95"
            aria-label="القائمة"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      {isSearchOpen && (
        <div className="px-4 pb-3 animate-slide-down">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-full pr-10 pl-4 py-2.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </form>
        </div>
      )}

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 py-3 px-4 space-y-1 animate-slide-down bg-zinc-950">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href) ? 'bg-zinc-800 text-red-500' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {t(link.label)}
            </Link>

          ))}
        </div>
      )}
    </header>

    {/* ─── Modals ─── */}
    {showChangeName && <ChangeNameModal onClose={() => setShowChangeName(false)} />}
    {showChangePhone && <ChangePhoneModal onClose={() => setShowChangePhone(false)} />}
    </>
  );
}

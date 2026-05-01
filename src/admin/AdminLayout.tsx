import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Users, ShieldAlert,
  ShoppingBag, Package, PlusCircle,
  BarChart3, LogOut, Tag
} from 'lucide-react';
import { t } from '../utils/i18n';


const MENU_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'admin_dashboard' },
  { path: '/admin/orders', icon: ShoppingBag, label: 'orders' },
  { path: '/admin/products', icon: Package, label: 'products' },
  { path: '/admin/products/add', icon: PlusCircle, label: 'add_product' },
  { path: '/admin/offers', icon: Tag, label: 'offers' },
  { path: '/admin/users', icon: Users, label: 'users' },
  { path: '/admin/admins', icon: ShieldAlert, label: 'admins' },
  { path: '/admin/analytics', icon: BarChart3, label: 'analytics' },
];

export default function AdminLayout() {
  const { user, logout, isInitialized, isOwner, isAdmin } = useAuthStore();

  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 font-medium">جاري التحقق من الصلاحيات...</div>
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <ShieldAlert size={64} className="text-red-500" />
        <h1 className="text-3xl font-bold text-gray-900">غير مصرح بالدخول</h1>
        <p className="text-gray-600 max-w-md">عذراً، أنت لا تمتلك الصلاحيات الكافية للوصول إلى لوحة التحكم هذه.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (isOwner()) return true;
    // Admins cannot access users or other admins
    if (item.path === '/admin/users' || item.path === '/admin/admins') return false;
    return true;
  });


  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{t('admin_dashboard')}</h2>
          <p className="text-sm text-gray-500 mt-1">Al Quds Store</p>
        </div>


        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                  ? 'bg-red-50 text-red-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}

              >

                <item.icon size={20} />
                <span>{t(item.label)}</span>
              </Link>


            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} className="rtl-flip" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">لوحة التحكم</h2>
          {/* A simple link back to home or toggle sidebar in mobile could be added here */}
          <Link to="/" className="text-sm text-red-600">العودة للمتجر</Link>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

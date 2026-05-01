import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import FloatingButtons from './components/ui/FloatingButtons';
import { seedFirestore } from './firebase/seed';
import { useAuthStore } from './store/authStore';
import { useOfferStore } from './store/offerStore';
import ChatBot from './components/chatbot/ChatBot';
import ScrollToTop from './components/utils/ScrollToTop';

// Client Pages - Lazy Loaded
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Offers = lazy(() => import('./pages/Offers'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Cart = lazy(() => import('./pages/Cart'));

// Admin Pages - Lazy Loaded
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const DashboardHome = lazy(() => import('./admin/DashboardHome'));
const AdminsPage = lazy(() => import('./admin/AdminsPage'));
const UsersPage = lazy(() => import('./admin/UsersPage'));
const OrdersPage = lazy(() => import('./admin/OrdersPage'));
const ProductsPage = lazy(() => import('./admin/ProductsPage'));
const AddProductPage = lazy(() => import('./admin/AddProductPage'));
const EditProductPage = lazy(() => import('./admin/EditProductPage'));
const OffersPage = lazy(() => import('./admin/OffersPage'));
const OfferFormPage = lazy(() => import('./admin/OfferFormPage'));
const AnalyticsPage = lazy(() => import('./admin/AnalyticsPage'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="animate-spin text-red-600" size={32} />
  </div>
);

export default function App() {
  const initAuth = useAuthStore(state => state.initAuth);
  const fetchActiveOffers = useOfferStore(state => state.fetchActiveOffers);

  useEffect(() => {
    // Initialize Firebase Auth Listener
    const unsubscribe = initAuth();
    
    // Fetch active offers globally
    fetchActiveOffers();
    
    // Apply saved theme and language
    const savedTheme = localStorage.getItem('alquds_theme');
    const savedLang = localStorage.getItem('alquds_lang');
    
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    
    if (savedLang === 'en') {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.classList.add('lang-en');
    } else {
      document.documentElement.setAttribute('dir', 'rtl');
    }

    // Run the seed to populate DB on first load (it will skip if already populated)
    seedFirestore();

    return () => unsubscribe();
  }, [initAuth, fetchActiveOffers]);


  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            direction: 'rtl',
            fontFamily: 'IBM Plex Sans Arabic, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
          },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Admin Routes (Isolated Layout) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="admins" element={<AdminsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/add" element={<AddProductPage />} />
            <Route path="products/edit/:id" element={<EditProductPage />} />
            <Route path="offers" element={<OffersPage />} />
            <Route path="offers/add" element={<OfferFormPage />} />
            <Route path="offers/edit/:id" element={<OfferFormPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Client Routes */}
          <Route path="/*" element={
            <>
              <CartDrawer />
              <FloatingButtons />
              <ChatBot />
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 pt-[70px]">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
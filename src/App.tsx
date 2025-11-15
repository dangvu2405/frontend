import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'sonner';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/Home'));
const ProductsPage = lazy(() => import('./pages/Products'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetail'));
const CartPage = lazy(() => import('./pages/Cart'));
const CheckoutPage = lazy(() => import('./pages/Checkout'));
const MyAccountPage = lazy(() => import('./pages/MyAccount'));
const AboutPage = lazy(() => import('./pages/About'));
const ContactPage = lazy(() => import('./pages/Contact'));
const BlogPage = lazy(() => import('./pages/Blog'));
const SupportPage = lazy(() => import('./pages/Support'));
const LoginForm = lazy(() => import('./pages/login-form').then(m => ({ default: m.LoginForm })));
const SignupForm = lazy(() => import('./pages/signup-form').then(m => ({ default: m.SignupForm })));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password'));
const ProductTracePage = lazy(() => import('./pages/ProductTrace'));
const TraceLookupPage = lazy(() => import('./pages/TraceLookup'));
const VNPayReturnPage = lazy(() => import('./pages/VNPayReturn'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback').then(m => ({ default: m.OAuthCallback })));

// Admin pages - lazy load (heavier)
const AdminLayout = lazy(() => import('./pages/admin/Layout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrdersPage = lazy(() => import('./pages/admin/OrdersCRUD'));
const AdminProductsPage = lazy(() => import('./pages/admin/ProductsCRUD'));
const AdminCustomersPage = lazy(() => import('./pages/admin/CustomersCRUD'));
const AdminAccountsPage = lazy(() => import('./pages/admin/AccountsCRUD'));
const AdminSupplyChainPage = lazy(() => import('./pages/admin/SupplyChainManagement'));
const AdminChatPage = lazy(() => import('./pages/admin/Chat'));
const AdminSettingsPage = lazy(() => import('./pages/admin/Settings'));

import AdminRoute from './components/AdminRoute';

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      <p className="text-muted-foreground mt-4">Đang tải...</p>
    </div>
  </div>
);
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Main Pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/products/:id/trace" element={<ProductTracePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/my-account" element={<MyAccountPage />} />
              <Route path="/trace-lookup" element={<TraceLookupPage />} />
              <Route path="/payment/vnpay-return" element={<VNPayReturnPage />} />
              
              {/* Info Pages */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/support" element={<SupportPage />} />
              
              {/* Auth Pages */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<SignupForm />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              
              {/* Admin Routes - Protected by AdminRoute */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/*" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="accounts" element={<AdminAccountsPage />} />
              <Route path="supply-chain" element={<AdminSupplyChainPage />} />
              <Route path="chat" element={<AdminChatPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

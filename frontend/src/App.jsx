import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import CustomerLayout from './layouts/CustomerLayout';
import ShopkeeperLayout from './layouts/ShopkeeperLayout';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import ShopsPage from './pages/ShopsPage';
import ShopDetailsPage from './pages/ShopDetailsPage';
import ShopCategoryDetailsPage from './pages/ShopCategoryDetailsPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import BecomeShopkeeperPage from './pages/BecomeShopkeeperPage';
import ShopkeeperLoginPage from './pages/ShopkeeperLoginPage';
import ShopkeeperRegisterPage from './pages/ShopkeeperRegisterPage';
import ShopOwnerDashboardPage from './pages/ShopOwnerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public & Customer Website Routes */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shops" element={<ShopsPage />} />
                <Route path="/shops/:id" element={<ShopDetailsPage />} />
                <Route path="/shop-categories/:id" element={<ShopCategoryDetailsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Authenticated Customer Routes */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-orders"
                  element={
                    <ProtectedRoute>
                      <MyOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Dedicated Shopkeeper & Vendor Portal Routes */}
              <Route element={<ShopkeeperLayout />}>
                <Route path="/become-shopkeeper" element={<BecomeShopkeeperPage />} />
                <Route path="/shopkeeper" element={<BecomeShopkeeperPage />} />
                <Route path="/shopkeeper/login" element={<ShopkeeperLoginPage />} />
                <Route path="/shopkeeper/register" element={<ShopkeeperRegisterPage />} />
              </Route>

              {/* Dedicated Role Dashboards */}
              <Route
                path="/shop-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['SHOP_OWNER']}>
                    <ShopOwnerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

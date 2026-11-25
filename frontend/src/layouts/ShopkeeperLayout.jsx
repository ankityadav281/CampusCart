import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShopkeeperNavbar from '../components/ShopkeeperNavbar';
import ShopkeeperFooter from '../components/ShopkeeperFooter';

export default function ShopkeeperLayout() {
  const { user, isAuthenticated, isCustomer, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Prevent logged-in customers from accessing shopkeeper onboarding & registration
  if (isCustomer || (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ShopkeeperNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <ShopkeeperFooter />
    </div>
  );
}

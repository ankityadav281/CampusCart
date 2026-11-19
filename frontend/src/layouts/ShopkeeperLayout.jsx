import { Outlet } from 'react-router-dom';
import ShopkeeperNavbar from '../components/ShopkeeperNavbar';
import ShopkeeperFooter from '../components/ShopkeeperFooter';

export default function ShopkeeperLayout() {
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

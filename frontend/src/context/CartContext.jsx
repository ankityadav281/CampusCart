import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { cartAPI, getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  shop_groups: [],
  total_items: 0,
  shop_count: 0,
  grand_total: '0.00',
};

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      return;
    }
    setLoading(true);
    try {
      const { data } = await cartAPI.getCart();
      setCart(data);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart.');
      return { ok: false, unauthenticated: true };
    }
    try {
      const { data } = await cartAPI.addItem(productId, quantity);
      setCart(data);
      toast.success('Added to your campus cart!');
      return { ok: true, data };
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add product to cart.'));
      return { ok: false };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const { data } = await cartAPI.updateItem(itemId, quantity);
      setCart(data);
      return { ok: true };
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update item quantity.'));
      return { ok: false };
    }
  };

  const removeItem = async (itemId) => {
    try {
      const { data } = await cartAPI.removeItem(itemId);
      setCart(data);
      toast.info('Item removed from cart.');
      return { ok: true };
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove item.'));
      return { ok: false };
    }
  };

  const clearCart = async () => {
    try {
      const { data } = await cartAPI.clearCart();
      setCart(data);
      return { ok: true };
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not clear cart.'));
      return { ok: false };
    }
  };

  const resetCartLocal = () => setCart(EMPTY_CART);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        resetCartLocal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

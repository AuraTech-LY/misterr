import { useState } from 'react';
import { CartItem, MenuItem } from '../types';

const getCartStorageKey = (branchId?: string) => {
  return branchId ? `almoster-cart-${branchId}` : 'almoster-cart-default';
};

// Load cart from localStorage
const loadCartFromStorage = (branchId?: string): CartItem[] => {
  try {
    const savedCart = localStorage.getItem(getCartStorageKey(branchId));
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

// Save cart to localStorage
const saveCartToStorage = (cartItems: CartItem[], branchId?: string) => {
  try {
    localStorage.setItem(getCartStorageKey(branchId), JSON.stringify(cartItems));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

export const useCart = (branchId?: string) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCartFromStorage(branchId));
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart when branch changes
  const loadBranchCart = (newBranchId?: string) => {
    const branchCart = loadCartFromStorage(newBranchId);
    setCartItems(branchCart);
  };

  const addToCart = (item: MenuItem) => {
    const updateCart = (prev: CartItem[]) => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      
      return [...prev, { ...item, quantity: 1 }];
    };
    
    setCartItems(prev => {
      const newCart = updateCart(prev);
      saveCartToStorage(newCart, branchId);
      return newCart;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prev => {
      const newCart = prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCartToStorage(newCart, branchId);
      return newCart;
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => {
      const newCart = prev.filter(item => item.id !== id);
      saveCartToStorage(newCart, branchId);
      return newCart;
    });
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const clearCart = () => {
    const emptyCart: CartItem[] = [];
    setCartItems(emptyCart);
    saveCartToStorage(emptyCart, branchId);
  };

  return {
    cartItems,
    isCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    getTotalItems,
    getTotalPrice,
    openCart,
    closeCart,
    clearCart,
    loadBranchCart,
  };
};
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { trackAddToCart, trackBeginCheckout } from "../tracker.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ id, title, price, currency, weight, qty }]
  const [isCartOpen, setCartOpen] = useState(false);
  const [isOrderFormOpen, setOrderFormOpen] = useState(false);

  const addItem = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          currency: product.currency || "৳",
          weight: product.weight,
          qty,
        },
      ];
    });
    trackAddToCart(product, qty);
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.price, 0), [items]);

  /** Opens the order form directly with a single product (from a product card's CTA). */
  const buyNow = useCallback(
    (product, qty = 1) => {
      addItem(product, qty);
      trackBeginCheckout([{ id: product.id, title: product.title }], product.price * qty);
      setOrderFormOpen(true);
    },
    [addItem]
  );

  const openOrderForm = useCallback(() => {
    if (items.length > 0) trackBeginCheckout(items, totalPrice);
    setOrderFormOpen(true);
  }, [items, totalPrice]);

  const value = {
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    totalCount,
    totalPrice,
    isCartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    isOrderFormOpen,
    openOrderForm,
    closeOrderForm: () => setOrderFormOpen(false),
    buyNow,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

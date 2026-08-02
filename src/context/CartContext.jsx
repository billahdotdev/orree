import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { trackAddToCart, trackBeginCheckout } from "../tracker.js";
import { getPrimaryImage } from "../utils/productImages.js";

const CartContext = createContext(null);
const DEFAULT_STORAGE_KEY = "orree_cart_v1";

function loadStoredCart(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const sumPrice = (list) => list.reduce((sum, i) => sum + i.qty * i.price, 0);

/**
 * `persist` defaults to true (the main site's cart survives refreshes).
 * Ad-campaign landing pages pass `persist={false}` — each is a one-shot,
 * single-product mini-cart that shouldn't collide with the main site's key.
 */
export function CartProvider({ children, persist = true, storageKey = DEFAULT_STORAGE_KEY }) {
  const [items, setItems] = useState(() => (persist ? loadStoredCart(storageKey) : []));
  const [isCartOpen, setCartOpen] = useState(false);
  const [isOrderFormOpen, setOrderFormOpen] = useState(false);

  // Mirror of `items` that is correct SYNCHRONOUSLY, within the same tick as
  // a setState call. This is what fixes the landing page's missing
  // InitiateCheckout: handleOrderClick does clearCart() → addItem() →
  // openOrderForm() in one tick, so any callback reading `items` from render
  // closure sees the PRE-CLICK cart — which on a fresh ad visit is empty, so
  // the event never fired at all.
  const itemsRef = useRef(items);
  const writeItems = useCallback((updater) => {
    setItems((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      itemsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!persist) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Private browsing / quota — cart still works in memory.
    }
  }, [items, persist, storageKey]);

  const addItem = useCallback(
    (product, qty = 1) => {
      writeItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i));
        return [
          ...prev,
          {
            id: product.id,
            title: product.title,
            price: product.price,
            currency: product.currency || "৳",
            weight: product.weight,
            // Snapshot the photo at add-time so the checkout sheet can show it
            // without re-deriving it from the catalogue. Carts persisted by an
            // older build won't have this field; OrderForm falls back to a
            // catalogue lookup for those, so nothing breaks on upgrade.
            image: getPrimaryImage(product),
            qty,
          },
        ];
      });
      trackAddToCart(product, qty);
    },
    [writeItems]
  );

  const removeItem = useCallback((id) => writeItems((prev) => prev.filter((i) => i.id !== id)), [writeItems]);

  const updateQty = useCallback(
    (id, qty) => {
      if (qty < 1) {
        writeItems((prev) => prev.filter((i) => i.id !== id));
        return;
      }
      writeItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
    },
    [writeItems]
  );

  const clearCart = useCallback(() => writeItems([]), [writeItems]);

  const totalCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const totalPrice = useMemo(() => sumPrice(items), [items]);

  /**
   * Reads from itemsRef, never from the render closure — so it is correct
   * even when called in the same tick as addItem().
   */
  const openOrderForm = useCallback(() => {
    const current = itemsRef.current;
    if (current.length > 0) trackBeginCheckout(current, sumPrice(current));
    setOrderFormOpen(true);
  }, []);

  const closeOrderForm = useCallback(() => setOrderFormOpen(false), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  /** Opens the order form directly with a single product (product card CTA). */
  const buyNow = useCallback(
    (product, qty = 1) => {
      addItem(product, qty);
      openOrderForm();
    },
    [addItem, openOrderForm]
  );

  // Memoised: previously this object was rebuilt every render, so every
  // useCart() consumer re-rendered on every keystroke anywhere in the tree.
  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      totalCount,
      totalPrice,
      isCartOpen,
      openCart,
      closeCart,
      isOrderFormOpen,
      openOrderForm,
      closeOrderForm,
      buyNow,
    }),
    [
      items, addItem, removeItem, updateQty, clearCart, totalCount, totalPrice,
      isCartOpen, openCart, closeCart, isOrderFormOpen, openOrderForm, closeOrderForm, buyNow,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  priceInCents: number;
  imageUrl?: string;
  quantity: number;
}

interface AppliedDiscount {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number; // e.g. 10 for 10%, or fixed cents
  minSpendInCents: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: string | undefined, delta: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  openCart: () => void;
  closeCart: () => void;
  totalItemsCount: number;
  totalAmountInCents: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Discount state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Customer form state
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("mystore_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mystore_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  }, [cart]);

  // Add Item to Cart
  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  // Update quantity directly in cart (+1 or -1)
  const updateQuantity = (productId: string, variantId: string | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId && item.variantId === variantId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // DYNAMIC TOTAL CALCULATIONS
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalInCents = cart.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0);

  // Dynamically calculate discount on EVERY cart change
  const discountInCents = useMemo(() => {
    if (!appliedDiscount || subtotalInCents === 0) return 0;

    // Invalidate if subtotal drops below minimum spend
    if (appliedDiscount.minSpendInCents > 0 && subtotalInCents < appliedDiscount.minSpendInCents) {
      return 0;
    }

    if (appliedDiscount.type === "PERCENTAGE") {
      return Math.round((subtotalInCents * appliedDiscount.value) / 100);
    }
    return Math.min(appliedDiscount.value, subtotalInCents);
  }, [appliedDiscount, subtotalInCents]);

  const shippingInCents = subtotalInCents >= 5000 || subtotalInCents === 0 ? 0 : 500;
  const totalAmountInCents = Math.max(0, subtotalInCents + shippingInCents - discountInCents);

  // Apply Coupon Code
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setValidatingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          subtotalInCents,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAppliedDiscount({
          code: data.code,
          type: data.type,
          value: data.value,
          minSpendInCents: data.minSpendInCents,
        });
        setCouponCodeInput("");
      } else {
        setCouponError(data.error || "Invalid coupon code");
      }
    } catch (err) {
      setCouponError("Failed to apply coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponError("");
  };

  // Handle Checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");

    setSubmittingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: cart,
          paymentMethod: "COD",
          discountCode: appliedDiscount?.code,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("🎉 Order placed successfully! Thank you for your purchase.");
        setCart([]);
        setAppliedDiscount(null);
        localStorage.removeItem("mystore_cart");
        setCustomer({ name: "", email: "", phone: "", address: "" });
        setIsCartOpen(false);
      } else {
        alert(data.error || "Failed to place order.");
      }
    } catch (err: any) {
      alert("Something went wrong placing order!");
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        openCart,
        closeCart,
        totalItemsCount,
        totalAmountInCents,
      }}
    >
      {children}

      {/* Global Slide-Out Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            onClick={closeCart}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Your Shopping Cart</h2>
                <button
                  onClick={closeCart}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Items List */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-12">Your cart is empty.</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId}`}
                      className="flex items-center justify-between border-b border-gray-100 pb-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl || "https://placehold.co/60x60"}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</p>
                          <p className="text-xs text-indigo-600 font-medium">
                            {item.variantTitle}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.priceInCents)}
                          </p>

                          {/* Quantity Stepper (+ / -) */}
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, -1)}
                              className="w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700 flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-gray-900 px-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, 1)}
                              className="w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700 flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}

                {/* Promo Code Box */}
                {cart.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    {appliedDiscount ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-xl text-xs font-semibold">
                        <span>
                          🏷️ Coupon <strong>{appliedDiscount.code}</strong> applied (-{formatCurrency(discountInCents)})
                        </span>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-green-700 hover:text-green-900 font-bold ml-2 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="space-y-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Promo code (e.g. WELCOME10)"
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                            className="flex-1 border rounded-lg p-2 text-xs font-mono uppercase text-gray-900 bg-white outline-none focus:border-black"
                          />
                          <button
                            type="submit"
                            disabled={validatingCoupon || !couponCodeInput.trim()}
                            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition disabled:bg-gray-300 cursor-pointer"
                          >
                            {validatingCoupon ? "..." : "Apply"}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-xs text-red-600 pl-1">{couponError}</p>
                        )}
                      </form>
                    )}
                  </div>
                )}

                {/* Customer Checkout Form */}
                {cart.length > 0 && (
                  <form onSubmit={handleCheckout} id="global-checkout-form" className="pt-4 space-y-3">
                    <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider border-t border-gray-200 pt-3">
                      Shipping & Delivery Details
                    </h3>
                    <input
                      required
                      type="text"
                      placeholder="Full Name *"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-xs text-gray-900 bg-white outline-none focus:border-black"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email Address *"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-xs text-gray-900 bg-white outline-none focus:border-black"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="Phone Number *"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-xs text-gray-900 bg-white outline-none focus:border-black"
                    />
                    <textarea
                      required
                      rows={2}
                      placeholder="Delivery Address *"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className="w-full border rounded-lg p-2.5 text-xs text-gray-900 bg-white outline-none focus:border-black"
                    ></textarea>
                  </form>
                )}
              </div>

              {/* Drawer Footer with Dynamic Breakdown */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-3">
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotalInCents)}</span>
                    </div>

                    {appliedDiscount && (
                      <div className="flex justify-between text-green-700 font-semibold">
                        <span>Discount ({appliedDiscount.code}):</span>
                        <span>-{formatCurrency(discountInCents)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{shippingInCents === 0 ? "Free" : formatCurrency(shippingInCents)}</span>
                    </div>

                    <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span className="text-indigo-600">{formatCurrency(totalAmountInCents)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    form="global-checkout-form"
                    disabled={submittingOrder}
                    className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-xl text-sm transition disabled:bg-gray-400 cursor-pointer"
                  >
                    {submittingOrder
                      ? "Placing Order..."
                      : `Place Order (${formatCurrency(totalAmountInCents)})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
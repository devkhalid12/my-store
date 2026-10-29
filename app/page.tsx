"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import Link from "next/link";

// 1. Data Type Definitions for TypeScript
interface Product {
  _id: string;
  title: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stock?: number;
  description: string;
}

interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Settings {
  storeName: string;
  announcementText: string;
  heroTitle: string;
  heroSubtitle: string;
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Customer form state
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Store Customization
  const [settings, setSettings] = useState<Settings>({
    storeName: "MYSTORE",
    announcementText: "🚀 Free shipping on all orders over $50!",
    heroTitle: "Discover Our Latest Collection",
    heroSubtitle: "High quality essentials designed for your everyday lifestyle.",
  });

  useEffect(() => {
    async function loadStoreData() {
      try {
        const settingsRes = await fetch("/api/settings");
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings);
        }

        const productsRes = await fetch("/api/products");
        const productsData = await productsRes.json();
        if (productsData.success) {
          setProducts(productsData.products);
        }
      } catch (err) {
        console.error("Error loading store data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, []);

  // Dynamically extract unique categories
  const categories = useMemo<string[]>(() => {
    const unique = new Set(
      products.map((p) => p.category).filter((c): c is string => Boolean(c))
    );
    return ["All", ...Array.from(unique)];
  }, [products]);

  // Filtered products based on search term & category
  const filteredProducts = useMemo<Product[]>(() => {
    return products.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart Handlers
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handle Order Placement
  const handleCheckout = async (e: FormEvent) => {
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
          totalAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("🎉 Order placed successfully! Thank you for your purchase.");
        setCart([]);
        setCustomer({ name: "", email: "", phone: "", address: "" });
        setIsCartOpen(false);
      } else {
        alert(data.error || "Failed to place order.");
      }
    } catch (err) {
      alert("Something went wrong!");
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Announcement Bar */}
      {settings.announcementText && (
        <div className="bg-black text-white text-xs py-2 text-center font-medium tracking-wide">
          {settings.announcementText}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-gray-900">
            {settings.storeName}
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-medium transition"
            >
              ⚙️ Admin Panel
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 text-gray-800 hover:text-black font-medium text-sm cursor-pointer"
            >
              <span className="text-xl">🛒</span>
              <span>Cart</span>
              {totalItemsCount > 0 && (
                <span className="bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            {settings.heroTitle}
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">{settings.heroSubtitle}</p>
        </div>
      </section>

      {/* Main Catalog */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-black text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div>
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <p className="text-4xl mb-2">🔍</p>
              <h3 className="font-semibold text-gray-800">No matching products found</h3>
              <p className="text-sm text-gray-500 mt-1">
                Try searching for something else or clearing filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                    <img
                      src={item.imageUrl || "https://placehold.co/400x400?text=Product"}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-gray-800 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block">Price</span>
                        <span className="text-lg font-extrabold text-gray-900">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(item)}
                        className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                      >
                        + Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Cart Drawer & Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Your Shopping Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-12">Your cart is empty.</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between border-b border-gray-100 pb-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl || "https://placehold.co/60x60"}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">
                            ${item.price} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}

                {cart.length > 0 && (
                  <form onSubmit={handleCheckout} id="checkout-form" className="pt-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 text-sm border-t border-gray-200 pt-3">
                      Shipping & Delivery Details
                    </h3>
                    <input
                      required
                      type="text"
                      placeholder="Full Name *"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full border rounded-lg p-2 text-xs text-gray-900 bg-white outline-none focus:border-black"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email Address *"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full border rounded-lg p-2 text-xs text-gray-900 bg-white outline-none focus:border-black"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="Phone Number *"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full border rounded-lg p-2 text-xs text-gray-900 bg-white outline-none focus:border-black"
                    />
                    <textarea
                      required
                      rows={2}
                      placeholder="Delivery Address *"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className="w-full border rounded-lg p-2 text-xs text-gray-900 bg-white outline-none focus:border-black"
                    ></textarea>
                  </form>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-4">
                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <span>Total:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>

                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={submittingOrder}
                    className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-lg text-sm transition disabled:bg-gray-400 cursor-pointer"
                  >
                    {submittingOrder ? "Placing Order..." : `Place Order ($${totalAmount.toFixed(2)})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
      </footer>
    </div>
  );
}
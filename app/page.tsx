"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface Variant {
  _id?: string;
  sku: string;
  title: string;
  priceInCents: number;
  compareAtPriceInCents?: number;
  stock: number;
}

interface Product {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  category?: string;
  images?: string[];
  imageUrl?: string;
  variants?: Variant[];
  price?: number;
}

interface Settings {
  storeName: string;
  announcementText: string;
  heroTitle: string;
  heroSubtitle: string;
}

export default function Storefront() {
  // Connect to the unified Global Cart
  const { addToCart, openCart, totalItemsCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

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

  const getProductPriceInCents = (item: Product): number => {
    if (item.variants && item.variants.length > 0) {
      return item.variants[0].priceInCents;
    }
    if (typeof item.price === "number") {
      return Math.round(item.price * 100);
    }
    return 0;
  };

  const getProductImage = (item: Product): string => {
    if (item.images && item.images.length > 0) return item.images[0];
    if (item.imageUrl) return item.imageUrl;
    return "https://placehold.co/400x400?text=Product";
  };

  const categories = useMemo<string[]>(() => {
    const unique = new Set(
      products.map((p) => p.category).filter((c): c is string => Boolean(c))
    );
    return ["All", ...Array.from(unique)];
  }, [products]);

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

  // Handle Add to Cart from Homepage
  const handleQuickAdd = (product: Product) => {
    const defaultVariant = product.variants?.[0];
    addToCart({
      productId: product._id,
      variantId: defaultVariant?._id,
      title: product.title,
      variantTitle: defaultVariant?.title || "Default",
      priceInCents: getProductPriceInCents(product),
      imageUrl: getProductImage(product),
      quantity: 1,
    });
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

            {/* Global Cart Button */}
            <button
              onClick={openCart}
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
              {filteredProducts.map((item) => {
                const priceInCents = getProductPriceInCents(item);
                const displayImage = getProductImage(item);
                const variantCount = item.variants?.length || 1;
                const productLink = `/products/${item.slug || item._id}`;

                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <Link href={productLink} className="block group">
                      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                        <img
                          src={displayImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-gray-800 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">
                          {item.category || "General"}
                        </span>
                        {variantCount > 1 && (
                          <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                            {variantCount} variants
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={productLink}>
                          <h3 className="font-semibold text-gray-900 text-base line-clamp-1 hover:underline hover:text-indigo-600 transition">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400 block">Price</span>
                          <span className="text-lg font-extrabold text-gray-900">
                            {formatCurrency(priceInCents)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleQuickAdd(item)}
                          className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                        >
                          + Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        © 2026 {settings.storeName}. All rights reserved.
      </footer>
    </div>
  );
}
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface Variant {
  _id: string;
  sku: string;
  title: string;
  priceInCents: number;
  compareAtPriceInCents?: number;
  stock: number;
  options?: Record<string, string>;
}

interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  images: string[];
  variants: Variant[];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { addToCart, openCart, totalItemsCount } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        if (data.success && data.product) {
          setProduct(data.product);
          if (data.product.variants && data.product.variants.length > 0) {
            setSelectedVariant(data.product.variants[0]);
          }
          if (data.product.images && data.product.images.length > 0) {
            setSelectedImage(data.product.images[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500 font-sans">
        Loading product details...
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <p className="text-4xl mb-3">🔍</p>
        <h1 className="text-xl font-bold text-gray-900">Product Not Found</h1>
        <p className="text-sm text-gray-500 mt-1">This item might be archived or sold out.</p>
        <Link
          href="/"
          className="mt-6 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition"
        >
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const hasDiscount =
    selectedVariant.compareAtPriceInCents &&
    selectedVariant.compareAtPriceInCents > selectedVariant.priceInCents;

  const discountAmount = hasDiscount
    ? selectedVariant.compareAtPriceInCents! - selectedVariant.priceInCents
    : 0;

  const isOutOfStock = selectedVariant.stock <= 0;

  const handleAddToCart = () => {
    addToCart({
      productId: product._id,
      variantId: selectedVariant._id,
      title: product.title,
      variantTitle: selectedVariant.title,
      priceInCents: selectedVariant.priceInCents,
      imageUrl: selectedImage || product.images?.[0] || "",
      quantity,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1.5 transition"
          >
            ← Back to Store
          </Link>
          <Link href="/" className="text-lg font-extrabold tracking-tight text-gray-900">
            KHALID<span className="text-indigo-600">STORE</span>
          </Link>
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
      </header>

      {/* Main PDP Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <img
                src={selectedImage || "https://placehold.co/600x600?text=Product"}
                alt={product.title}
                className="w-full h-full object-cover transition duration-300"
              />
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 rounded-xl border-2 overflow-hidden bg-white shrink-0 cursor-pointer transition ${
                      selectedImage === img
                        ? "border-black shadow-xs"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Controls */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6">
            <div>
              <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">
                {product.category}
              </span>
              <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
                {product.title}
              </h1>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                SKU: {selectedVariant.sku}
              </p>
            </div>

            <div className="flex items-baseline gap-3 pb-4 border-b border-gray-100">
              <span className="text-3xl font-extrabold text-gray-900">
                {formatCurrency(selectedVariant.priceInCents)}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {formatCurrency(selectedVariant.compareAtPriceInCents!)}
                  </span>
                  <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full">
                    Save {formatCurrency(discountAmount)}
                  </span>
                </>
              )}
            </div>

            {/* Variant selector */}
            {product.variants.length > 1 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-700 uppercase">Select Variant</span>
                  <span className="text-gray-500 font-medium">{selectedVariant.title}</span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((variant) => (
                    <button
                      key={variant._id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        selectedVariant._id === variant._id
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-800 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {variant.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock indicator */}
            <div>
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                  🔴 Out of Stock
                </span>
              ) : selectedVariant.stock <= 10 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  🟠 Low Stock: Only {selectedVariant.stock} units remaining!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                  🟢 In Stock ({selectedVariant.stock} units ready to ship)
                </span>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg transition disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                    disabled={quantity >= selectedVariant.stock || isOutOfStock}
                    className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg transition disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg text-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isOutOfStock
                    ? "Out of Stock"
                    : `Add to Cart • ${formatCurrency(selectedVariant.priceInCents * quantity)}`}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-600">
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider">
                Product Details
              </h3>
              <p className="leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
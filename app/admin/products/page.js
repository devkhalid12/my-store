"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    sku: "",
    price: "",
    category: "Clothing",
    imageUrl: "",
    stock: "",
    description: "",
  });

  // 1. Fetch products from API
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Submit new product (formats into multi-variant structure with cents)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const priceInCents = Math.round(parseFloat(formData.price || "0") * 100);
      const stock = parseInt(formData.stock || "0", 10);
      const sku =
        formData.sku.trim() ||
        `${formData.title.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim() || "General",
        images: formData.imageUrl.trim() ? [formData.imageUrl.trim()] : [],
        variants: [
          {
            sku,
            title: "Default Title",
            priceInCents,
            stock,
          },
        ],
        status: "ACTIVE",
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setFormData({
          title: "",
          sku: "",
          price: "",
          category: "Clothing",
          imageUrl: "",
          stock: "",
          description: "",
        });
        setShowForm(false);
        fetchProducts();
      } else {
        alert(data.error || "Failed to create product");
      }
    } catch (error) {
      alert("Something went wrong creating product!");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete product
  const handleDelete = async (productId, productTitle) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${productTitle}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
      } else {
        alert(data.error || "Failed to delete product");
      }
    } catch (err) {
      alert("Error deleting product");
    }
  };

  // Helper to get product price safely
  const getProductPriceInCents = (item) => {
    if (item.variants && item.variants.length > 0) {
      return item.variants[0].priceInCents || 0;
    }
    if (typeof item.price === "number") {
      return Math.round(item.price * 100);
    }
    return 0;
  };

  // Helper to get total stock count across all variants
  const getTotalStock = (item) => {
    if (item.variants && item.variants.length > 0) {
      return item.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return item.stock || 0;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products & Inventory Catalog</h2>
          <p className="text-sm text-gray-500">Manage SKUs, variants, stock, and pricing.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          {showForm ? "✕ Cancel" : "+ Add Product"}
        </button>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4"
        >
          <h3 className="text-lg font-bold text-gray-900">Add New Multi-Variant Product</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Product Title *
              </label>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Classic Organic Hoodie"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                SKU (Stock Keeping Unit)
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. HD-BLK-M (leave empty to auto-generate)"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Price ($) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="49.99"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Apparel, Electronics"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="25"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Description *
              </label>
              <textarea
                required
                rows="3"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of materials, sizing, and features..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition disabled:bg-gray-400 cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-4xl mb-2">📦</p>
            <h4 className="font-semibold text-gray-800">No products found</h4>
            <p className="text-sm text-gray-500 mt-1">Click "+ Add Product" to create your first item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Variants / Stock</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((item) => {
                  const priceInCents = getProductPriceInCents(item);
                  const totalStock = getTotalStock(item);
                  const displayImage =
                    item.images?.[0] || item.imageUrl || "https://placehold.co/100x100?text=No+Img";
                  const variantCount = item.variants?.length || 1;

                  return (
                    <tr key={item._id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={displayImage}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs">{item.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">{item.category}</td>
                      <td className="px-6 py-4 font-extrabold text-gray-900">
                        {formatCurrency(priceInCents)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-block ${
                              totalStock > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                          </span>
                          {variantCount > 1 && (
                            <span className="block text-[11px] text-gray-400 font-medium">
                              {variantCount} variants
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(item._id, item.title)}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
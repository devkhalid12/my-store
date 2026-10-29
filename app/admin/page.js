"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    recentOrders: [],
  });

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        // Fetch products & orders simultaneously
        const [productsRes, ordersRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/orders"),
        ]);

        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();

        const products = productsData.success ? productsData.products : [];
        const orders = ordersData.success ? ordersData.orders : [];

        // Calculate total sales (excluding cancelled orders)
        const totalSales = orders
          .filter((o) => o.status !== "Cancelled")
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        setStats({
          totalSales,
          totalOrders: orders.length,
          totalProducts: products.length,
          recentOrders: orders.slice(0, 4), // show up to 4 most recent
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Loading store analytics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Here is what is happening with your store today.</p>
      </div>

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Sales
          </span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">
            ${stats.totalSales.toFixed(2)}
          </p>
          <span className="text-xs text-gray-400 mt-1 block">Live lifetime sales</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Orders
          </span>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalOrders}</p>
          <span className="text-xs text-gray-400 mt-1 block">Completed & pending orders</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Active Products
          </span>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalProducts}</p>
          <span className="text-xs text-gray-400 mt-1 block">Items in store catalog</span>
        </div>
      </div>

      {/* Recent Orders Section (Shopify Style) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Recent Orders</h3>
            <p className="text-xs text-gray-400">Latest activity from your storefront</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View all orders →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No orders placed yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentOrders.map((order) => (
              <div key={order._id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-gray-900 block">
                    {order.customer.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {order.items.length} item(s) •{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "Processing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="font-bold text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Launch Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/products"
          className="p-5 bg-white border border-gray-200 rounded-xl hover:border-black transition flex items-center justify-between group"
        >
          <div>
            <h4 className="font-semibold text-gray-900">Add or Edit Products</h4>
            <p className="text-xs text-gray-500 mt-0.5">Manage stock, prices, and images</p>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition">📦</span>
        </Link>

        <Link
          href="/admin/customize"
          className="p-5 bg-white border border-gray-200 rounded-xl hover:border-black transition flex items-center justify-between group"
        >
          <div>
            <h4 className="font-semibold text-gray-900">Customize Theme & Brand</h4>
            <p className="text-xs text-gray-500 mt-0.5">Update banners, headline, and store name</p>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition">🎨</span>
        </Link>
      </div>
    </div>
  );
}
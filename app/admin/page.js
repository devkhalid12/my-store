"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSalesInCents: 0,
    totalOrders: 0,
    totalProducts: 0,
    recentOrders: [],
  });

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/orders"),
        ]);

        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();

        const products = productsData.success ? productsData.products : [];
        const orders = ordersData.success ? ordersData.orders : [];

        // Helper to extract order total in cents safely
        const getOrderTotalInCents = (order) => {
          if (typeof order.totalInCents === "number") return order.totalInCents;
          if (typeof order.totalAmount === "number") return Math.round(order.totalAmount * 100);
          return 0;
        };

        // Calculate total sales (excluding cancelled orders)
        const totalSalesInCents = orders
          .filter(
            (o) =>
              o.status !== "Cancelled" &&
              o.status !== "CANCELLED" &&
              o.fulfillmentStatus !== "CANCELLED"
          )
          .reduce((sum, o) => sum + getOrderTotalInCents(o), 0);

        setStats({
          totalSalesInCents,
          totalOrders: orders.length,
          totalProducts: products.length,
          recentOrders: orders.slice(0, 5),
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  const getOrderTotalInCents = (order) => {
    if (typeof order.totalInCents === "number") return order.totalInCents;
    if (typeof order.totalAmount === "number") return Math.round(order.totalAmount * 100);
    return 0;
  };

  const getBadgeStyle = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "DELIVERED") return "bg-green-100 text-green-800 border-green-200";
    if (s === "SHIPPED") return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (s === "PROCESSING") return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === "CANCELLED") return "bg-red-100 text-red-800 border-red-200";
    return "bg-amber-100 text-amber-800 border-amber-200"; // UNFULFILLED / PENDING
  };

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Loading store analytics...</div>;
  }

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Live operational snapshot of your store.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Sales
          </span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">
            {formatCurrency(stats.totalSalesInCents)}
          </p>
          <span className="text-xs text-gray-400 mt-1 block">Live lifetime sales</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Orders
          </span>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalOrders}</p>
          <span className="text-xs text-gray-400 mt-1 block">Completed & pending orders</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Active Products
          </span>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalProducts}</p>
          <span className="text-xs text-gray-400 mt-1 block">Multi-variant catalog items</span>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Recent Orders</h3>
            <p className="text-xs text-gray-400">Latest transactions from your storefront</p>
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
            {stats.recentOrders.map((order) => {
              const currentStatus =
                order.fulfillmentStatus || order.status || "UNFULFILLED";

              return (
                <div key={order._id} className="py-3.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-gray-900 block">
                      {order.customer?.name || "Customer"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {order.items?.length || 1} item(s) •{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getBadgeStyle(
                        currentStatus
                      )}`}
                    >
                      {currentStatus}
                    </span>
                    <span className="font-extrabold text-gray-900">
                      {formatCurrency(getOrderTotalInCents(order))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/products"
          className="p-5 bg-white border border-gray-200 rounded-xl hover:border-black transition flex items-center justify-between group shadow-xs"
        >
          <div>
            <h4 className="font-bold text-gray-900">Manage Catalog & Inventory</h4>
            <p className="text-xs text-gray-500 mt-0.5">Track multi-variant stock and SKUs</p>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition">📦</span>
        </Link>

        <Link
          href="/admin/orders"
          className="p-5 bg-white border border-gray-200 rounded-xl hover:border-black transition flex items-center justify-between group shadow-xs"
        >
          <div>
            <h4 className="font-bold text-gray-900">Fulfill Orders & Print Slips</h4>
            <p className="text-xs text-gray-500 mt-0.5">Ship orders and print customer invoices</p>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition">📑</span>
        </Link>
      </div>
    </div>
  );
}
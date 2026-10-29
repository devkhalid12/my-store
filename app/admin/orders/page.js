"use client";

import { useState, useEffect } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all orders
  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Update order status in database
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state immediately
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Error updating order status");
    }
  };

  // Color badge for statuses
  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"; // Pending
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
        <p className="text-sm text-gray-500">Track and fulfill customer orders.</p>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500 text-sm">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-16 rounded-xl border border-gray-200 text-center">
          <p className="text-4xl mb-2">📑</p>
          <h3 className="font-semibold text-gray-800">No orders placed yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            When customers place orders from your storefront, they will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-100 gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 text-base">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Change Status Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Status:</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="border border-gray-300 rounded-lg text-xs font-medium p-1.5 bg-white outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Order Details & Customer Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Customer Information */}
                <div className="space-y-1.5 text-xs text-gray-600">
                  <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">
                    Customer & Shipping
                  </h4>
                  <p>
                    <strong className="text-gray-900">Name:</strong> {order.customer.name}
                  </p>
                  <p>
                    <strong className="text-gray-900">Email:</strong> {order.customer.email}
                  </p>
                  <p>
                    <strong className="text-gray-900">Phone:</strong> {order.customer.phone}
                  </p>
                  <p>
                    <strong className="text-gray-900">Address:</strong> {order.customer.address}
                  </p>
                </div>

                {/* Items Purchased */}
                <div>
                  <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">
                    Items ({order.items.length})
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.imageUrl || "https://placehold.co/40x40"}
                            alt={item.title}
                            className="w-8 h-8 rounded object-cover border"
                          />
                          <span className="font-medium text-gray-800">
                            {item.title} × {item.quantity}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 flex justify-between items-center text-sm font-extrabold text-gray-900 border-t border-gray-100 mt-3">
                    <span>Total Order Amount:</span>
                    <span className="text-base text-indigo-600">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  sku?: string;
  priceInCents: number;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    postalCode?: string;
  };
  items: OrderItem[];
  subtotalInCents: number;
  shippingInCents: number;
  totalInCents: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  fulfillmentStatus: "UNFULFILLED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: string;
  trackingNumber?: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

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

  const handleUpdateOrder = async (
    orderId: string,
    updates: { fulfillmentStatus?: string; status?: string; trackingNumber?: string }
  ) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, ...updates } : o))
        );
      } else {
        alert("Failed to update order status");
      }
    } catch (err) {
      alert("Error updating order");
    }
  };

  const getFulfillmentBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"; // UNFULFILLED
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders & Fulfillment</h2>
          <p className="text-sm text-gray-500">
            Track customer deliveries, manage statuses, and print packaging slips.
          </p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium">
          Total Orders: {orders.length}
        </span>
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
            Orders placed on your live storefront will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const totalCents =
              order.totalInCents || (order as any).totalAmount * 100 || 0;
            const subtotalCents = order.subtotalInCents || totalCents;
            const shippingCents = order.shippingInCents || 0;

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center pb-4 border-b border-gray-100 gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-gray-900 text-lg">
                        {order.orderNumber || `ORD-${order._id.slice(-6).toUpperCase()}`}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getFulfillmentBadge(
                          order.fulfillmentStatus || (order as any).status || "UNFULFILLED"
                        )}`}
                      >
                        {order.fulfillmentStatus || (order as any).status || "UNFULFILLED"}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full font-bold border border-gray-200">
                        {order.paymentMethod || "COD"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 block">
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Actions & Print Button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      🖨️ Print Invoice
                    </button>

                    {/* Fulfillment Dropdown */}
                    <select
                      value={order.fulfillmentStatus || (order as any).status || "UNFULFILLED"}
                      onChange={(e) =>
                        handleUpdateOrder(order._id, {
                          fulfillmentStatus: e.target.value,
                          status: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-lg text-xs font-medium p-1.5 bg-white text-gray-900 outline-none focus:ring-1 focus:ring-black cursor-pointer"
                    >
                      <option value="UNFULFILLED">Unfulfilled</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Customer Information */}
                  <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
                      Customer & Delivery Address
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

                  {/* Items Purchased (Snapshots) */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                      Purchased Items ({order.items.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {order.items.map((item, idx) => {
                        const itemPriceCents =
                          item.priceInCents || (item as any).price * 100 || 0;

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.imageUrl || "https://placehold.co/50x50"}
                                alt={item.title}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                              />
                              <div>
                                <p className="font-bold text-gray-900">{item.title}</p>
                                <p className="text-[11px] text-indigo-600 font-medium">
                                  {item.variantTitle || "Default"} • SKU: {item.sku || "N/A"}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {formatCurrency(itemPriceCents)} × {item.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="font-extrabold text-gray-900">
                              {formatCurrency(itemPriceCents * item.quantity)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotalCents)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{shippingCents === 0 ? "Free" : formatCurrency(shippingCents)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1 border-t border-gray-100">
                        <span>Total:</span>
                        <span className="text-indigo-600">{formatCurrency(totalCents)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">INVOICE & PACKING SLIP</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Order Number: <strong>{selectedInvoiceOrder.orderNumber || selectedInvoiceOrder._id}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Date: {new Date(selectedInvoiceOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black tracking-tight text-gray-900">MYSTORE</span>
                <p className="text-xs text-gray-400">Official Merchant Receipt</p>
              </div>
            </div>

            {/* Ship To */}
            <div className="bg-gray-50 p-4 rounded-xl text-xs space-y-1">
              <span className="font-bold uppercase tracking-wider text-gray-700 block mb-1">
                Ship To:
              </span>
              <p className="font-bold text-gray-900">{selectedInvoiceOrder.customer.name}</p>
              <p>{selectedInvoiceOrder.customer.address}</p>
              <p>Phone: {selectedInvoiceOrder.customer.phone}</p>
              <p>Email: {selectedInvoiceOrder.customer.email}</p>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-gray-500">
                  <th className="py-2">Item & Variant</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedInvoiceOrder.items.map((item, idx) => {
                  const pCents = item.priceInCents || (item as any).price * 100 || 0;
                  return (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-gray-900">
                        {item.title}
                        {item.variantTitle && (
                          <span className="text-gray-500 block text-[11px]">
                            ({item.variantTitle})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-gray-500 font-mono">{item.sku || "N/A"}</td>
                      <td className="py-2.5 text-center font-bold text-gray-900">{item.quantity}</td>
                      <td className="py-2.5 text-right text-gray-600">{formatCurrency(pCents)}</td>
                      <td className="py-2.5 text-right font-bold text-gray-900">
                        {formatCurrency(pCents * item.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4 text-right space-y-1 text-xs">
              <p className="text-gray-500">
                Subtotal: {formatCurrency(selectedInvoiceOrder.subtotalInCents || selectedInvoiceOrder.totalInCents)}
              </p>
              <p className="text-gray-500">
                Shipping: {selectedInvoiceOrder.shippingInCents ? formatCurrency(selectedInvoiceOrder.shippingInCents) : "Free"}
              </p>
              <p className="text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                Total Paid: {formatCurrency(selectedInvoiceOrder.totalInCents || (selectedInvoiceOrder as any).totalAmount * 100)}
              </p>
            </div>

            {/* Invoice Modal Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                🖨️ Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
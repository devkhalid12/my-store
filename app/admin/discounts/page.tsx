"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

interface Discount {
  _id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minSpendInCents: number;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    value: "10",
    minSpend: "0",
  });

  const loadDiscounts = async () => {
    try {
      const res = await fetch("/api/discounts");
      const data = await res.json();
      if (data.success) {
        setDiscounts(data.discounts);
      }
    } catch (err) {
      console.error("Failed to load discounts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const rawValue = parseFloat(formData.value);
      // If type is FIXED_AMOUNT, convert dollars to cents (e.g. $15 -> 1500 cents)
      const finalValue =
        formData.type === "FIXED_AMOUNT" ? Math.round(rawValue * 100) : rawValue;

      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          type: formData.type,
          value: finalValue,
          minSpend: formData.minSpend,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormData({ code: "", type: "PERCENTAGE", value: "10", minSpend: "0" });
        setShowForm(false);
        loadDiscounts();
      } else {
        alert(data.error || "Failed to create discount");
      }
    } catch (err) {
      alert("Error creating discount");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;

    try {
      const res = await fetch("/api/discounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscounts((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      alert("Error deleting discount");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discounts & Coupons</h2>
          <p className="text-sm text-gray-500">
            Create promotional coupon codes to boost your store sales.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
        >
          {showForm ? "✕ Cancel" : "+ Create Coupon"}
        </button>
      </div>

      {/* Create Coupon Form */}
      {showForm && (
        <form
          onSubmit={handleCreateDiscount}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4"
        >
          <h3 className="text-lg font-bold text-gray-900">Create Promotional Code</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Coupon Code *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. WELCOME10 or SUMMER25"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm uppercase text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Discount Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "PERCENTAGE" | "FIXED_AMOUNT",
                  })
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black cursor-pointer"
              >
                <option value="PERCENTAGE">Percentage (%) Off</option>
                <option value="FIXED_AMOUNT">Fixed Dollar ($) Off</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                {formData.type === "PERCENTAGE" ? "Discount Percentage (%) *" : "Discount Amount ($) *"}
              </label>
              <input
                required
                type="number"
                step="0.01"
                placeholder={formData.type === "PERCENTAGE" ? "10" : "15.00"}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Minimum Order Spend ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0 (no minimum required)"
                value={formData.minSpend}
                onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black"
              />
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
              {submitting ? "Creating..." : "Save Coupon"}
            </button>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading discounts...</div>
        ) : discounts.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-4xl mb-2">🏷️</p>
            <h4 className="font-semibold text-gray-800">No discount codes created yet</h4>
            <p className="text-sm text-gray-500 mt-1">
              Click "+ Create Coupon" above to launch your first promotional discount.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Type & Value</th>
                  <th className="px-6 py-3.5">Min Spend</th>
                  <th className="px-6 py-3.5">Used Count</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {discounts.map((discount) => (
                  <tr key={discount._id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 tracking-wide text-base">
                      {discount.code}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-indigo-600">
                        {discount.type === "PERCENTAGE"
                          ? `${discount.value}% OFF`
                          : `${formatCurrency(discount.value)} OFF`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {discount.minSpendInCents > 0
                        ? formatCurrency(discount.minSpendInCents)
                        : "No minimum"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      {discount.usedCount} times
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(discount._id, discount.code)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
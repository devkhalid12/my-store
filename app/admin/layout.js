"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Check if already logged in during this browser session
  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("admin_authenticated", "true");
        setIsAuthenticated(true);
      } else {
        setErrorMsg("Incorrect passcode. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Error verifying passcode.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Checking credentials...
      </div>
    );
  }

  // If not logged in, show Shopify-style Login Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-4xl">🔐</span>
            <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
            <p className="text-xs text-gray-500">
              Enter your passcode to manage your store.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200 text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Passcode
              </label>
              <input
                required
                type="password"
                placeholder="Enter admin passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg text-sm transition cursor-pointer"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 underline">
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Once authenticated, show full dashboard with Logout button
  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-[#1a1a1a] text-gray-300 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-800">
            <span className="text-xl font-bold tracking-wide text-white">🛍️ MyStore Admin</span>
          </div>

          <nav className="p-4 space-y-2">
            <Link
              href="/admin"
              className="flex items-center px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition"
            >
              📦 Products
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition"
            >
              📑 Orders
            </Link>
            <Link
              href="/admin/customize"
              className="flex items-center px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition"
            >
              🎨 Store Customization
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="block text-center text-xs py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
          >
            ↗ View Live Store
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-center text-xs py-2 px-3 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded transition font-medium cursor-pointer"
          >
            🔒 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">Admin Control Panel</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">
              🟢 Store Live
            </span>
            <button
              onClick={handleLogout}
              className="md:hidden text-xs text-red-600 font-medium"
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
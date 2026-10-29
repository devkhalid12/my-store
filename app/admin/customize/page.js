"use client";

import { useState, useEffect } from "react";

export default function CustomizeStorePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const [settings, setSettings] = useState({
    storeName: "",
    announcementText: "",
    heroTitle: "",
    heroSubtitle: "",
  });

  // Load current settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMessage("✅ Settings saved successfully!");
        setTimeout(() => setSavedMessage(""), 3000);
      } else {
        alert("Failed to save settings");
      }
    } catch (err) {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading theme settings...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Store Customization</h2>
        <p className="text-sm text-gray-500">
          Customize your storefront branding, announcements, and hero banner.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
        {savedMessage && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-200 font-medium">
            {savedMessage}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Store Name
          </label>
          <input
            type="text"
            name="storeName"
            value={settings.storeName}
            onChange={handleChange}
            placeholder="e.g. KHALID FASHION"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Announcement Bar Text
          </label>
          <input
            type="text"
            name="announcementText"
            value={settings.announcementText}
            onChange={handleChange}
            placeholder="e.g. 🔥 Flash Sale: 20% off with code FLASH20"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Hero Headline
          </label>
          <input
            type="text"
            name="heroTitle"
            value={settings.heroTitle}
            onChange={handleChange}
            placeholder="e.g. Elevate Your Everyday Style"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Hero Subtitle
          </label>
          <textarea
            rows="2"
            name="heroSubtitle"
            value={settings.heroSubtitle}
            onChange={handleChange}
            placeholder="e.g. Premium clothing crafted with sustainably sourced fabrics."
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-black outline-none"
          ></textarea>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition disabled:bg-gray-400"
          >
            {saving ? "Saving Changes..." : "Save Customization"}
          </button>
        </div>
      </form>
    </div>
  );
}
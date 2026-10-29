"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Section {
  id: string;
  type: string;
  name: string;
  isEnabled: boolean;
  settings: Record<string, any>;
}

export default function StoreCustomizerPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/customizer");
        const data = await res.json();
        if (data.success && data.sections) {
          setSections(data.sections);
        }
      } catch (err) {
        console.error("Failed to load sections", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Reordering helpers (Move Up / Down)
  const moveSection = (index: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setSections(reordered);
  };

  // Toggle Visibility (👁️)
  const toggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  // Update Settings of a specific section
  const handleSettingChange = (id: string, key: string, value: any) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            settings: { ...s.settings, [key]: value },
          };
        }
        return s;
      })
    );
  };

  // Publish to Database
  const handlePublish = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/customizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to publish changes");
      }
    } catch (err) {
      alert("Error publishing changes");
    } finally {
      setSaving(false);
    }
  };

  const activeSection = sections.find((s) => s.id === activeEditingId);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visual Theme & Section Customizer</h2>
          <p className="text-sm text-gray-500">
            Customize layout, reorder sections, and edit content without touching code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              ✅ Published live!
            </span>
          )}
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ↗ View Live Store
          </Link>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-5 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition disabled:bg-gray-400 cursor-pointer"
          >
            {saving ? "Publishing..." : "Publish Changes"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500">Loading customizer...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sections List (Shopify Style Sidebar) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                Homepage Sections ({sections.length})
              </h3>
              <span className="text-[11px] text-gray-400">Reorder with ⬆️ ⬇️</span>
            </div>

            <div className="space-y-2.5">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                    activeEditingId === section.id
                      ? "border-black bg-gray-50 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  } ${!section.isEnabled ? "opacity-50" : ""}`}
                >
                  <div
                    onClick={() => setActiveEditingId(section.id)}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-gray-900 block">{section.name}</span>
                    <span className="text-[11px] text-indigo-600 font-medium uppercase">
                      {section.type}
                    </span>
                  </div>

                  {/* Actions: Reorder & Visibility */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(idx, "UP")}
                      disabled={idx === 0}
                      className="p-1.5 hover:bg-gray-100 rounded text-xs disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => moveSection(idx, "DOWN")}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 hover:bg-gray-100 rounded text-xs disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={() => toggleVisibility(section.id)}
                      className="p-1.5 hover:bg-gray-100 rounded text-xs cursor-pointer ml-1"
                      title={section.isEnabled ? "Hide Section" : "Show Section"}
                    >
                      {section.isEnabled ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Section Settings Editor */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            {!activeSection ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <span className="text-4xl block">🎨</span>
                <p className="font-semibold text-gray-700">Select a section on the left to edit</p>
                <p className="text-xs text-gray-400">
                  Click on any section to customize its headlines, descriptions, and buttons.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      Edit: {activeSection.name}
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">ID: {activeSection.id}</span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      activeSection.isEnabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {activeSection.isEnabled ? "Visible on Store" : "Hidden"}
                  </span>
                </div>

                {/* Dynamic Inputs based on Section Type */}
                <div className="space-y-4">
                  {/* Announcement Bar Settings */}
                  {activeSection.type === "announcement" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Announcement Message
                      </label>
                      <input
                        type="text"
                        value={activeSection.settings.text || ""}
                        onChange={(e) =>
                          handleSettingChange(activeSection.id, "text", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
                      />
                    </div>
                  )}

                  {/* Hero Banner Settings */}
                  {activeSection.type === "hero" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Headline
                        </label>
                        <input
                          type="text"
                          value={activeSection.settings.title || ""}
                          onChange={(e) =>
                            handleSettingChange(activeSection.id, "title", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Subtitle
                        </label>
                        <textarea
                          rows={2}
                          value={activeSection.settings.subtitle || ""}
                          onChange={(e) =>
                            handleSettingChange(activeSection.id, "subtitle", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={activeSection.settings.ctaText || ""}
                          onChange={(e) =>
                            handleSettingChange(activeSection.id, "ctaText", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
                        />
                      </div>
                    </>
                  )}

                  {/* Promotional Banner Settings */}
                  {activeSection.type === "promo_banner" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Promo Heading
                        </label>
                        <input
                          type="text"
                          value={activeSection.settings.heading || ""}
                          onChange={(e) =>
                            handleSettingChange(activeSection.id, "heading", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Promo Description
                        </label>
                        <input
                          type="text"
                          value={activeSection.settings.description || ""}
                          onChange={(e) =>
                            handleSettingChange(activeSection.id, "description", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Promotional Coupon Code
                        </label>
                        <input
                          type="text"
                          value={activeSection.settings.couponCode || ""}
                          onChange={(e) =>
                            handleSettingChange(activeSection.id, "couponCode", e.target.value.toUpperCase())
                          }
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white font-bold"
                        />
                      </div>
                    </>
                  )}

                  {/* Newsletter Settings */}
                  {activeSection.type === "newsletter" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Newsletter Title
                        </label>
                        <input
                          type="text"
                          value={activeSection.settings.title || ""}
                          onChange={(e) =>
                            handleSettingChange(activeSection.id, "title", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Newsletter Subtitle
                        </label>
                        <input
                          type="text"
                          value={activeSection.settings.subtitle || ""}
                          onChange={(e) =>
                            handleSettingChange(activeSection.id, "subtitle", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
                        />
                      </div>
                    </>
                  )}

                  {/* Featured Products Grid Settings */}
                  {activeSection.type === "featured_products" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Catalog Section Heading
                      </label>
                      <input
                        type="text"
                        value={activeSection.settings.title || ""}
                        onChange={(e) =>
                          handleSettingChange(activeSection.id, "title", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
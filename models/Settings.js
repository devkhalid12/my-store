import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: "MYSTORE",
    },
    announcementText: {
      type: String,
      default: "🚀 Free shipping on all orders over $50!",
    },
    heroTitle: {
      type: String,
      default: "Discover Our Latest Collection",
    },
    heroSubtitle: {
      type: String,
      default: "High quality essentials designed for your everyday lifestyle.",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
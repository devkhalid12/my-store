import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

// Minimal inline schema to avoid module alias issues in standalone script
const VariantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  title: { type: String, required: true },
  priceInCents: { type: Number, required: true },
  compareAtPriceInCents: { type: Number },
  stock: { type: Number, required: true, default: 0 },
  options: { type: Map, of: String, default: {} },
  barcode: String,
  weightInGrams: Number,
});

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: [String],
    images: [String],
    variants: [VariantSchema],
    status: { type: String, default: "ACTIVE" },
    isDigital: { type: Boolean, default: false },
    seo: { metaTitle: String, metaDescription: String },
  },
  { timestamps: true }
);

const SeedProduct = mongoose.models.Product || mongoose.model("Product", ProductSchema);

const sampleProducts = [
  {
    title: "Classic Heavyweight Cotton Tee",
    slug: "classic-heavyweight-cotton-tee",
    description: "Crafted from 100% premium combed organic cotton. Features a relaxed tailored fit, durable ribbed collar, and pre-shrunk fabric designed for long-lasting comfort.",
    category: "Apparel",
    tags: ["clothing", "t-shirt", "organic", "cotton"],
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      {
        sku: "TEE-BLK-S",
        title: "Black / Small",
        priceInCents: 2800, // $28.00
        compareAtPriceInCents: 3500, // $35.00
        stock: 25,
        options: { Color: "Black", Size: "S" },
      },
      {
        sku: "TEE-BLK-M",
        title: "Black / Medium",
        priceInCents: 2800,
        compareAtPriceInCents: 3500,
        stock: 40,
        options: { Color: "Black", Size: "M" },
      },
      {
        sku: "TEE-BLK-L",
        title: "Black / Large",
        priceInCents: 2800,
        compareAtPriceInCents: 3500,
        stock: 15,
        options: { Color: "Black", Size: "L" },
      },
      {
        sku: "TEE-WHT-M",
        title: "White / Medium",
        priceInCents: 2800,
        compareAtPriceInCents: 3500,
        stock: 30,
        options: { Color: "White", Size: "M" },
      },
    ],
    status: "ACTIVE",
    isDigital: false,
    seo: {
      metaTitle: "Classic Heavyweight Cotton Tee | Premium Organic Apparel",
      metaDescription: "100% organic cotton everyday t-shirt with a relaxed tailored fit.",
    },
  },
  {
    title: "Minimalist Everyday Commuter Backpack",
    slug: "minimalist-everyday-commuter-backpack",
    description: "Weather-resistant 900D recycled polyester exterior with a dedicated padded 16-inch laptop compartment, hidden security pocket, and ergonomic shoulder straps.",
    category: "Accessories",
    tags: ["bags", "backpack", "travel", "commuter"],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      {
        sku: "BPK-OBS-BLK",
        title: "Obsidian Black",
        priceInCents: 8500, // $85.00
        compareAtPriceInCents: 11000, // $110.00
        stock: 20,
        options: { Color: "Black" },
      },
      {
        sku: "BPK-NVY-BLU",
        title: "Navy Blue",
        priceInCents: 8500,
        compareAtPriceInCents: 11000,
        stock: 12,
        options: { Color: "Navy" },
      },
    ],
    status: "ACTIVE",
    isDigital: false,
    seo: {
      metaTitle: "Minimalist Commuter Backpack | Water Resistant",
      metaDescription: "Durable commuter backpack with dedicated 16-inch laptop protection.",
    },
  },
  {
    title: "Wireless Active Noise-Cancelling Headphones",
    slug: "wireless-anc-headphones",
    description: "Equipped with custom 40mm dynamic drivers, hybrid active noise cancellation, 45-hour battery life, and ultra-plush memory foam earcups.",
    category: "Electronics",
    tags: ["audio", "headphones", "wireless", "bluetooth"],
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      {
        sku: "HP-MATTE-BLK",
        title: "Matte Black",
        priceInCents: 14900, // $149.00
        compareAtPriceInCents: 18900, // $189.00
        stock: 18,
        options: { Color: "Matte Black" },
      },
      {
        sku: "HP-SILVER",
        title: "Arctic Silver",
        priceInCents: 14900,
        compareAtPriceInCents: 18900,
        stock: 8,
        options: { Color: "Silver" },
      },
    ],
    status: "ACTIVE",
    isDigital: false,
    seo: {
      metaTitle: "Wireless ANC Headphones | Studio Grade Sound",
      metaDescription: "45-hour battery life and studio-grade noise-cancelling headphones.",
    },
  },
];

async function seed() {
  console.log("🌱 Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI as string);
  console.log("Connected successfully!");

  // Clean existing demo products to prevent duplicate slug errors
  console.log("🧹 Clearing old demo products...");
  await SeedProduct.deleteMany({
    slug: { $in: sampleProducts.map((p) => p.slug) },
  });

  console.log("📦 Inserting multi-variant product catalog...");
  await SeedProduct.insertMany(sampleProducts);

  console.log("✅ Database seeded successfully with 3 multi-variant products!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
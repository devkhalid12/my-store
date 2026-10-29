import mongoose, { Schema, Document, Model } from "mongoose";
import { IProduct, IProductVariant } from "@/types/commerce";

export interface IProductDocument extends Omit<IProduct, "_id">, Document {}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      default: "Default Title",
    },
    priceInCents: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    compareAtPriceInCents: {
      type: Number,
      min: [0, "Compare at price cannot be negative"],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    options: {
      type: Map,
      of: String,
      default: {},
    },
    barcode: { type: String, trim: true },
    weightInGrams: { type: Number, min: 0 },
  },
  { _id: true }
);

const ProductSchema = new Schema<IProductDocument>(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    category: {
      type: String,
      required: true,
      default: "General",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    variants: {
      type: [ProductVariantSchema],
      required: true,
      validate: [
        (v: IProductVariant[]) => v && v.length > 0,
        "A product must have at least one variant",
      ],
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast search queries
ProductSchema.index({ title: "text", description: "text", tags: "text" });

const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
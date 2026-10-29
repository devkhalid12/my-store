import mongoose, { Schema, Document, Model } from "mongoose";
import { IOrder, IOrderItem } from "@/types/commerce";

export interface IOrderDocument extends Omit<IOrder, "_id">, Document {}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    variantId: { type: String },
    title: { type: String, required: true },
    variantTitle: { type: String },
    sku: { type: String },
    priceInCents: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true, index: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(v: IOrderItem[]) => v && v.length > 0, "Order must contain at least one item"],
    },
    subtotalInCents: { type: Number, required: true, min: 0 },
    shippingInCents: { type: Number, required: true, default: 0, min: 0 },
    taxInCents: { type: Number, required: true, default: 0, min: 0 },
    discountInCents: { type: Number, required: true, default: 0, min: 0 },
    totalInCents: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
      default: "PENDING",
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ["UNFULFILLED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "UNFULFILLED",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "STRIPE", "SSLCOMMERZ", "BANK_TRANSFER"],
      default: "COD",
    },
    trackingNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDiscount extends Document {
  code: string; // e.g. "WELCOME10"
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number; // e.g., 10 (for 10%) or 1500 (for $15.00 off in cents)
  minSpendInCents?: number;
  isActive: boolean;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema = new Schema<IDiscount>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["PERCENTAGE", "FIXED_AMOUNT"],
      required: true,
      default: "PERCENTAGE",
    },
    value: {
      type: Number,
      required: true,
      min: [1, "Discount value must be at least 1"],
    },
    minSpendInCents: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Discount: Model<IDiscount> =
  mongoose.models.Discount || mongoose.model<IDiscount>("Discount", DiscountSchema);

export default Discount;
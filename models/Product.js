import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a product title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    price: {
      type: Number,
      required: [true, "Please provide a product price"],
      min: 0,
    },
    category: {
      type: String,
      default: "General",
    },
    imageUrl: {
      type: String,
      default: "https://placehold.co/400x400?text=No+Image",
    },
    stock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt dates
  }
);

// If the model is already compiled, use it; otherwise, compile it
export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
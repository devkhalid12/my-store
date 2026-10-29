import { z } from "zod";

// 1. Variant Validation Schema
export const ProductVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required").trim(),
  title: z.string().min(1, "Variant title is required (e.g. 'Default' or 'Black / XL')"),
  priceInCents: z
    .number()
    .int("Price must be an integer representing minor units (cents)")
    .nonnegative("Price cannot be negative"),
  compareAtPriceInCents: z
    .number()
    .int()
    .nonnegative()
    .optional(),
  stock: z
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative")
    .default(0),
  options: z.record(z.string(), z.string()).default({}),
  barcode: z.string().optional(),
  weightInGrams: z.number().nonnegative().optional(),
});

// 2. Main Product Validation Schema
export const ProductSchema = z.object({
  title: z.string().min(2, "Product title must be at least 2 characters").trim(),
  slug: z.string().min(2).trim().toLowerCase().optional(),
  description: z.string().min(5, "Description must be at least 5 characters"),
  category: z.string().min(1, "Category is required").default("General"),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url("Each image must be a valid URL")).default([]),
  variants: z
    .array(ProductVariantSchema)
    .min(1, "Each product must have at least one variant (e.g., Default Title)"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  isDigital: z.boolean().default(false),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
});

// 3. Customer Delivery Info Schema
export const CustomerAddressSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters").trim(),
  email: z.string().email("Please provide a valid email address").trim().toLowerCase(),
  phone: z.string().min(6, "Phone number must be at least 6 characters").trim(),
  address: z.string().min(5, "Delivery address must be at least 5 characters").trim(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

// 4. Client Checkout Request Schema (Prices are NEVER trusted from browser!)
export const CheckoutRequestSchema = z.object({
  customer: CustomerAddressSchema,
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        variantId: z.string().optional(),
        quantity: z.number().int().positive("Quantity must be at least 1"),
      })
    )
    .min(1, "Shopping cart cannot be empty"),
  paymentMethod: z.enum(["COD", "STRIPE", "SSLCOMMERZ", "BANK_TRANSFER"]).default("COD"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

// Export inferred TypeScript types
export type ProductInput = z.infer<typeof ProductSchema>;
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;
export type CheckoutRequestInput = z.infer<typeof CheckoutRequestSchema>;
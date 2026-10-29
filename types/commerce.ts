// Administrative Roles (RBAC)
export type StaffRole =
  | "OWNER"
  | "ADMINISTRATOR"
  | "STORE_MANAGER"
  | "ORDER_MANAGER"
  | "PRODUCT_MANAGER";

// Product Variant (Size, Color, SKU, Stock)
export interface IProductVariant {
  _id?: string;
  sku: string;
  title: string; // e.g. "White / Large"
  priceInCents: number;
  compareAtPriceInCents?: number;
  stock: number;
  options: Record<string, string>; // e.g. { Color: "White", Size: "L" }
  barcode?: string;
  weightInGrams?: number;
}

// Complete Product Definition
export interface IProduct {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  images: string[];
  variants: IProductVariant[];
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isDigital: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Order Line Item (Snapshot in time)
export interface IOrderItem {
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  sku?: string;
  priceInCents: number;
  quantity: number;
  imageUrl?: string;
}

// Order Status Types
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type FulfillmentStatus = "UNFULFILLED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

// Order Interface
export interface IOrder {
  _id?: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    postalCode?: string;
  };
  items: IOrderItem[];
  subtotalInCents: number;
  shippingInCents: number;
  taxInCents: number;
  discountInCents: number;
  totalInCents: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentMethod: "COD" | "STRIPE" | "SSLCOMMERZ" | "BANK_TRANSFER";
  trackingNumber?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
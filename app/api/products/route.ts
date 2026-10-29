import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { ProductSchema } from "@/lib/validations/commerce";

// Helper to generate a clean URL slug from title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 1. GET: Fetch products with search, category filter, and status
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "ACTIVE";

    // Build dynamic MongoDB query filter
    const query: Record<string, any> = {};

    if (status !== "ALL") {
      query.status = status;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// 2. POST: Create a new multi-variant product with strict Zod validation
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Auto-generate slug if not provided
    if (!body.slug && body.title) {
      body.slug = slugify(body.title);
    }

    // Validate payload against Zod schema
    const validatedData = ProductSchema.parse(body);

    // Check slug uniqueness
    const existing = await Product.findOne({ slug: validatedData.slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A product with this slug or title already exists" },
        { status: 409 }
      );
    }

    const product = await Product.create(validatedData);

    return NextResponse.json(
      { success: true, product },
      { status: 201 }
    );
  } catch (error: any) {
    // Return readable validation errors from Zod
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 400 }
    );
  }
}
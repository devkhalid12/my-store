import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Discount from "@/models/Discount";

// 1. GET: Fetch all discount codes
export async function GET() {
  try {
    await connectDB();
    const discounts = await Discount.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, discounts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch discounts" },
      { status: 500 }
    );
  }
}

// 2. POST: Create a new discount code
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const code = body.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { success: false, error: "Discount code is required" },
        { status: 400 }
      );
    }

    const existing = await Discount.findOne({ code });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Discount code "${code}" already exists` },
        { status: 409 }
      );
    }

    const discount = await Discount.create({
      code,
      type: body.type || "PERCENTAGE",
      value: Number(body.value),
      minSpendInCents: Math.round(Number(body.minSpend || 0) * 100),
      isActive: true,
    });

    return NextResponse.json({ success: true, discount }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create discount" },
      { status: 400 }
    );
  }
}

// 3. DELETE: Remove a discount code
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { id } = await req.json();
    await Discount.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Discount deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete discount" },
      { status: 500 }
    );
  }
}
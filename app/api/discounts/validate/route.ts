import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Discount from "@/models/Discount";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { code, subtotalInCents } = await req.json();

    if (!code || typeof subtotalInCents !== "number") {
      return NextResponse.json(
        { success: false, error: "Coupon code and subtotal are required" },
        { status: 400 }
      );
    }

    const discount = await Discount.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!discount) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired coupon code" },
        { status: 404 }
      );
    }

    // Check minimum spend requirement
    if (discount.minSpendInCents && subtotalInCents < discount.minSpendInCents) {
      const minDollar = (discount.minSpendInCents / 100).toFixed(2);
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order spend of $${minDollar} required for this coupon.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minSpendInCents: discount.minSpendInCents || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
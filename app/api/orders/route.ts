import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { CheckoutRequestSchema } from "@/lib/validations/commerce";
import Discount from "@/models/Discount";

function generateOrderNumber(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${random}`;
}

// 1. GET: Fetch all orders
export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// 2. POST: Create order and reserve stock
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const validatedData = CheckoutRequestSchema.parse(body);

    const verifiedItems = [];
    let calculatedSubtotalInCents = 0;

    for (const item of validatedData.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product in cart not found." },
          { status: 400 }
        );
      }

      let variant = null;
      if (product.variants && product.variants.length > 0) {
        if (item.variantId && mongoose.Types.ObjectId.isValid(item.variantId)) {
          variant = product.variants.find(
            (v: any) => v._id?.toString() === item.variantId
          );
        }
        if (!variant) {
          variant = product.variants[0];
        }
      }

      const priceInCents = variant
        ? variant.priceInCents
        : Math.round((product.price || 0) * 100);

      const stock = variant ? variant.stock : product.stock || 0;

      if (stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${stock} units available for "${product.title}".`,
          },
          { status: 400 }
        );
      }

      calculatedSubtotalInCents += priceInCents * item.quantity;

      verifiedItems.push({
        productId: product._id.toString(),
        variantId: variant?._id?.toString() || undefined,
        title: product.title,
        variantTitle: variant?.title || "Default",
        sku: variant?.sku || "N/A",
        priceInCents,
        price: priceInCents / 100,
        quantity: item.quantity,
        imageUrl: product.images?.[0] || product.imageUrl || "",
      });
    }

    const shippingInCents = calculatedSubtotalInCents >= 5000 ? 0 : 500;
    let discountInCents = 0;

    // Verify discount on the server
    if (body.discountCode) {
      const discount = await Discount.findOne({
        code: body.discountCode.toUpperCase(),
        isActive: true,
      });

      if (discount) {
        if (!discount.minSpendInCents || calculatedSubtotalInCents >= discount.minSpendInCents) {
          if (discount.type === "PERCENTAGE") {
            discountInCents = Math.round((calculatedSubtotalInCents * discount.value) / 100);
          } else {
            discountInCents = Math.min(discount.value, calculatedSubtotalInCents);
          }
          // Increment usage count
          await Discount.findByIdAndUpdate(discount._id, { $inc: { usedCount: 1 } });
        }
      }
    }

    const finalTotalInCents = Math.max(0, calculatedSubtotalInCents + shippingInCents - discountInCents);

    for (const item of verifiedItems) {
      if (item.variantId && mongoose.Types.ObjectId.isValid(item.variantId)) {
        await Product.updateOne(
          {
            _id: item.productId,
            "variants._id": item.variantId,
            "variants.stock": { $gte: item.quantity },
          },
          {
            $inc: { "variants.$.stock": -item.quantity },
          }
        );
      }
    }

    const newOrder = await Order.create({
      orderNumber: generateOrderNumber(),
      customer: validatedData.customer,
      items: verifiedItems,
      subtotalInCents: calculatedSubtotalInCents,
      shippingInCents,
      discountInCents,
      totalInCents: finalTotalInCents,
      totalAmount: finalTotalInCents / 100,
      paymentStatus: "PENDING",
      fulfillmentStatus: "UNFULFILLED",
      status: "UNFULFILLED",
      paymentMethod: validatedData.paymentMethod || "COD",
    });

    return NextResponse.json(
      {
        success: true,
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process checkout" },
      { status: 400 }
    );
  }
}

// 3. PUT: Update fulfillment status, payment status, or tracking number
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { orderId, fulfillmentStatus, status, paymentStatus, trackingNumber } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const updateFields: Record<string, any> = {};
    if (fulfillmentStatus) updateFields.fulfillmentStatus = fulfillmentStatus;
    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) updateFields.trackingNumber = trackingNumber;

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateFields, {
      new: true,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("PUT order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}
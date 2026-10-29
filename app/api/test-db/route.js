import connectDB from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: "Success", message: "Database connected successfully!" });
  } catch (error) {
    return NextResponse.json({ status: "Error", message: error.message }, { status: 500 });
  }
}
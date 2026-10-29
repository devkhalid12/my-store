import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { NextResponse } from "next/server";

// 1. GET: Fetch existing store settings (or create default)
export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. POST: Update store settings
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create(body);
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, body, { new: true });
    }
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
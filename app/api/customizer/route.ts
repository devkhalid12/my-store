import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PageConfig from "@/models/PageSection";

// Default standard Shopify-style sections
const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    id: "announcement_1",
    type: "announcement",
    name: "Announcement Bar",
    isEnabled: true,
    settings: {
      text: "🚀 Free worldwide shipping on orders over $50! Use code WELCOME10 for 10% off.",
      bgColor: "#000000",
      textColor: "#ffffff",
    },
  },
  {
    id: "hero_1",
    type: "hero",
    name: "Hero Banner",
    isEnabled: true,
    settings: {
      title: "Discover Our Latest Collection",
      subtitle: "High quality essentials designed for your everyday lifestyle.",
      ctaText: "Shop Collection",
      ctaLink: "#catalog",
      bgGradient: "from-gray-900 to-gray-800",
    },
  },
  {
    id: "featured_products_1",
    type: "featured_products",
    name: "Featured Products Grid",
    isEnabled: true,
    settings: {
      title: "Featured Essentials",
      subtitle: "Our highest rated organic and lifestyle products.",
    },
  },
  {
    id: "promo_banner_1",
    type: "promo_banner",
    name: "Promotional Banner",
    isEnabled: true,
    settings: {
      heading: "Limited Time Flash Sale",
      description: "Get 10% off any order today with our exclusive promo code.",
      badge: "SAVE MORE",
      couponCode: "WELCOME10",
      bgGradient: "from-indigo-900 to-black",
    },
  },
  {
    id: "newsletter_1",
    type: "newsletter",
    name: "Newsletter Subscription",
    isEnabled: true,
    settings: {
      title: "Join the Club & Get 15% Off",
      subtitle: "Be the first to hear about seasonal sales, new drops, and events.",
    },
  },
];

// 1. GET: Fetch current homepage section configuration
export async function GET() {
  try {
    await connectDB();
    let config = await PageConfig.findOne({ page: "home" });

    // Seed defaults if empty
    if (!config || !config.sections || config.sections.length === 0) {
      config = await PageConfig.create({
        page: "home",
        sections: DEFAULT_HOMEPAGE_SECTIONS,
      });
    }

    return NextResponse.json({ success: true, sections: config.sections });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch page config" },
      { status: 500 }
    );
  }
}

// 2. POST: Save and publish updated sections order & settings
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { sections } = await req.json();

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { success: false, error: "Sections must be an array" },
        { status: 400 }
      );
    }

    const updatedConfig = await PageConfig.findOneAndUpdate(
      { page: "home" },
      { sections },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Theme sections published successfully!",
      sections: updatedConfig.sections,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save theme" },
      { status: 500 }
    );
  }
}
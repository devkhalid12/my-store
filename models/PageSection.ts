import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISection {
  id: string;
  type: "announcement" | "hero" | "featured_products" | "promo_banner" | "newsletter" | "faq";
  name: string;
  isEnabled: boolean;
  settings: Record<string, any>;
}

export interface IPageConfig extends Document {
  page: string; // e.g. "home"
  sections: ISection[];
}

const SectionSchema = new Schema<ISection>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    isEnabled: { type: Boolean, default: true },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const PageConfigSchema = new Schema<IPageConfig>(
  {
    page: { type: String, required: true, unique: true, default: "home" },
    sections: { type: [SectionSchema], default: [] },
  },
  { timestamps: true }
);

const PageConfig: Model<IPageConfig> =
  mongoose.models.PageConfig || mongoose.model<IPageConfig>("PageConfig", PageConfigSchema);

export default PageConfig;
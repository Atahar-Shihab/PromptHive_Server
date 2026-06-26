import { Schema, model } from "mongoose";

const promptSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: "text" },
    description: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true },
    aiTool: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Pro"],
      default: "Beginner",
      index: true
    },
    thumbnailUrl: { type: String, default: "" },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true
    },
    copyCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    featured: { type: Boolean, default: false, index: true },
    rejectionFeedback: { type: String, default: "" },
    forkedFrom: { type: Schema.Types.ObjectId, ref: "Prompt" },
    creator: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      image: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

promptSchema.index({ title: "text", description: "text", tags: "text", aiTool: "text" });

export const Prompt = model("Prompt", promptSchema);

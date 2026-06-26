import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    promptId: { type: Schema.Types.ObjectId, ref: "Prompt", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    user: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      image: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

reviewSchema.index({ promptId: 1, "user.id": 1 }, { unique: true });

export const Review = model("Review", reviewSchema);

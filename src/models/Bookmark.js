import { Schema, model } from "mongoose";

const bookmarkSchema = new Schema(
  {
    promptId: { type: Schema.Types.ObjectId, ref: "Prompt", required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true }
  },
  { timestamps: true }
);

bookmarkSchema.index({ promptId: 1, userId: 1 }, { unique: true });

export const Bookmark = model("Bookmark", bookmarkSchema);

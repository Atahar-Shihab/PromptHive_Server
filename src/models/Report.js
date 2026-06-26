import { Schema, model } from "mongoose";

const reportSchema = new Schema(
  {
    promptId: { type: Schema.Types.ObjectId, ref: "Prompt", required: true, index: true },
    reason: {
      type: String,
      enum: ["Inappropriate Content", "Spam", "Copyright Violation", "Unsafe Advice", "Other"],
      required: true
    },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "removed", "warned", "dismissed"],
      default: "pending",
      index: true
    },
    reporter: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true }
    }
  },
  { timestamps: true }
);

export const Report = model("Report", reportSchema);

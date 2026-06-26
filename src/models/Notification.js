import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["prompt", "payment", "report", "system"],
      default: "system"
    },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = model("Notification", notificationSchema);

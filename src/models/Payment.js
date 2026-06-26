import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    email: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: { type: String, default: "succeeded" },
    provider: { type: String, default: "stripe" }
  },
  { timestamps: true }
);

export const Payment = model("Payment", paymentSchema);

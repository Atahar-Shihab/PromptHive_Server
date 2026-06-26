import { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { env } from "../env.js";
import { Payment } from "../models/Payment.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/http.js";
import { markPremium } from "../services/user.service.js";
import { notifyUser } from "../services/notification.service.js";

const router = Router();
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

router.post(
  "/create-intent",
  requireAuth,
  asyncHandler(async (_req, res) => {
    if (!stripe) throw new HttpError(503, "Stripe is not configured on this server.");
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(env.PREMIUM_PRICE_USD * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true }
    });
    res.json({ clientSecret: intent.client_secret, amount: env.PREMIUM_PRICE_USD });
  })
);

router.post(
  "/confirm",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ paymentIntentId: z.string().min(4) }).parse(req.body);
    if (!stripe) throw new HttpError(503, "Stripe is not configured on this server.");
    const intent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
    if (intent.status !== "succeeded") throw new HttpError(400, "Payment is not completed yet.");
    const payment = await Payment.findOneAndUpdate(
      { transactionId: intent.id },
      {
        transactionId: intent.id,
        email: req.authUser.email,
        userId: req.authUser.id,
        amount: intent.amount_received / 100,
        currency: intent.currency,
        status: intent.status,
        provider: "stripe"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const user = await markPremium(req.authUser.id);
    await notifyUser(req.authUser.id, "Premium unlocked", "You now have access to all private prompts.", "payment");
    res.json({ payment, user });
  })
);

router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 40);
    const [data, total] = await Promise.all([
      Payment.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payment.countDocuments()
    ]);
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
  })
);

export default router;

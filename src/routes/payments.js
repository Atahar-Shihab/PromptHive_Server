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
  asyncHandler(async (req, res) => {
    if (!stripe) throw new HttpError(503, "Stripe is not configured on this server.");
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(env.PREMIUM_PRICE_USD * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: req.authUser.id,
        userEmail: req.authUser.email
      }
    });
    res.json({ clientSecret: intent.client_secret, amount: env.PREMIUM_PRICE_USD });
  })
);

router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    if (!stripe) return res.status(503).json({ message: "Stripe is not configured." });
    const sig = req.headers["stripe-signature"];
    let event;

    if (env.STRIPE_WEBHOOK_SECRET && sig) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error("Stripe Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      try {
        event = typeof req.body === "string" || Buffer.isBuffer(req.body)
          ? JSON.parse(req.body.toString())
          : req.body;
      } catch {
        return res.status(400).send("Invalid webhook payload");
      }
    }

    if (event.type === "payment_intent.succeeded" || event.type === "checkout.session.completed") {
      const intent = event.data.object;
      const userId = intent.metadata?.userId;
      const userEmail = intent.metadata?.userEmail || intent.receipt_email || intent.customer_details?.email || "";

      if (userId) {
        await Payment.findOneAndUpdate(
          { transactionId: intent.id },
          {
            transactionId: intent.id,
            email: userEmail,
            userId,
            amount: (intent.amount_received || intent.amount_total || 0) / 100,
            currency: intent.currency || "usd",
            status: "succeeded",
            provider: "stripe"
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        await markPremium(userId);
        await notifyUser(userId, "Premium unlocked", "Your payment was processed. You now have access to all private prompts.", "payment");
      }
    }

    res.json({ received: true });
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

import { Router } from "express";
import { Notification } from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { attachNotificationStream } from "../services/notification.service.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await Notification.find({ userId: req.authUser.id }).sort({ createdAt: -1 }).limit(20).lean();
    res.json(data);
  })
);

router.patch(
  "/read-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ userId: req.authUser.id, read: false }, { $set: { read: true } });
    res.json({ ok: true });
  })
);

router.get("/stream", requireAuth, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": req.headers.origin ?? "*",
    "Access-Control-Allow-Credentials": "true"
  });
  attachNotificationStream(req.authUser.id, res);
});

export default router;

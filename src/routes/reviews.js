import { Router } from "express";
import { Review } from "../models/Review.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const data = await Review.find({ rating: { $gte: 4 } })
      .populate("promptId", "title category aiTool")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    res.json(data);
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await Review.find({ "user.id": req.authUser.id })
      .populate("promptId", "title category aiTool")
      .sort({ createdAt: -1 })
      .lean();
    res.json(data);
  })
);

export default router;

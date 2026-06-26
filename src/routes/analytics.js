import { Router } from "express";
import { Prompt } from "../models/Prompt.js";
import { Bookmark } from "../models/Bookmark.js";
import { Review } from "../models/Review.js";
import { Payment } from "../models/Payment.js";
import { Report } from "../models/Report.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { appDb } from "../config/mongo.js";

const router = Router();

router.get(
  "/creator",
  requireAuth,
  asyncHandler(async (req, res) => {
    const creatorId = req.authUser.id;
    const [totals, growth] = await Promise.all([
      Prompt.aggregate([
        { $match: { "creator.id": creatorId } },
        {
          $group: {
            _id: null,
            totalPrompts: { $sum: 1 },
            totalCopies: { $sum: "$copyCount" }
          }
        }
      ]),
      Prompt.aggregate([
        { $match: { "creator.id": creatorId } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            prompts: { $sum: 1 },
            copies: { $sum: "$copyCount" }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);
    const totalBookmarks = await Bookmark.countDocuments({
      promptId: { $in: await Prompt.find({ "creator.id": creatorId }).distinct("_id") }
    });
    res.json({
      summary: {
        totalPrompts: totals[0]?.totalPrompts ?? 0,
        totalCopies: totals[0]?.totalCopies ?? 0,
        totalBookmarks
      },
      growth: growth.map((item) => ({ date: item._id, prompts: item.prompts, copies: item.copies }))
    });
  })
);

router.get(
  "/admin",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const [totalUsers, totalPrompts, totalReviews, copyAgg, totalPayments, totalReports] = await Promise.all([
      appDb().collection("user").countDocuments(),
      Prompt.countDocuments(),
      Review.countDocuments(),
      Prompt.aggregate([{ $group: { _id: null, copies: { $sum: "$copyCount" } } }]),
      Payment.countDocuments(),
      Report.countDocuments()
    ]);
    res.json({
      totalUsers,
      totalPrompts,
      totalReviews,
      totalCopies: copyAgg[0]?.copies ?? 0,
      totalPayments,
      totalReports
    });
  })
);

export default router;

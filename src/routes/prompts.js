import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Prompt } from "../models/Prompt.js";
import { Bookmark } from "../models/Bookmark.js";
import { Review } from "../models/Review.js";
import { Report } from "../models/Report.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError, requireFound } from "../utils/http.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { notifyUser } from "../services/notification.service.js";
import { listUsersByRole } from "../services/user.service.js";
import { env } from "../env.js";

const router = Router();

const promptSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  content: z.string().min(10),
  category: z.string().min(2),
  aiTool: z.string().min(2),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(["Beginner", "Intermediate", "Pro"]).default("Beginner"),
  thumbnailUrl: z.string().optional().default(""),
  visibility: z.enum(["public", "private"]).default("public")
});

function objectId(id) {
  if (!Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid prompt id");
  return new Types.ObjectId(id);
}

function premiumLockedContent(prompt) {
  return [
    "Premium prompt locked.",
    "",
    `This ${prompt.aiTool} workflow is private and available after upgrading to PromptHive Premium.`,
    "",
    "Visible preview:",
    prompt.description,
    "",
    "Unlock to view the full prompt, copy it, review it, test it, and download it as PDF."
  ].join("\n");
}

async function notifyAdminsForReview(prompt) {
  const admins = await listUsersByRole("admin");
  await Promise.all(
    admins.map((admin) =>
      notifyUser(
        admin.id,
        "Prompt waiting for review",
        `${prompt.creator.name} submitted "${prompt.title}" for moderation.`,
        "prompt"
      )
    )
  );
}

async function notifyAdminsForReport(prompt, report) {
  const admins = await listUsersByRole("admin");
  await Promise.all(
    admins.map((admin) =>
      notifyUser(
        admin.id,
        "Prompt report submitted",
        `${report.reporter.name} reported "${prompt.title}" for ${report.reason}.`,
        "report"
      )
    )
  );
}

function promptMatch(query, admin = false) {
  const match = {};
  if (!admin) {
    match.status = "approved";
    const includePremiumCards = query.includePrivate === "true";
    if (includePremiumCards && ["public", "private"].includes(query.visibility)) {
      match.visibility = query.visibility;
    } else if (!includePremiumCards) {
      match.visibility = "public";
    }
  }
  if (query.featured === "true") match.featured = true;
  if (query.status && admin) match.status = query.status;
  if (query.visibility && admin) match.visibility = query.visibility;
  if (query.creatorId) match["creator.id"] = query.creatorId;
  if (query.category) match.category = query.category;
  if (query.aiTool) match.aiTool = query.aiTool;
  if (query.difficulty) match.difficulty = query.difficulty;
  if (query.search) {
    const regex = new RegExp(String(query.search), "i");
    match.$or = [{ title: regex }, { tags: regex }, { aiTool: regex }, { description: regex }];
  }
  return match;
}

const sortMap = {
  popular: { avgRating: -1, reviewCount: -1, copyCount: -1 },
  copied: { copyCount: -1 },
  latest: { createdAt: -1 },
  trending: { trendingScore: -1, createdAt: -1 }
};

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const admin = req.authUser?.role === "admin" && req.query.admin === "true";
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 9), 1), admin ? 100 : 30);
    const sort = String(req.query.sort ?? "latest");
    const userId = req.authUser?.id ?? "";

    const pipeline = [
      { $match: promptMatch(req.query, admin) },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "promptId",
          as: "reviews"
        }
      },
      {
        $lookup: {
          from: "bookmarks",
          localField: "_id",
          foreignField: "promptId",
          as: "bookmarks"
        }
      },
      {
        $addFields: {
          avgRating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
          reviewCount: { $size: "$reviews" },
          bookmarkCount: { $size: "$bookmarks" },
          isBookmarked: userId ? { $in: [userId, "$bookmarks.userId"] } : false,
          trendingScore: {
            $add: [
              "$copyCount",
              { $multiply: [{ $size: "$reviews" }, 6] },
              { $multiply: [{ $size: "$bookmarks" }, 3] },
              { $cond: ["$featured", 12, 0] }
            ]
          }
        }
      },
      { $sort: sortMap[sort] ?? sortMap.latest },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          meta: [{ $count: "total" }]
        }
      }
    ];

    const [result] = await Prompt.aggregate(pipeline);
    const total = result.meta[0]?.total ?? 0;
    res.json({
      data: result.data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
    });
  })
);

router.get(
  "/taxonomy",
  asyncHandler(async (_req, res) => {
    const [categories, tools, difficulties] = await Promise.all([
      Prompt.distinct("category", { status: "approved" }),
      Prompt.distinct("aiTool", { status: "approved" }),
      Prompt.distinct("difficulty", { status: "approved" })
    ]);
    res.json({ categories, tools, difficulties });
  })
);

router.get(
  "/top-creators",
  asyncHandler(async (_req, res) => {
    const adminEmail = String(env.DEFAULT_ADMIN_EMAIL ?? "").toLowerCase();
    const data = await Prompt.aggregate([
      { $match: { status: "approved" } },
      {
        $addFields: {
          creatorEmailKey: { $toLower: { $ifNull: ["$creator.email", ""] } },
          creatorNameKey: { $toLower: { $ifNull: ["$creator.name", ""] } }
        }
      },
      {
        $match: {
          creatorEmailKey: { $ne: adminEmail },
          creatorNameKey: { $ne: "prompthive admin" }
        }
      },
      {
        $group: {
          _id: "$creatorEmailKey",
          id: { $first: "$creator.id" },
          name: { $first: "$creator.name" },
          email: { $first: "$creator.email" },
          image: { $first: "$creator.image" },
          prompts: { $sum: 1 },
          copies: { $sum: "$copyCount" }
        }
      },
      { $sort: { copies: -1, prompts: -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: "$id",
          name: 1,
          email: 1,
          image: 1,
          prompts: 1,
          copies: 1
        }
      }
    ]);
    res.json(data);
  })
);

router.get(
  "/mine/list",
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 40);
    const query = { "creator.id": req.authUser.id };
    const [data, total] = await Promise.all([
      Prompt.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Prompt.countDocuments(query)
    ]);
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
  })
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const prompt = requireFound(await Prompt.findById(objectId(req.params.id)).lean(), "Prompt not found");
    const reviews = await Review.find({ promptId: prompt._id }).sort({ createdAt: -1 }).lean();
    const isBookmarked = Boolean(
      await Bookmark.exists({ promptId: prompt._id, userId: req.authUser.id })
    );
    const canAccess =
      prompt.visibility === "public" ||
      req.authUser.subscription === "premium" ||
      req.authUser.role === "admin" ||
      prompt.creator.id === req.authUser.id;

    res.json({
      ...prompt,
      content: canAccess ? prompt.content : premiumLockedContent(prompt),
      reviews,
      isBookmarked,
      canAccess,
      locked: !canAccess,
      avgRating: reviews.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0
    });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = promptSchema.parse(req.body);
    const count = await Prompt.countDocuments({ "creator.id": req.authUser.id });
    if (req.authUser.subscription !== "premium" && count >= 3) {
      throw new HttpError(403, "Free users can add only 3 prompts. Upgrade to Premium to publish more.");
    }

    const prompt = await Prompt.create({
      ...body,
      copyCount: 0,
      status: "pending",
      creator: {
        id: req.authUser.id,
        name: req.authUser.name,
        email: req.authUser.email,
        image: req.authUser.image ?? ""
      }
    });
    await notifyAdminsForReview(prompt);
    res.status(201).json(prompt);
  })
);

router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const prompt = requireFound(await Prompt.findById(objectId(req.params.id)), "Prompt not found");
    const ownsPrompt = prompt.creator.id === req.authUser.id;
    if (!ownsPrompt && req.authUser.role !== "admin") throw new HttpError(403, "Only the creator can update this prompt");

    const body = promptSchema.partial().parse(req.body);
    const needsReview = req.authUser.role !== "admin";
    Object.assign(prompt, body, { status: needsReview ? "pending" : prompt.status });
    await prompt.save();
    if (needsReview) {
      await notifyAdminsForReview(prompt);
      await notifyUser(
        prompt.creator.id,
        "Prompt sent for review",
        `"${prompt.title}" was updated and is now waiting for admin approval.`,
        "prompt"
      );
    }
    res.json(prompt);
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const prompt = requireFound(await Prompt.findById(objectId(req.params.id)), "Prompt not found");
    const ownsPrompt = prompt.creator.id === req.authUser.id;
    if (!ownsPrompt && req.authUser.role !== "admin") throw new HttpError(403, "Only the creator or admin can delete this prompt");
    await Promise.all([
      Prompt.deleteOne({ _id: prompt._id }),
      Bookmark.deleteMany({ promptId: prompt._id }),
      Review.deleteMany({ promptId: prompt._id }),
      Report.deleteMany({ promptId: prompt._id })
    ]);
    res.json({ ok: true });
  })
);

router.patch(
  "/:id/copy",
  requireAuth,
  asyncHandler(async (req, res) => {
    const prompt = requireFound(await Prompt.findById(objectId(req.params.id)), "Prompt not found");
    const canAccess =
      prompt.visibility === "public" ||
      req.authUser.subscription === "premium" ||
      req.authUser.role === "admin" ||
      prompt.creator.id === req.authUser.id;
    if (!canAccess) throw new HttpError(402, "Subscribe to Premium to copy this prompt.");
    prompt.copyCount += 1;
    await prompt.save();
    res.json({ copyCount: prompt.copyCount });
  })
);

router.post(
  "/:id/fork",
  requireAuth,
  asyncHandler(async (req, res) => {
    const source = requireFound(await Prompt.findById(objectId(req.params.id)).lean(), "Prompt not found");
    const canAccess =
      source.visibility === "public" ||
      req.authUser.subscription === "premium" ||
      req.authUser.role === "admin" ||
      source.creator.id === req.authUser.id;
    if (!canAccess) throw new HttpError(402, "Subscribe to Premium to fork this prompt.");

    const fork = await Prompt.create({
      title: `${source.title} (Fork)`,
      description: source.description,
      content: source.content,
      category: source.category,
      aiTool: source.aiTool,
      tags: source.tags,
      difficulty: source.difficulty,
      thumbnailUrl: source.thumbnailUrl,
      visibility: "public",
      copyCount: 0,
      status: "pending",
      forkedFrom: source._id,
      creator: {
        id: req.authUser.id,
        name: req.authUser.name,
        email: req.authUser.email,
        image: req.authUser.image ?? ""
      }
    });
    await notifyAdminsForReview(fork);
    res.status(201).json(fork);
  })
);

router.post(
  "/:id/reviews",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ rating: z.number().min(1).max(5), comment: z.string().min(4) }).parse(req.body);
    const prompt = requireFound(await Prompt.findById(objectId(req.params.id)).lean(), "Prompt not found");
    const canAccess =
      prompt.visibility === "public" ||
      req.authUser.subscription === "premium" ||
      req.authUser.role === "admin" ||
      prompt.creator.id === req.authUser.id;
    if (!canAccess) throw new HttpError(402, "Subscribe to Premium to review this prompt.");

    const review = await Review.findOneAndUpdate(
      { promptId: prompt._id, "user.id": req.authUser.id },
      {
        $set: {
          ...body,
          user: {
            id: req.authUser.id,
            name: req.authUser.name,
            email: req.authUser.email,
            image: req.authUser.image ?? ""
          }
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(review);
  })
);

router.post(
  "/:id/reports",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        reason: z.enum(["Inappropriate Content", "Spam", "Copyright Violation", "Unsafe Advice", "Other"]),
        description: z.string().optional().default("")
      })
      .parse(req.body);
    const prompt = requireFound(await Prompt.findById(objectId(req.params.id)).lean(), "Prompt not found");
    const report = await Report.create({
      ...body,
      promptId: prompt._id,
      reporter: {
        id: req.authUser.id,
        name: req.authUser.name,
        email: req.authUser.email
      }
    });
    const notifications = [notifyAdminsForReport(prompt, report)];
    if (prompt.creator?.id && prompt.creator.id !== req.authUser.id) {
      notifications.push(
        notifyUser(
          prompt.creator.id,
          "Prompt report received",
          `"${prompt.title}" received a ${body.reason} report and is waiting for admin review.`,
          "report"
        )
      );
    }
    await Promise.all(notifications);
    res.status(201).json(report);
  })
);

router.get(
  "/:id/analytics",
  requireAuth,
  asyncHandler(async (req, res) => {
    const prompt = requireFound(await Prompt.findById(objectId(req.params.id)).lean(), "Prompt not found");
    if (prompt.creator.id !== req.authUser.id && req.authUser.role !== "admin") {
      throw new HttpError(403, "Only the creator or admin can view analytics");
    }
    const [bookmarks, reviews, reports] = await Promise.all([
      Bookmark.countDocuments({ promptId: prompt._id }),
      Review.countDocuments({ promptId: prompt._id }),
      Report.countDocuments({ promptId: prompt._id })
    ]);
    res.json({ copyCount: prompt.copyCount, bookmarks, reviews, reports });
  })
);

router.patch(
  "/:id/moderation",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        status: z.enum(["approved", "rejected"]),
        rejectionFeedback: z.string().optional().default("")
      })
      .parse(req.body);
    if (body.status === "rejected" && !body.rejectionFeedback.trim()) {
      throw new HttpError(400, "Rejection feedback is required.");
    }
    const prompt = requireFound(await Prompt.findByIdAndUpdate(objectId(req.params.id), body, { new: true }), "Prompt not found");
    await notifyUser(
      prompt.creator.id,
      body.status === "approved" ? "Prompt approved" : "Prompt rejected",
      body.status === "approved"
        ? `${prompt.title} is now live in the marketplace.`
        : body.rejectionFeedback,
      "prompt"
    );
    res.json(prompt);
  })
);

router.patch(
  "/:id/feature",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const prompt = requireFound(await Prompt.findById(objectId(req.params.id)), "Prompt not found");
    prompt.featured = !prompt.featured;
    await prompt.save();
    res.json(prompt);
  })
);

export default router;

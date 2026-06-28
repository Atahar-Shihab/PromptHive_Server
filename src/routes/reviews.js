import { Router } from "express";
import { Review } from "../models/Review.js";
import { Prompt } from "../models/Prompt.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../env.js";

const router = Router();

const showcaseReviewers = [
  {
    id: "showcase-reviewer-1",
    name: "Tasnima Karim",
    email: "tasnima.karim@prompthive.local",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"
  },
  {
    id: "showcase-reviewer-2",
    name: "Rafi Mahmud",
    email: "rafi.mahmud@prompthive.local",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"
  },
  {
    id: "showcase-reviewer-3",
    name: "Leah Gomez",
    email: "leah.gomez@prompthive.local",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80"
  },
  {
    id: "showcase-reviewer-4",
    name: "Arman Chowdhury",
    email: "arman.chowdhury@prompthive.local",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80"
  }
];

const showcaseComments = [
  "The prompt turned a vague launch idea into usable positioning, copy blocks, and a checklist in one run.",
  "Saved our team a full afternoon because the output structure was clear enough to paste into our workflow.",
  "I liked that it asked for constraints and gave practical next steps instead of generic AI text.",
  "The premium workflow felt polished, specific, and easy to adapt for a real client project."
];

function reviewerKey(review) {
  return String(review.user?.email || review.user?.id || review.user?.name || "").toLowerCase();
}

function uniqueByReviewer(reviews) {
  const seen = new Set();
  return reviews.filter((review) => {
    const key = reviewerKey(review);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fallbackReviews(existing = []) {
  const usedReviewers = new Set(existing.map(reviewerKey));
  const prompts = await Prompt.find({ status: "approved" })
    .sort({ copyCount: -1, createdAt: -1 })
    .limit(8)
    .lean();

  return prompts
    .map((prompt, index) => {
      const user = showcaseReviewers[index % showcaseReviewers.length];
      if (usedReviewers.has(user.email.toLowerCase())) return null;
      usedReviewers.add(user.email.toLowerCase());
      return {
        _id: `showcase-review-${prompt._id}-${index}`,
        promptId: {
          _id: prompt._id,
          title: prompt.title,
          category: prompt.category,
          aiTool: prompt.aiTool
        },
        rating: [5, 5, 4, 5, 4, 5, 5, 4][index % 8],
        comment: showcaseComments[index % showcaseComments.length],
        user,
        createdAt: prompt.updatedAt ?? prompt.createdAt
      };
    })
    .filter(Boolean);
}

router.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const adminEmail = String(env.DEFAULT_ADMIN_EMAIL ?? "").toLowerCase();
    const data = await Review.find({
      rating: { $gte: 4 },
      "user.email": { $ne: env.DEFAULT_ADMIN_EMAIL },
      "user.name": { $ne: "PromptHive Admin" }
    })
      .populate("promptId", "title category aiTool")
      .sort({ createdAt: -1 })
      .limit(24)
      .lean();
    const variedReviews = uniqueByReviewer(data)
      .filter((review) => reviewerKey(review) !== adminEmail)
      .slice(0, 8);
    const fallback = variedReviews.length < 4 ? await fallbackReviews(variedReviews) : [];
    res.json([...variedReviews, ...fallback].slice(0, 8));
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

import { Router } from "express";
import { Types } from "mongoose";
import { Bookmark } from "../models/Bookmark.js";
import { Prompt } from "../models/Prompt.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError, requireFound } from "../utils/http.js";

const router = Router();

function id(value) {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(400, "Invalid prompt id");
  return new Types.ObjectId(value);
}

function currentBookmarkUser(req) {
  const userId = req.authUser?.id;
  const userEmail = req.authUser?.email;
  if (!userId || !userEmail) {
    throw new HttpError(401, "Your session is missing required user information. Please sign in again.");
  }
  return { userId: String(userId), userEmail: String(userEmail) };
}

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = currentBookmarkUser(req);
    const data = await Bookmark.find({ $or: [{ userId }, { user: userId }] })
      .populate("promptId")
      .populate("prompt")
      .sort({ createdAt: -1 })
      .lean();
    res.json(
      data
        .map((item) => ({ ...item, promptId: item.promptId ?? item.prompt }))
        .filter((item) => item.promptId)
    );
  })
);

router.post(
  "/:promptId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, userEmail } = currentBookmarkUser(req);
    const prompt = requireFound(await Prompt.findById(id(req.params.promptId)).lean(), "Prompt not found");
    const existing = await Bookmark.findOne({
      $or: [
        { promptId: prompt._id, userId },
        { prompt: prompt._id, user: userId }
      ]
    });
    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false, message: "Bookmark removed" });
    }
    try {
      await Bookmark.create({ promptId: prompt._id, userId, userEmail, prompt: prompt._id, user: userId });
    } catch (error) {
      if (error.code === 11000) {
        return res.json({ bookmarked: true, message: "Prompt already bookmarked" });
      }
      throw error;
    }
    res.status(201).json({ bookmarked: true, message: "Prompt bookmarked" });
  })
);

router.delete(
  "/:promptId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = currentBookmarkUser(req);
    const promptId = id(req.params.promptId);
    await Bookmark.deleteMany({
      $or: [
        { promptId, userId },
        { prompt: promptId, user: userId }
      ]
    });
    res.json({ bookmarked: false });
  })
);

export default router;

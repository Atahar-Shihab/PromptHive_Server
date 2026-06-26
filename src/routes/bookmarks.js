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

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await Bookmark.find({ userId: req.authUser.id })
      .populate("promptId")
      .sort({ createdAt: -1 })
      .lean();
    res.json(data);
  })
);

router.post(
  "/:promptId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const prompt = requireFound(await Prompt.findById(id(req.params.promptId)).lean(), "Prompt not found");
    const existing = await Bookmark.findOne({ promptId: prompt._id, userId: req.authUser.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false, message: "Bookmark removed" });
    }
    await Bookmark.create({ promptId: prompt._id, userId: req.authUser.id, userEmail: req.authUser.email });
    res.status(201).json({ bookmarked: true, message: "Prompt bookmarked" });
  })
);

router.delete(
  "/:promptId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Bookmark.deleteOne({ promptId: id(req.params.promptId), userId: req.authUser.id });
    res.json({ bookmarked: false });
  })
);

export default router;

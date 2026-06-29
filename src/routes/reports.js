import { Router } from "express";
import { z } from "zod";
import { Report } from "../models/Report.js";
import { Prompt } from "../models/Prompt.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireFound } from "../utils/http.js";
import { notifyUser } from "../services/notification.service.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const data = await Report.find().populate("promptId").sort({ createdAt: -1 }).lean();
    res.json(data);
  })
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.enum(["removed", "warned", "dismissed"]) }).parse(req.body);
    const report = requireFound(await Report.findByIdAndUpdate(req.params.id, body, { new: true }).lean(), "Report not found");
    const prompt = report.promptId ? await Prompt.findById(report.promptId).lean() : null;
    if (body.status === "removed" && prompt) {
      if (prompt.creator?.id) {
        await notifyUser(
          prompt.creator.id,
          "Prompt removed after report",
          `"${prompt.title}" was removed after admin report review.`,
          "report"
        );
      }
      await Prompt.findByIdAndDelete(prompt._id);
    }
    if (body.status === "warned" && prompt?.creator?.id) {
      await notifyUser(prompt.creator.id, "Creator warning", `An admin warned you about ${prompt.title}.`, "report");
    }
    if (body.status === "dismissed" && prompt?.creator?.id) {
      await notifyUser(
        prompt.creator.id,
        "Report dismissed",
        `An admin reviewed and dismissed the report on "${prompt.title}".`,
        "report"
      );
    }
    res.json(report);
  })
);

export default router;

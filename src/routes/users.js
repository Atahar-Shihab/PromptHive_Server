import { Router } from "express";
import { z } from "zod";
import { Prompt } from "../models/Prompt.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteUser, getUserById, listUsers, updateUserProfile, updateUserRole } from "../services/user.service.js";
import { requireFound } from "../utils/http.js";

const router = Router();

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const totalPrompts = await Prompt.countDocuments({ "creator.id": req.authUser.id });
    res.json({ ...req.authUser, totalPrompts });
  })
);

router.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2).max(80).optional(),
        image: z.string().url().optional(),
        role: z.enum(["user", "creator"]).optional()
      })
      .parse(req.body);
    const user = requireFound(await updateUserProfile(req.authUser.id, body), "User not found");
    await Prompt.updateMany(
      { "creator.id": user.id },
      { $set: { "creator.name": user.name, "creator.image": user.image ?? "" } }
    );
    const totalPrompts = await Prompt.countDocuments({ "creator.id": user.id });
    res.json({ ...user, totalPrompts });
  })
);

router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 40);
    res.json(await listUsers(page, limit, String(req.query.search ?? "")));
  })
);

router.patch(
  "/:id/role",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const body = z.object({ role: z.enum(["user", "creator", "admin"]) }).parse(req.body);
    const user = requireFound(await updateUserRole(req.params.id, body.role), "User not found");
    res.json(user);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.authUser.id) return res.status(400).json({ message: "Admins cannot delete themselves." });
    const user = requireFound(await getUserById(req.params.id), "User not found");
    if (user.id === req.authUser.id) return res.status(400).json({ message: "Admins cannot delete themselves." });
    await deleteUser(req.params.id);
    res.json({ ok: true });
  })
);

export default router;

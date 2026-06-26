import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { assertProductionEnv, env } from "./env.js";
import { connectDatabase, mongoSetupMessage } from "./config/mongo.js";
import promptsRouter from "./routes/prompts.js";
import bookmarksRouter from "./routes/bookmarks.js";
import reviewsRouter from "./routes/reviews.js";
import reportsRouter from "./routes/reports.js";
import paymentsRouter from "./routes/payments.js";
import usersRouter from "./routes/users.js";
import analyticsRouter from "./routes/analytics.js";
import uploadsRouter from "./routes/uploads.js";
import aiRouter from "./routes/ai.js";
import notificationsRouter from "./routes/notifications.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

assertProductionEnv();

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(compression());

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/", (_req, res) => {
  res.json({ name: "PromptHive API", ok: true });
});
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, database: "mongodb", auth: "better-auth" });
});

app.use("/api/prompts", promptsRouter);
app.use("/api/bookmarks", bookmarksRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/notifications", notificationsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, _req, res, _next) => {
  const status = error.status ?? error.statusCode ?? 500;
  const message = error.issues ? error.issues.map((issue) => issue.message).join(", ") : error.message;
  if (env.NODE_ENV !== "production") console.error(error);
  res.status(status).json({ message: message ?? "Internal server error" });
});

try {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`PromptHive API running at ${env.SERVER_URL} on port ${env.PORT}`);
  });
} catch (error) {
  console.error(mongoSetupMessage(error));
  process.exit(1);
}

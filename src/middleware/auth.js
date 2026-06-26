import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { ensureUserDefaults } from "../services/user.service.js";

export async function optionalAuth(req, _res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    if (session?.user) {
      req.authUser = await ensureUserDefaults(session.user);
      req.authSession = session.session;
    }
    next();
  } catch {
    next();
  }
}

export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    if (!session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.authUser = await ensureUserDefaults(session.user);
    req.authSession = session.session;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.authUser) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.authUser.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}

export function isPremium(user = reqUserPlaceholder()) {
  return user.subscription === "premium";
}

function reqUserPlaceholder() {
  return { subscription: "free" };
}

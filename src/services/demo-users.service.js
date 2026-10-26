import { auth } from "../auth.js";
import { env } from "../env.js";
import { getUserByEmail, updateUserRole, markPremium } from "./user.service.js";

export const DEMO_ACCOUNTS = [
  {
    name: env.DEFAULT_ADMIN_NAME || "PromptHive Admin",
    email: env.DEFAULT_ADMIN_EMAIL || "admin@demo.com",
    password: env.DEFAULT_ADMIN_PASSWORD || "admin1234",
    role: "admin",
    subscription: "premium",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"
  },
  {
    name: "Demo Creator",
    email: "creator@demo.com",
    password: "creator1234",
    role: "creator",
    subscription: "free",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80"
  },
  {
    name: "Demo Premium User",
    email: "user@demo.com",
    password: "user1234",
    role: "user",
    subscription: "premium",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"
  }
];

export async function ensureDemoAccounts() {
  for (const account of DEMO_ACCOUNTS) {
    try {
      let user = await getUserByEmail(account.email);
      if (!user) {
        try {
          await auth.api.signUpEmail({
            body: {
              name: account.name,
              email: account.email,
              password: account.password,
              image: account.image
            }
          });
          user = await getUserByEmail(account.email);
        } catch {
          user = await getUserByEmail(account.email);
        }
      }

      if (user) {
        if (user.role !== account.role) {
          await updateUserRole(user.id, account.role);
        }
        if (account.subscription === "premium" && user.subscription !== "premium") {
          await markPremium(user.id);
        }
      }
    } catch (err) {
      console.warn(`Could not setup demo account ${account.email}:`, err.message);
    }
  }
}

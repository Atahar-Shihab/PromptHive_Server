import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer, jwt } from "better-auth/plugins";
import { appDb, mongoClient } from "./config/mongo.js";
import { env } from "./env.js";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CLIENT_URL, env.BETTER_AUTH_URL, env.SERVER_URL].filter(Boolean),
  database: mongodbAdapter(appDb(), {
    client: mongoClient,
    transaction: true
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "missing-google-client-id",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "missing-google-client-secret",
      mapProfileToUser: (profile) => ({
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        role: "user",
        subscription: "free"
      })
    }
  },
  user: {
    additionalFields: {
      role: {
        type: ["user", "creator", "admin"],
        required: false,
        defaultValue: "user",
        input: false
      },
      subscription: {
        type: ["free", "premium"],
        required: false,
        defaultValue: "free",
        input: false
      },
      premiumUntil: {
        type: "date",
        required: false,
        input: false
      }
    }
  },
  plugins: [
    bearer(),
    jwt({
      jwt: {
        expirationTime: "1h",
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role ?? "user",
          subscription: user.subscription ?? "free"
        })
      }
    })
  ]
});

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { env } from "../config/env";

// Better Auth manages its own connection (separate from mongoose — same DB)
const client = new MongoClient(env.MONGODB_URI);
const db = client.db(process.env.AUTH_DB_NAME); // picks up "tripplanner" from the URI

const isProd = env.NODE_ENV === "production";

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CLIENT_URL],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
  additionalFields: {
    userRole: {
      type: "string",
      defaultValue: "traveler",
      input: true,
    },
  },
},

  // Cross-origin cookies (Vercel <-> Render) only in production.
  // On localhost, secure cookies would break login.
  ...(isProd && {
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none" as const,
        secure: true,
        partitioned: true,
      },
    },
  }),
});
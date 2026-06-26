import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { env } from "../env.js";

const mongoOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000
};

export const mongoClient = new MongoClient(env.MONGODB_URI, mongoOptions);

let clientPromise = null;
let mongoosePromise = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectOnce() {
  if (!clientPromise) {
    clientPromise = mongoClient.connect();
  }
  try {
    await clientPromise;
  } catch (error) {
    clientPromise = null;
    throw error;
  }

  if (!mongoosePromise && mongoose.connection.readyState === 0) {
    mongoosePromise = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
      ...mongoOptions
    });
  }
  try {
    await mongoosePromise;
  } catch (error) {
    mongoosePromise = null;
    throw error;
  }
}

export async function connectDatabase() {
  let lastError = null;

  for (let attempt = 1; attempt <= env.MONGODB_CONNECT_RETRIES; attempt += 1) {
    try {
      await connectOnce();
      if (attempt > 1) {
        console.log(`MongoDB connected after ${attempt} attempts.`);
      }
      return;
    } catch (error) {
      lastError = error;
      if (attempt >= env.MONGODB_CONNECT_RETRIES) break;

      const delay = env.MONGODB_CONNECT_RETRY_DELAY_MS * attempt;
      console.warn(
        `MongoDB connection attempt ${attempt}/${env.MONGODB_CONNECT_RETRIES} failed: ${error.message}. Retrying in ${Math.round(delay / 1000)}s...`
      );
      await wait(delay);
    }
  }

  throw lastError;
}

export function appDb() {
  return mongoClient.db(env.MONGODB_DB);
}

export function mongoSetupMessage(error) {
  const isLocalhost = env.MONGODB_URI.includes("127.0.0.1") || env.MONGODB_URI.includes("localhost");
  const target = isLocalhost ? "local MongoDB at 127.0.0.1:27017" : "the MongoDB URI configured in .env";

  return [
    "",
    "MongoDB connection failed.",
    `The server tried to connect to ${target}, but MongoDB is not reachable.`,
    "",
    "Fix one of these before running npm run dev:",
    "1. Start/install MongoDB locally, then keep MONGODB_URI=mongodb://127.0.0.1:27017/prompthive",
    "2. Or use MongoDB Atlas and set MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db-name>",
    "",
    "After fixing .env, run:",
    "npm run dev",
    "",
    `Retry attempts: ${env.MONGODB_CONNECT_RETRIES}`,
    `Original error: ${error.message}`
  ].join("\n");
}

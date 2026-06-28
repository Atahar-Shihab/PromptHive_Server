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
let appIndexPromise = null;

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

async function repairLegacyBookmarkIndexes() {
  const collection = appDb().collection("bookmarks");

  let indexes = [];
  try {
    indexes = await collection.indexes();
  } catch (error) {
    if (error.codeName === "NamespaceNotFound" || error.code === 26) return;
    console.warn(`Could not inspect bookmarks indexes: ${error.message}`);
    return;
  }

  const legacyIndexes = indexes.filter((index) => {
    const keys = Object.keys(index.key ?? {});
    return index.name === "user_1_prompt_1" || index.name === "prompt_1_user_1" || (keys.includes("user") && keys.includes("prompt"));
  });

  for (const index of legacyIndexes) {
    try {
      await collection.dropIndex(index.name);
      console.log(`Dropped legacy bookmarks index: ${index.name}`);
    } catch (error) {
      console.warn(`Could not drop legacy bookmarks index ${index.name}: ${error.message}`);
    }
  }

  try {
    await collection.deleteMany({
      $and: [
        { $or: [{ userId: { $exists: false } }, { userId: null }, { userId: "" }] },
        { $or: [{ promptId: { $exists: false } }, { promptId: null }] },
        { $or: [{ user: { $exists: false } }, { user: null }] },
        { $or: [{ prompt: { $exists: false } }, { prompt: null }] }
      ]
    });
  } catch (error) {
    console.warn(`Could not clean invalid bookmark records: ${error.message}`);
  }

  try {
    await collection.createIndex({ promptId: 1, userId: 1 }, { unique: true, name: "promptId_1_userId_1" });
  } catch (error) {
    console.warn(`Could not ensure bookmarks index: ${error.message}`);
  }
}

async function ensureAppIndexes() {
  if (!appIndexPromise) {
    appIndexPromise = repairLegacyBookmarkIndexes();
  }
  await appIndexPromise;
}

export async function connectDatabase() {
  let lastError = null;

  for (let attempt = 1; attempt <= env.MONGODB_CONNECT_RETRIES; attempt += 1) {
    try {
      await connectOnce();
      await ensureAppIndexes();
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

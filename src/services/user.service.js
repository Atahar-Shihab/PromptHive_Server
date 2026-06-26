import { ObjectId } from "mongodb";
import { appDb } from "../config/mongo.js";

const users = () => appDb().collection("user");

function idQuery(id) {
  const options = [{ id }, { _id: id }];
  if (ObjectId.isValid(id)) options.push({ _id: new ObjectId(id) });
  return { $or: options };
}

function identityQuery(rawUser) {
  const id = rawUser.id ?? rawUser._id?.toString();
  const options = [];
  if (id) {
    options.push({ id }, { _id: id });
    if (ObjectId.isValid(id)) options.push({ _id: new ObjectId(id) });
  }
  if (rawUser.email) options.push({ email: rawUser.email });
  return options.length ? { $or: options } : { id };
}

export function normalizeUser(raw) {
  return {
    recordId: raw._id?.toString(),
    id: raw.id ?? raw._id?.toString(),
    name: raw.name ?? "Member",
    email: raw.email,
    image: raw.image,
    role: raw.role ?? "user",
    subscription: raw.subscription ?? "free",
    premiumUntil: raw.premiumUntil,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

export async function ensureUserDefaults(rawUser) {
  const id = rawUser.id ?? rawUser._id?.toString();
  const now = new Date();
  const existing = await users().findOne(identityQuery(rawUser));
  const query = existing?._id ? { _id: existing._id } : { id };
  const updates = {
    id,
    name: rawUser.name ?? existing?.name ?? "Member",
    email: rawUser.email ?? existing?.email,
    updatedAt: now
  };

  if (rawUser.image) {
    updates.image = rawUser.image;
  }

  await users().updateOne(
    query,
    {
      $set: updates,
      $setOnInsert: {
        role: "user",
        subscription: "free",
        createdAt: rawUser.createdAt ?? now
      }
    },
    { upsert: true }
  );

  const user = await users().findOne(identityQuery({ ...rawUser, id }));
  return normalizeUser(user ?? rawUser);
}

export async function getUserById(id) {
  const user = await users().findOne(idQuery(id));
  return user ? normalizeUser(user) : null;
}

export async function getUserByEmail(email) {
  const user = await users().findOne({ email });
  return user ? normalizeUser(user) : null;
}

export async function listUsersByRole(role) {
  const data = await users().find({ role }).toArray();
  return data.map(normalizeUser);
}

export async function updateUserRole(id, role) {
  await users().updateOne(idQuery(id), { $set: { role, updatedAt: new Date() } });
  return getUserById(id);
}

export async function updateUserProfile(id, profile) {
  const updates = { updatedAt: new Date() };
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  const image = typeof profile.image === "string" ? profile.image.trim() : "";

  if (name) updates.name = name;
  if (image) updates.image = image;

  await users().updateOne(idQuery(id), { $set: updates });
  return getUserById(id);
}

export async function deleteUser(id) {
  return users().deleteOne(idQuery(id));
}

export async function markPremium(userId, months = 120) {
  const premiumUntil = new Date();
  premiumUntil.setMonth(premiumUntil.getMonth() + months);
  await users().updateOne(
    idQuery(userId),
    {
      $set: {
        subscription: "premium",
        premiumUntil,
        updatedAt: new Date()
      }
    }
  );
  return getUserById(userId);
}

export async function listUsers(page = 1, limit = 10, search = "") {
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { role: { $regex: search, $options: "i" } }
        ]
      }
    : {};
  const [data, total] = await Promise.all([
    users()
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    users().countDocuments(query)
  ]);

  return {
    data: data.map(normalizeUser),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
}

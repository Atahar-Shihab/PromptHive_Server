import { Notification } from "../models/Notification.js";

const streams = new Map();

export function attachNotificationStream(userId, res) {
  const set = streams.get(userId) ?? new Set();
  set.add(res);
  streams.set(userId, set);

  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  res.on("close", () => {
    const current = streams.get(userId);
    current?.delete(res);
    if (current?.size === 0) streams.delete(userId);
  });
}

export async function notifyUser(userId, title, message, type = "system") {
  const notification = await Notification.create({ userId, title, message, type });
  const payload = JSON.stringify(notification.toObject());
  streams.get(userId)?.forEach((res) => {
    res.write(`event: notification\ndata: ${payload}\n\n`);
  });
  return notification;
}

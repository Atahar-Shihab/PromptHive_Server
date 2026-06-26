export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function requireFound(value, message = "Resource not found") {
  if (!value) throw new HttpError(404, message);
  return value;
}

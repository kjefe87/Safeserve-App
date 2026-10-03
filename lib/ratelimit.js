// Best-effort login throttle: 5 failed attempts per email+IP per 15 minutes.
// In-memory, so each serverless instance counts separately. Fine as a brake on
// PIN guessing; for a hard guarantee use a shared store (Upstash/Vercel KV).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const attempts = new Map();

export function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export function isLockedOut(key) {
  const rec = attempts.get(key);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return rec.count >= MAX_FAILURES;
}

export function recordFailure(key) {
  const rec = attempts.get(key);
  if (!rec || Date.now() - rec.first > WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
  else rec.count += 1;
  if (attempts.size > 5000) attempts.clear(); // crude memory cap
}

export function clearFailures(key) {
  attempts.delete(key);
}

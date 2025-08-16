// lib/rateLimit.ts
const seen = new Map<string, number>(); // key: fid or address

export function canSpin(key: string, windowSec = 30) {
  const now = Date.now();
  const last = seen.get(key) ?? 0;
  if (now - last < windowSec * 1000) return false;
  seen.set(key, now);
  return true;
}

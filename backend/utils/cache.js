// Simple in-memory TTL cache — no external deps needed
// Suitable for single-process Node.js; for multi-process use Redis instead.
const store = new Map();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const set = (key, data, ttlMs = DEFAULT_TTL) => {
  store.set(key, { data, expires: Date.now() + ttlMs });
};

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
};

const del = (key) => store.delete(key);

const clear = () => store.clear();

module.exports = { set, get, del, clear };

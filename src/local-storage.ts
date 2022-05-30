import { Tweet } from './types/tweets';

interface Time {
  time: number;
};

const iterateCount = 100;
async function removeOldKeys(threshold: number, restKeys: Array<string>): Promise<void> {

  const current = restKeys.slice(0, iterateCount);
  const rest = restKeys.slice(iterateCount);

  for (const key of current) {
    const value = localStorage.getItem(key);
    if (value === null) {
      localStorage.removeItem(key);
      continue;
    }

    const obj = JSON.parse(value) as Tweet & Partial<Time>;
    if (typeof obj.time !== 'number') {
      localStorage.removeItem(key);
      continue;
    }

    if (obj.time < threshold) {
      localStorage.removeItem(key);
    }
  }

  if (rest.length > 0) {
    await new Promise<void>((resolve) => { resolve(); });
    return removeOldKeys(threshold, rest);
  }
}

export async function store(key: string, value: Tweet) {
  const obj = value as Tweet & Time;
  obj.time = Date.now();
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    const keys = localStorage.keys();
    const threshold = Date.now() - 24 * 60 * 60 * 1000 * 7; // as 7days ago
    await removeOldKeys(threshold, keys);
    localStorage.setItem(key, JSON.stringify(obj));
  }
}

export function load(key: string): Tweet | undefined {

  let value: string | null = localStorage.getItem(key);
  if (value === null) {
    return undefined;
  }
  return JSON.parse(value) as Tweet;
}

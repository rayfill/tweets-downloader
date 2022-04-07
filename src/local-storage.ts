import { Tweet } from './types/tweets';

interface Time {
  time: number;
};

export function store(key: string, value: Tweet) {
  try {
    const obj = value as Tweet & Time;
    obj.time = Date.now();
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    const keys = localStorage.keys();
    const removeKeys: Array<string> = [];
    for (const key of keys) {
      const threshold = Date.now() - 24 * 60 * 60 * 1000 * 7;
      const value: string | null = localStorage.get(key);
      if (value === null) {
        removeKeys.push(key);
      } else {
        const obj = JSON.parse(value) as Tweet & Time;
        if (obj.time < threshold) {
          removeKeys.push(key);
        }
      }
    }
    removeKeys.forEach((key) => {
      localStorage.removeItem(key);
    });
    const obj = value as Tweet & Time;
    obj.time = Date.now();
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

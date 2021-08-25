import { Tweet } from './types/tweets';

export function store(key: string, value: Tweet) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function load(key: string): Tweet | undefined {

  let value: string | null = localStorage.getItem(key);
  if (value === null) {
    return undefined;
  }
  return JSON.parse(value);
}

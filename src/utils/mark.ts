import type { Tweet } from '../types';

export function mark(tweet: Tweet | string | number): void {
  if (typeof tweet === 'string' || typeof tweet === 'number') {
    localStorage.setItem(`saved:${tweet}`, 'true');
  } else {
    localStorage.setItem(`saved:${tweet.id_str}`, 'true');
  }
}


export function getMark(id_str: string): boolean {
  return localStorage.getItem(`saved:${id_str}`) !== null;
}

import { createContext, ReactNode, useCallback } from 'react';
import { Subject } from 'rxjs';

const subject = new Subject<string>();
const loadTweets = new Set<string>();
subject.subscribe(msg => {
  console.log('push tweet', msg);
  loadTweets.add(msg);
})

export function getLoadTweetNotifier(): Subject<string> {
  return subject;
}

const loadTweetsContext = createContext(loadTweets);

export function LoadTweetsContext({ children }: { children?: ReactNode }) {

  return (
    <loadTweetsContext.Provider value={loadTweets}>
      {children}
    </loadTweetsContext.Provider>
  );
}

export function useLoadTweets(): [getTweets: () => Array<string>, clearTweets: () => void] {
  const getTweets = useCallback(() => {
    return Array.from(loadTweets.values());
  }, []);

  const clearTweets = useCallback(() => {
    loadTweets.clear();
  }, []);

  return [getTweets, clearTweets];
}

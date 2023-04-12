import { useEffect, useState } from 'react';
import { Observable, Subject } from 'rxjs';

function createURL(pathname: string): URL {
  const prevURL = new URL(window.location.href);
  const url = `${prevURL.protocol}//${prevURL.hostname}${pathname}`;
  return new URL(url);
}

type StateFunction = (state: unknown, unused: string, url: string | URL | null | undefined) => void;
let original: {
  replaceState: StateFunction;
  pushState: StateFunction;
} | undefined = undefined;

function enableHistoryHook(): Observable<string> | null {
  if (original === undefined) {
    const subject = new Subject<string>();
    let oldUrl: URL | undefined = undefined;
    window.addEventListener('popstate', (_event: PopStateEvent) => {
      const newUrl = new URL(location.href);
      if (oldUrl === undefined || oldUrl.pathname !== newUrl.pathname) {
        subject.next(newUrl.toString());
        oldUrl = newUrl;
      }
    });

    original = {
      replaceState: history.replaceState,
      pushState: history.pushState,
    };

    const origin = original;
    let currentUrl = new URL(window.location.href);
    history.pushState = function (this: History, state: unknown, unused: string, url: string | URL | null | undefined): void {
      origin.pushState.bind(this)(state, unused, url);
      if (url !== null && url !== undefined) {
        const newUrl = url instanceof URL ? url : createURL(url);
        if (currentUrl.pathname !== newUrl.pathname) {
          subject.next(newUrl.toString());
        }
      }
    }

    history.replaceState = (state: unknown, unused: string, url: string | URL | null | undefined): void => {
      origin.replaceState.bind(history)(state, unused, url);
      if (url !== null && url !== undefined) {
        const newUrl = url instanceof URL ? url : createURL(url);
        if (currentUrl.pathname !== newUrl.pathname) {
          subject.next(newUrl.toString());
        }
      }
    }

    return subject.asObservable();
  }
  return null;
}

export function useHistoryChange() {

  const [historyChangeObservable, setHistoryChangeObservable] = useState<Observable<string> | null>(null);
  useEffect(() => {
    const historyChange = enableHistoryHook();
    if (historyChange !== null) {
      setHistoryChangeObservable(historyChange);
    }
  }, []);

  return historyChangeObservable;
}

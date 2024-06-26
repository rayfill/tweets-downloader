import { toast } from 'react-hot-toast';
import { getId } from './ids';
import { getMark, mark } from './mark';
import { store, load } from './local-storage';
import { save } from './save';
import { saveAs } from 'file-saver';
/// <reference types="../../lib/gm-goodies/index.d.ts" />
import { xhrHook } from '../../lib/gm-goodies';
import { parse as xhrParse } from '../parser/XHRTweetParser';
import { parse as graphParse } from '../parser/GraphTweetParser';
import type { Tweet } from '../types';

import { NONSAVE_COLOR, SAVED_COLOR } from '../types';
import { Subject } from 'rxjs';

export function changeColor(button: HTMLButtonElement, saved: boolean) {
  if (saved) {
    button.style.background = SAVED_COLOR;
    button.innerText = 'already saved';
    button.dataset.downloaded = 'true';
  } else {
    button.style.background = NONSAVE_COLOR;
    button.innerText = 'save';
    button.dataset.downloaded = 'false';
  }
}

type CreateElementFunctionType<K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap> =
  (name: K, options?: ElementCreationOptions) => HTMLElementTagNameMap[K];

export function createElementHook(orig: CreateElementFunctionType, doc: Document, notifyTarget: Subject<string>): CreateElementFunctionType {

  const hookedCreateElement = <K extends keyof HTMLElementTagNameMap>(
    name: K,
    options?: ElementCreationOptions
  ): HTMLElementTagNameMap[K] => {

    let elem = orig.call(doc, name, options);
    let tagName = name.toLowerCase();

    if (tagName === 'article') {
      elem.style.display = 'block';
      let handler = (elem: Element) => {

        let time = elem.querySelector('a time');
        const id = time !== null ? getId((time.parentNode! as HTMLAnchorElement).href) : getId(window.location.href);
        if (id === undefined) {
          return elem;
        }
        notifyTarget.next(id);

        let button = doc.createElement('button');
        button.style.width = '100%';
        button.dataset.type = 'download';
        button.dataset.tweetId = id;

        if (getMark(id)) {
          changeColor(button, true);
        } else {
          changeColor(button, false);
        }

        const updateButtonText = (text: string): void => {
          button.innerText = text;
        };

        let total = 0;
        const updateDownloadProgress = (delta: number): void => {
          total += delta;
          updateButtonText(`${total} bytes downloaded`);
        }

        button.addEventListener('click', async () => {
          try {
            if (id === undefined) {
              toast.error('id is undefined');
              return;
            }
            let tweet = load(id);

            if (tweet !== undefined) {

              const result = await save(tweet, updateDownloadProgress, updateButtonText)
              if (result === null) {
                toast.error(`id: ${tweet.id_str} does not saved`);
                return;
              }
              const blob = result[0];
              const filename = result[1];
              saveAs(blob, filename);
              mark(tweet!);
              button.style.background = SAVED_COLOR;
              button.dataset.downloaded = 'downloaded';
              postMessage({ tweet: tweet }, '*');
            }
          } catch (e) {
            alert(e);
          }
        });
        elem.appendChild(button);
      };
      setTimeout(() => {
        handler(elem);
      }, 0);
    }

    return elem as HTMLElementTagNameMap[K];
  }

  return hookedCreateElement;
}

export function registerXHRHook() {
  xhrHook(async (xhr: XMLHttpRequest, ..._args: any) => {

    if (xhr.status < 200 && xhr.status >= 300) {
      toast.error(`failed to fetch ${xhr.responseURL}`);
      return;
    }

    const all = new RegExp('^https://x[.]com/i/2/notifications/all[.]json.*$');
    const rux = new RegExp('^https://api[.]x[.]com/i/api/2/rux[.]json.*$');
    const detail = new RegExp('^https://x[.]com/i/api/graphql/[^/]+/TweetDetail.*$');
    const userMedia = new RegExp('^https://x[.]com/i/api/graphql/[^/]+/UserMedia.*$');
    const userTweets = new RegExp('^https://x[.]com/i/api/graphql/[^/]+/UserTweets.*$');
    const bookmarks = new RegExp('^https://x[.]com/i/api/graphql/[^/]+/Bookmarks.*$');
    const homeLatest = new RegExp('^https://x[.]com/i/api/graphql/[^/]+/HomeLatestTimeline.*$');
    const listLatest = new RegExp('^https://x[.]com/i/api/graphql/[^/]+/ListLatestTweetsTimeline.*$');

    let tweets: Tweet[] | undefined;

    try {
      if (all.test(xhr.responseURL)) {
        console.log(`all: ${xhr.responseURL}`);
        tweets = xhrParse(JSON.parse(xhr.responseText));
      } else if (rux.test(xhr.responseURL)) {
        console.log(`rux: ${xhr.responseURL}`);
        tweets = xhrParse(JSON.parse(xhr.responseText));
      } else if (detail.test(xhr.responseURL)) {
        console.log(`detail: ${xhr.responseURL}`);
        tweets = graphParse(JSON.parse(xhr.responseText));
      } else if (userMedia.test(xhr.responseURL)) {
        console.log(`userMedia: ${xhr.responseURL}`);
        tweets = graphParse(JSON.parse(xhr.responseText));
      } else if (userTweets.test(xhr.responseURL)) {
        console.log(`userTweets: ${xhr.responseURL}`);
        tweets = graphParse(JSON.parse(xhr.responseText));
      } else if (bookmarks.test(xhr.responseURL)) {
        console.log(`bookmark: ${xhr.responseURL}`);
        tweets = graphParse(JSON.parse(xhr.responseText));
      } else if (homeLatest.test(xhr.responseURL)) {
        console.log(`HomeLatestTimeline: ${xhr.responseURL}`);
        tweets = graphParse(JSON.parse(xhr.responseText));
      } else if (listLatest.test(xhr.responseURL)) {
        console.log(`ListLatestTweetsTimeline: ${xhr.responseURL}`);
        tweets = graphParse(JSON.parse(xhr.responseText));
      }
    } catch (e) {
      debugger;
      toast.error(`error url: ${xhr.responseURL}`);
      toast.error(String(e));
      console.error(`error url: ${xhr.responseURL}`);
      console.error(e);
    }

    try {
      if (tweets !== undefined) {
        await Promise.all(tweets.map(async (tweet) => {
          console.log(`tweet: ${tweet.id} ${tweet.id_str}`);
          try {
            return await store(tweet.id_str, tweet);
          } catch (e) {
            debugger;
            console.log(tweet);
            console.error(e);
            throw e;
          }
        }));
      }
    } catch (e) {
      if (e instanceof Array) {
        e.filter(e => e instanceof Error).forEach((e: Error) => {
          console.error(e);
          toast.error(String(e));
        });
      } else {
        console.error(e);
        toast.error(String(e));
      }
    }
  });
}

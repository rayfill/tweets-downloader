
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Tweet } from './types/tweets';

/// <reference types="../lib/gm-goodies/index.d.ts" />
import { GM_fetch, xhrHook } from '../lib/gm-goodies';
import { parse as xhrParse } from './parser/XHRTweetParser';
import { parse as graphParse } from './parser/GraphTweetParser';

import { store, load } from './local-storage';

// MutationEvent Handling(ページ遷移検出、遅延ロード検出)
// save button handler
// button placer

const SAVED = 'green';

declare var unsafeWindow: Window;
declare var window: Window;

const pattern = new RegExp('^.*/([0-9]+)(?:[?].*)?$');
function getId(link: string): string | undefined {
  let match = pattern.exec(link);
  if (match !== null) {
    return match[1];
  }
  return undefined;
}

const extPattern = new RegExp('^.*[.]([^.?]+)(?:[?].*)?$');
function extension(url: string): string {
  let match = extPattern.exec(url);
  if (match === null) {
    throw new TypeError(`ext pattern not found: ${url}`);
  }

  return match[1];
}

type DownloadNotify = (downloadedInFrame: number) => void;
type ArchiveNotify = (message: string) => void;

function save(tweet: Tweet, downloadNotify?: DownloadNotify, archiveNotify?: ArchiveNotify): Promise<void> {
  let zip = new JSZip();
  const userId = tweet.user.id_str;
  const tweetId = tweet.id_str;
  const name = tweet.user.name;

  const filename = `${userId}_${tweetId}_${name}.zip`;

  zip.file('tweet.txt', tweet.full_text);
  let index = 0;
  let jobs = tweet.media.map((medium) => {

    let url = medium.url;
    if (medium.media_type === 'photo') {
      let ext = extension(medium.url);
      url = url.substr(0, url.length - (ext.length + 1));
      url = `${url}?format=${ext}&name=orig`;
    }

    let previous: number = 0;
    return GM_fetch(url, { onDownloadProgress: (ev: { loaded: number }) => {
      let totalInFrame = ev.loaded - previous;
      previous = ev.loaded;
      if (downloadNotify !== undefined) {
        downloadNotify(totalInFrame);
      }
    } })
      .then((response) => {
        if (response.ok) {
          zip.file(`${index++}.${extension(medium.url)}`, response.blob());
          return;
        }
        throw new TypeError(response.statusText);
      });
  });

  return Promise.all(jobs).then(() => {
    return zip.generateAsync({ type: 'blob' }, (metadata: { percent: number, currentFile: string }) => {
      if (archiveNotify !== undefined) {
        if (metadata.currentFile === null) {
          archiveNotify(`${metadata.percent.toPrecision(5)} %`);
        } else {
          archiveNotify(`${metadata.currentFile}: ${metadata.percent.toPrecision(5)} %`);
        }
      }
    });
  }).then((blob) => {
    saveAs(blob, filename);
  });
}

function mark(tweet: Tweet): void {
  localStorage.setItem(`saved:${tweet.id_str}`, 'true');
}

function getMark(id_str: string): boolean {
  return localStorage.getItem(`saved:${id_str}`) !== null;
}

const origCreateElement = unsafeWindow.document.createElement;
unsafeWindow.document.createElement = <K extends keyof HTMLElementTagNameMap>(name: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K] => {
  let elem = origCreateElement.call(unsafeWindow.document, name, options);
  let tagName = name.toLowerCase();

  if (tagName === 'article') {
      console.log(`call createElement: ${tagName}`);
    elem.style.display = 'block';
    let handler = () => {
      let id: string | undefined = undefined;
      let time = elem.querySelector('a time');
      if (time !== null) {
        id = getId((time.parentNode! as HTMLAnchorElement).href);
      } else {
        id = getId(window.location.href);
      }

      if (id === undefined) {
        return elem;
      }

      let button = document.createElement('button');
      button.innerText = 'save';
      button.style.width = '100%';
      if (getMark(id)) {
        button.style.background = SAVED;
        button.innerText = 'already saved';
      }

      const updateButtonText = (text: string): void => {
        console.log(`update: ${text}`);
        button.innerText = text;
      };

      let total = 0;
      const updateDownloadProgress = (delta: number): void => {
        total += delta;
        updateButtonText(`${total} bytes downloaded`);
      }

      button.addEventListener('click', () => {
        if (id === undefined) {
          console.error('id is undefined');
          return;
        }
        let tweet = load(id);
        console.log(tweet);

        if (tweet !== undefined) {

          save(tweet, updateDownloadProgress, updateButtonText).then(() => {
            mark(tweet!);
            button.style.background = SAVED;
          }).catch((err) => {
            alert(err);
          });
        }
      });

      elem.appendChild(button);
      elem.addEventListener('mouseover', () => {
        button.style.display = 'block';
      });
      elem.addEventListener('mouseleave', () => {
        button.style.display = 'none';
      });
      elem.removeEventListener('mouseover', handler);
    };
    elem.addEventListener('mouseover', handler);
  }

  return elem as HTMLElementTagNameMap[K];
};

xhrHook((xhr: XMLHttpRequest, ...args: any) => {

  const home = new RegExp("^https://twitter[.]com/i/api/2/timeline/home_latest[.]json.*$");
  const all = new RegExp("^https://twitter[.]com/i/api/2/notifications/all[.]json.*$");
  const rux = new RegExp("^https://twitter[.]com/i/api/2/rux[.]json.*$");
  const detail = new RegExp("^https://twitter[.]com/i/api/graphql/[^/]+/TweetDetail.*$");

  let tweets: Tweet[] | undefined;

  if (home.test(xhr.responseURL)) {
    console.log(`home: ${xhr.responseURL}`);
    tweets = xhrParse(JSON.parse(xhr.responseText));
  } else if (all.test(xhr.responseURL)) {
    console.log(`all: ${xhr.responseURL}`);
    tweets = xhrParse(JSON.parse(xhr.responseText));
  } else if (rux.test(xhr.responseURL)) {
    console.log(`rux: ${xhr.responseURL}`);
    tweets = xhrParse(JSON.parse(xhr.responseText));
  } else if (detail.test(xhr.responseURL)) {
    console.log(`detail: ${xhr.responseURL}`);
    tweets = graphParse(JSON.parse(xhr.responseText));
  }

  if (tweets !== undefined) {
    tweets.forEach((tweet) => {
      store(tweet.id_str, tweet);
    });
  }
});


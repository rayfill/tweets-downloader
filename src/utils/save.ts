import type { Tweet, DownloadNotify, ArchiveNotify, OverwriteQueryCallback } from '../types';
import JSZip from 'jszip';
import { GM_fetch } from '../../lib/gm-goodies';
import { toast } from 'react-hot-toast';
import { extension } from './extensions';
import { load } from './local-storage';
import { mark } from './mark';
import { changeColor } from './hooks';

export async function save(
  tweet: Tweet,
  downloadNotify?: DownloadNotify,
  archiveNotify?: ArchiveNotify
): Promise<[Blob, string] | null> {

  try {
    let zip = new JSZip();
    const userId = tweet.user.id_str;
    const tweetId = tweet.id_str;
    const name = tweet.user.name;

    const filename = `${userId}_${tweetId}_${name}.zip`;

    zip.file('tweet.txt', tweet.full_text);
    let index = 0;
    let jobs = tweet.media.map(async (medium): Promise<void> => {

      let url = medium.url;
      if (medium.media_type === 'photo') {
        let ext = extension(medium.url);
        url = url.substring(0, url.length - (ext.length + 1));
        url = `${url}?format=${ext}&name=orig`;
      }

      let previous: number = 0;
      const response = await GM_fetch(url, {
        onDownloadProgress: (ev: { loaded: number }) => {
          let totalInFrame = ev.loaded - previous;
          previous = ev.loaded;
          if (downloadNotify !== undefined) {
            downloadNotify(totalInFrame);
          }
        }
      });
      if (response.ok) {
        zip.file(`${index++}.${extension(medium.url)}`, response.blob());
        return;
      }
      throw new TypeError(response.statusText);
    });

    await Promise.all(jobs);

    const blob = await zip.generateAsync({ type: 'blob' },
      (metadata: { percent: number, currentFile: string | null }) => {
        if (archiveNotify !== undefined) {
          if (metadata.currentFile === null) {
            archiveNotify(`${metadata.percent.toPrecision(5)} %`);
          } else {
            archiveNotify(`${metadata.currentFile}: ${metadata.percent.toPrecision(5)} %`);
          }
        }
      });
    return [blob, filename];
  } catch (e) {
    console.error('failed save tweet', tweet);
    return null;
  }
}

const badChars = /\p{Script_Extensions=Han}|\p{General_Category=Punctuation}|\p{General_Category=Math_Symbol}|\p{General_Category=Symbol}/gu
const invisibleRegex = /[\u200B\u200C\u200D\u00A0\u202F\u2060\u200E\u200F\u2028\u2029]/g;

function replaceBadCharacterForFilename(filename: string): string {

  // :/\?*~|[]()<>!"'#$%&
  // /[:\/\\?*~\|\[\]\(\)\<\>\!\"\'#\$%&]/g
  const replaced = filename.replace(invisibleRegex, '').replace(/[ :\/\\?*~\|\[\]\(\)\<\>\!\"\'#\$%&]/g, '_');//.replace(badChars, '_');
  console.log(`src : ${filename}\ndest: ${replaced}\ndest len: ${replaced.length}`);
  return replaced;
}

export async function downloadNoSaveContents(dir: FileSystemDirectoryHandle, tweetsGenerator: () => Array<string>, callback: OverwriteQueryCallback): Promise<number> {

  let saved = 0;
  try {
    const tweetIds = tweetsGenerator();
    toast.success(`try saving ${tweetIds.length} tweets`);

    const tweets = tweetIds.map(id => load(id)).filter<Tweet>((maybeTweet): maybeTweet is Tweet => {
      return maybeTweet !== undefined;
    });
    console.log('before save');
    const results = (await Promise.all(tweets.map(async (tweet) => {
      const dataOrNull = await save(tweet);
      if (dataOrNull === null) {
        return null;
      }
      return [tweet.id_str, dataOrNull[0], dataOrNull[1]] as [string, Blob, string];
    }))).filter((data): data is [string, Blob, string] => data !== null);
    console.log('after save');
    for (const [tweetId, blob, filename] of results) {
      try {
        const result = await saveOnDirectory(dir, filename, blob, callback);
        if (result) {
          mark(tweetId);
          ++saved;
          const button = document.querySelector(`button[data-type=download][data-tweet-id="${tweetId}"]`) as HTMLButtonElement | null;
          if (button !== null) {
            changeColor(button, true);
          }
        }
      } catch (e) {
	console.log(e);
	if (e instanceof Error && 'stack' in e) {
	  console.log(`stack: ${e.stack}`);
	}
        console.log(`faild save filename: ${filename}`);
        console.log(Array.from(filename));
        console.log(Array.from(filename).map(s => s.codePointAt(0)));
        console.log('NFC');
        console.log(Array.from(filename.normalize('NFC')));
        console.log(Array.from(filename.normalize('NFC')).map(s => s.codePointAt(0)));
        console.log('NFD');
        console.log(Array.from(filename.normalize('NFD')));
        console.log(Array.from(filename.normalize('NFD')).map(s => s.codePointAt(0)));
        console.log('NFKC');
        console.log(Array.from(filename.normalize('NFKC')));
        console.log(Array.from(filename.normalize('NFKC')).map(s => s.codePointAt(0)));
        console.log('NFKD');
        console.log(Array.from(filename.normalize('NFKD')));
        console.log(Array.from(filename.normalize('NFKD')).map(s => s.codePointAt(0)));
        console.error(e);
        throw e;
      }
    }
  } catch (e) {
    toast.error(String(e));
  }
  return saved;
}

export async function fileExists(dir: FileSystemDirectoryHandle, filename: string): Promise<boolean> {
  try {
    await dir.getFileHandle(filename);
    console.debug(`file exists: ${filename}`);
    return true;
  } catch (_) {
    console.debug(`file not exists`);
    return false;
  }
}

function strToUint16Array(str: string) {
  const array: Array<number> = [];
  for (let offset = 0; offset < str.length; ++offset) {
    array.push(str[offset].charCodeAt(0));
  }

  return new Uint16Array(array);
}

export async function saveOnDirectory(
  dir: FileSystemDirectoryHandle,
  originalFilename: string,
  blob: Blob,
  queryCallback: OverwriteQueryCallback
): Promise<boolean> {

  const filename = replaceBadCharacterForFilename(originalFilename.replace(/\.zip$/, '')) + '.zip';
  console.log(`escaped filename: ${filename}`);
  if (await fileExists(dir, filename) && !await queryCallback(filename)) {
    //debugger;
    console.warn(`filename: ${filename} does not saved`);
    console.log(`filename: ${filename}`, strToUint16Array(filename));
    return false;
  }

  const file = await dir.getFileHandle(filename, { create: true });
  const stream = await file.createWritable({ keepExistingData: false });
  try {
    await stream.write(blob);
    toast.success(`${filename} saved`);
    return true;
  } finally {
    await stream.close();
  }
}

export function getLoadedTweets(doc: Document): Map<string, Tweet> {

  const buttons = Array.from(doc.querySelectorAll('button[data-type=download][data-tweet-id]')) as Array<HTMLButtonElement>;
  const tweets = buttons.map((button) => button.dataset.tweetId).map(id => {
    const tweet = load(id!);
    if (tweet === undefined) {
      console.error(`tweet id: ${id} is not cached`);
    }
    return tweet;
  }).filter(tweet => tweet !== undefined) as Array<Tweet>;

  return new Map<string, Tweet>(tweets.map(tweet => [tweet.id_str, tweet]));
}

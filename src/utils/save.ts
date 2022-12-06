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
): Promise<[Blob, string]> {

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
}

function replaceBadCharacterForFilename(filename: string): string {

  // :/\?*~|[]()<>!"'#$%&
  // /[:\/\\?*~\|\[\]\(\)\<\>\!\"\'#\$%&]/g
  return filename.replace(/[:\/\\?*~\|\[\]\(\)\<\>\!\"\'#\$%&]/g, '_');
}

export async function downloadNoSaveContents(dir: FileSystemDirectoryHandle, callback: OverwriteQueryCallback) {

  try {
    //      button.dataset.downloaded = 'false';
    const downloadables = Array.from(document.querySelectorAll('button[data-downloaded=false][data-tweet-id]'));
    console.log('candidates', downloadables.length);

    const tweets: Array<Tweet> = [];
    for (const button of downloadables) {
      const id = (button as HTMLButtonElement).dataset.tweetId!;
      const tweet = load(id);
      if (tweet === undefined) {
        toast.error(`tweet id ${id} does not cached.`);
        continue;
      }
      tweets.push(tweet);
    }
    const results = await Promise.all(tweets.map((tweet) => save(tweet).then(([blob, filename]) => [tweet.id_str, blob, filename] as [string, Blob, string])));
    for await (const [tweetId, blob, filename] of results) {
      const result = await saveOnDirectory(dir, replaceBadCharacterForFilename(filename), blob, callback);
      if (result) {
        mark(tweetId);
        const button = document.querySelector(`button[data-type=download][data-tweet-id="${tweetId}"]`) as HTMLButtonElement | null;
        if (button !== null) {
          changeColor(button, true);
        }
      }
    }

  } catch (e) {
    toast.error(String(e));
  }
}

export async function fileExists(dir: FileSystemDirectoryHandle, filename: string): Promise<boolean> {
  try {
    await dir.getFileHandle(filename);
    return true;
  } catch (_) {
    return false;
  }
}

export async function saveOnDirectory(dir: FileSystemDirectoryHandle, filename: string, blob: Blob, queryCallback: OverwriteQueryCallback): Promise<boolean> {
  if (await fileExists(dir, filename) && !await queryCallback(filename)) {
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
      toast.error(`tweet id: ${id} is not cached`);
    }
    return tweet;
  }).filter(tweet => tweet !== undefined) as Array<Tweet>;

  return new Map<string, Tweet>(tweets.map(tweet => [tweet.id_str, tweet]));
}

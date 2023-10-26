import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useHistoryChange } from '../hooks/use-history-change';
import { useLoadTweets } from '../load-tweets';
import { downloadNoSaveContents } from '../utils/save';
import { scrollBottomTweet } from '../utils/scroll';
import { useDialog } from './dialog';

declare var unsafeWindow: Window & {
  showDirectoryPicker: (options: { mode: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
};

export function App(_: {}) {

  const [directory, setDirectory] = useState<FileSystemDirectoryHandle>();
  const loadDirectory = useCallback(async () => {
    try {
      const directoryHandle = await unsafeWindow.showDirectoryPicker({ mode: 'readwrite' });
      setDirectory(directoryHandle);
    } catch (e) {
      console.log('caught error', e);
      toast.error('error');
      toast.error(String(e));
    }
  }, [setDirectory]);

  const dialog = useDialog(257);
  const allOverwrite = useRef<boolean | undefined>();
  const saveAction = useCallback(async (getTweets: () => Array<string>) => {
    try {
      const checkOverwrite = (filename: string) => new Promise<boolean>((resolve) => {
        if (allOverwrite.current !== undefined) {
          return resolve(allOverwrite.current);
        }
        dialog.showModal(<div className='flex flex-col bg-white'>
          <div className='bg-white'>file "{filename}" overwrite?</div>
          <div className='flex flex-row bg-white justify-center'>
            <div className='select-none bg-slate-50 border-2 border-black rounded-lg'
              onClick={() => {
                dialog.close();
                resolve(true);
              }}>上書き</div>
            <div className='select-none bg-slate-50 border-2 border-black rounded-lg'
              onClick={() => {
                dialog.close();
                allOverwrite.current = true;
                resolve(true);
              }}>すべて上書き</div>
            <div className='select-none bg-slate-50 border-2 border-black rounded-lg'
              onClick={() => {
                dialog.close();
                resolve(false);
              }}>無視</div>
            <div className='select-none bg-slate-50 border-2 border-black rounded-lg'
              onClick={() => {
                dialog.close();
                allOverwrite.current = false;
                resolve(true);
              }}>すべて無視</div>
          </div>
        </div>);
      });
      //const tweets = getLoadedTweets(unsafeWindow.document);
      const saved = await downloadNoSaveContents(directory!, getTweets, checkOverwrite);
      if (saved === 0) {
        scrollBottomTweet();
        toast.success('load next tweets');
      } else {
        toast.success('save tweets');
      }

    } catch (e) {
      toast.error(String(e));
    }
  }, [directory, dialog]);

  const historyChange = useHistoryChange();
  const [getTweets, clearTweets] = useLoadTweets();
  useEffect(() => {
    if (historyChange !== null) {

      return historyChange.subscribe(_msg => {
        console.log(`page changed: ${_msg}`);
        clearTweets();
      }).unsubscribe;
    }
  }, [historyChange]);

  return <><div
    className='rounded-full m-2 box-border bg-white text-black select-none text-center border-2'
    onClick={() => {
      console.log('directory', directory);
      if (directory === undefined) {
        loadDirectory();
      } else {
        saveAction(getTweets);
    }}}
  >{directory === undefined ? '保存ディレクトリの設定' : 'ロード済みツイートの保存'}</div></>;
}

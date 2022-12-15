import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { downloadNoSaveContents, getLoadedTweets, save, } from '../utils/save';
import { scrollBottomTweet } from '../utils/scroll';
import { useDialog } from './dialog';

declare var unsafeWindow: Window & {
  showDirectoryPicker: (options: { mode: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
};

export function App({}: {}) {

  const [directory, setDirectory] = useState<FileSystemDirectoryHandle>();
  const loadDirectory = useCallback(async () => {
    try {
      console.log('loadDirectory');
      const directoryHandle = await unsafeWindow.showDirectoryPicker({ mode: 'readwrite' });
      setDirectory(directoryHandle);
      console.log('save directory');
    } catch (e) {
      console.log('caught error', e);
      toast.error('error');
      toast.error(String(e));
    }
  }, [setDirectory]);

  const dialog = useDialog(257);
  const saveAction = useCallback(async () => {
    try {
      const checkOverwrite = (filename: string) => new Promise<boolean>((resolve) => {
        dialog.showModal(<div className='flex flex-col bg-white'>
          <div className='bg-white'>file "{filename}" overwrite?</div>
          <div className='flex flex-row bg-white justify-around'>
            <div className='select-none bg-slate-50 border-2 border-black rounded-lg'
              onClick={() => {
                dialog.close();
                resolve(true);
              }}>yes</div>
            <div className='select-none bg-slate-50 border-2 border-black rounded-lg'
              onClick={() => {
                dialog.close();
                resolve(false);
              }}>no</div>
          </div>
        </div>);
      });
      const tweets = getLoadedTweets(unsafeWindow.document);

      console.log('tweets', tweets);
      const saved = await downloadNoSaveContents(directory!, checkOverwrite);
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

  console.log('current directory', directory);

  return <><div
    className='rounded-full bg-white select-none text-center border-2'
    onClick={() => {
      console.log('directory', directory);
      if (directory === undefined) {
        loadDirectory();
      } else {
        saveAction();
    }}}
  >{directory === undefined ? '保存ディレクトリの設定' : 'ロード済みツイートの保存'}</div></>;
}

import { createRoot } from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import { Toaster } from 'react-hot-toast';
import { App } from './components/app';
import { Dialog } from './components/dialog';
import { getLoadTweetNotifier, LoadTweetsContext } from './load-tweets';

import { createElementHook } from './utils/hooks';

import './index.css';

declare var unsafeWindow: Window;
declare var window: Window;

const subject = getLoadTweetNotifier();
unsafeWindow.document.createElement = createElementHook(unsafeWindow.document.createElement, unsafeWindow.document, subject);



window.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('DOMContent loaded');

    const div = unsafeWindow.document.createElement('div');
    div.id = 'extension';
    div.innerText = 'batch download';
    div.className = 'bg-white fixed top-16 right-16 z-10 min-w-20 min-h-3'
    unsafeWindow.document.body.appendChild(div);

    const root = createRoot(div);
    root.render(
      <LoadTweetsContext>
        <RecoilRoot>
          <Toaster position='top-left' />
          <Dialog dialogId={257} />
          <App />
        </RecoilRoot>
      </LoadTweetsContext>
    );
  } catch (e) {
    console.error(e);
  }
});

import { registerXHRHook } from './utils/hooks';

registerXHRHook();


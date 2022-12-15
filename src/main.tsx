import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { RecoilRoot } from 'recoil';

import { App } from './components/app';
import { Dialog } from './components/dialog';

import { createElementHook } from './utils/hooks';
import './index.css';

declare var unsafeWindow: Window;
declare var window: Window;

unsafeWindow.document.createElement = createElementHook(unsafeWindow.document.createElement, unsafeWindow.document);

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContent loaded');

  const div = unsafeWindow.document.createElement('div');
  div.id = 'extension';
  div.innerText = 'batch download';
  div.className = 'bg-white fixed top-16 right-16 z-10 min-w-20 min-h-3'
  unsafeWindow.document.body.appendChild(div);

  const root = createRoot(div);
  root.render(<RecoilRoot>
    <Toaster position='top-center' />
    <Dialog dialogId={257} />
    <App />
  </RecoilRoot>);
});

import { registerXHRHook } from './utils/hooks';

registerXHRHook();


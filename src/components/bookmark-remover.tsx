import { useReducer, useEffect } from 'react';


function mutationCollector(root: Element): AsyncIterable<HTMLButtonElement> {

  const elements: Array<HTMLButtonElement> = [];
  const awake: Array<() => void> = [];
  function wake() {
    awake.forEach((waker) => waker());
    awake.length = 0;
  }
  const callback: MutationCallback = (mutations: MutationRecord[], _observer: MutationObserver): void => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node: Node) => {
	if (node instanceof HTMLButtonElement &&
	  node.ariaLabel?.startsWith('ブックマークに追加済み')) {
	    elements.push(node);
	    wake();
	}
      });
    }
  };
  const observer = new MutationObserver(callback);

  const asyncIterator: AsyncIterator<HTMLButtonElement> = {

    async next(..._args: [] | [undefined]): Promise<IteratorResult<HTMLButtonElement, any>> {
      if (elements.length > 0) {
	return { done: false, value: elements.shift()! };
      }
      await new Promise<void>((resolve) => {
	awake.push(resolve);
      });
      return this.next();
    }
  };

  observer.observe(root, { childList: true, subtree: true });

  return { [Symbol.asyncIterator]() { return asyncIterator; } };
}

function getBookmarkedButtons(root: Element) {
  return Array.from(root.querySelectorAll('button[aria-label="ブックマークに追加済み"]')) as Array<HTMLButtonElement>;
}

type ActionType = {
  action: 'add';
  elements: Array<HTMLButtonElement>;
} | {
  action: 'clear';
};
export function BookmarkRemover() {

  const [enabled, toggle] = useReducer((state: boolean) => !state, false);
  const [autoRemoveBookmarkEnabled, toggleAutoRemoveBookmark] = useReducer((state: boolean) => !state, false);

  const [buttons, action] = useReducer((state: Set<HTMLButtonElement>, action: ActionType): Set<HTMLButtonElement> => {
    switch (action.action) {
      case 'add': {
	const newState = new Set(state.values());
	action.elements.forEach((element) => {
	  newState.add(element);
	});
	return newState;
      }
      case 'clear':
	return new Set();
    }
  }, new Set<HTMLButtonElement>());

  useEffect(() => {
    if (autoRemoveBookmarkEnabled && buttons.size > 0) {
      console.log('ブックマーク自動削除', buttons.size);
      buttons.forEach((button) => {
	if (button.isConnected) {
	  button.click();
	}
      });
      action({ action: 'clear' });
    }
  }, [autoRemoveBookmarkEnabled, buttons]);

  useEffect(() => {
    if (enabled) {
      console.log('button列挙開始');
      const f = async (abortSignal: AbortSignal) => {
	for (;;) {
	  if (abortSignal.aborted) {
	    break;
	  }
	  await new Promise<void>((resolve) => {
	    setTimeout(() => resolve(), 1000);
	  });
	  const maybeDiv = document.querySelector('div[aria-label="タイムライン: ブックマーク"]');
	  if (maybeDiv === null) {
	    continue;
	  }
	  const buttons = getBookmarkedButtons(maybeDiv);
	  console.log('buttons追加', buttons.length);
	  action({ action: 'add', elements: buttons });
	}
      };
      const abortController = new AbortController();
      f(abortController.signal).catch(console.error);
      return () => { abortController.abort(); console.log('button列挙中断'); };
    }
  }, [enabled]);

  return (
    <>
      <div
	className='rounded-full m-2 box-border bg-white text-black select-none text-center border-2'
	onClick={() => toggle()}>{
	enabled ? 'ブックマーク済みツイートの収集中' : 'ブックマーク済みツイートの収集を開始する'
	}
      </div>
      <div
	className='rounded-full m-2 box-border bg-white text-black select-none text-center border-2'
	onClick={() => toggleAutoRemoveBookmark()}>{
	autoRemoveBookmarkEnabled ? '収集されたブックマークの自動削除中' : '収集されたブックマークを自動的に削除する'
	}
      </div>
    </>
  );
}

import { useEffect, useReducer } from 'react';
import { scrollBottomTweet } from '../utils/scroll';

export function AutoScroll() {

  const [autoScrollEnabled, toggle] = useReducer((prev: boolean): boolean => {
    return !prev;
  }, false);

  useEffect(() => {
    if (autoScrollEnabled) {
      let beforeScrollY: number | undefined = undefined;
      let sameCount = 0;
      const id = setInterval(() => {
	if (beforeScrollY === window.scrollY) {
	  ++sameCount;
	  if (sameCount > 10) {
	    toggle();
	  }
	} else {
	  sameCount = 0;
	}
	scrollBottomTweet();
	beforeScrollY = window.scrollY;
      }, 500);
      return () => clearInterval(id);
    }
  }, [autoScrollEnabled]);

  const message = autoScrollEnabled ? '自動スクロール中(クリックで停止)' : '自動スクロール開始';
  return <div className='rounded-full m-2 box-border bg-white text-black select-none text-center border-2'><button onClick={toggle}>{message}</button></div>;
}

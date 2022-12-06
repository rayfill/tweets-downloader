export type Subscriber<T> = (data: T) => unknown;

export class Observable<T> {

  private subscribers: Set<Subscriber<T>> = new Set();

  costructor() {
  }

  subscribe(subscriber: Subscriber<T>): void {
    this.subscribers.add(subscriber);
  }

  unsubscribe(subscriber: Subscriber<T>): void {
    this.subscribers.delete(subscriber);
  }

  publish(value: T): void {
    for (const subscriber of this.subscribers.values()) {
      try {
        const maybePromise = subscriber(value);
        if (maybePromise instanceof Promise) {
          const warnHandler = () => {
            console.warn('return promise when notify subscriber. maybe subscribe async function?');
          };
          Promise.all([maybePromise]).then(warnHandler, warnHandler);
        }
      } catch (_e) {
        console.warn('raise error on notify subscriber', _e);
      }
    }
  }
}

/* eslint-disable dot-notation */
import { IObjectDidChange, makeAutoObservable, observe, toJS } from 'mobx';

export abstract class ObservableNotifycation<T> {
  abstract key: string;
  abstract type: string;
  abstract payload: T;
  abstract state: T;
}

export abstract class Observable<T> {
  abstract key: string;
  abstract state: T;
  abstract set(value: T): void;
}

export function createObservable<T>({ key, initialValue }: { key: string; initialValue: T }): Observable<T> {
  const observable = makeAutoObservable({
    key,
    state: initialValue,
    set(value: T) {
      this.state = value;
    },
  });
  return observable;
}

export const subscribe = <T>(observable: Observable<T>, fun: (args: ObservableNotifycation<T>) => void) => {
  observe(observable, (change: IObjectDidChange) => {
    if (change.type === 'update') {
      const { newEvent, oldState }: { newEvent: T; oldState: T } = {
        newEvent: change?.newValue,
        oldState: change?.oldValue,
      };
      fun({
        key: change.object['key'],
        type: change.type,
        payload: newEvent,
        state: toJS(newEvent),
      });
    }
  });
};

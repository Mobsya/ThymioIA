/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Inject, Injection } from '../types';

export const inject = ({ key, predicate }: Inject) => {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const keyInject: string = key;
    const injection: Injection = {
      index: parameterIndex,
      key: keyInject,
      predicate,
    };
    const existingInjections: Injection[] = target.injections || [];
    // create property 'injections' holding all constructor parameters, which should be injected
    Object.defineProperty(target, 'injections', {
      enumerable: false,
      configurable: true,
      writable: false,
      value: [...existingInjections, injection],
    });
  };
};

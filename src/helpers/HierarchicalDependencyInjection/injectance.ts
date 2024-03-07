/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-shadow */

import type { Injection, LayerOption, Predicate, Role } from '../types';

import { Container } from './container';

export const injectance = (constructor: any, options: LayerOption, role: Role, roles: Role[]) => {
  // replacing the original constructor with a new one that provides the injections from the Container
  ((constructor: any) => {
    const key: string = options.key;
    const predicate: Predicate = options?.predicate ?? [];
    const name = constructor.prototype.constructor.name;
    const maskConstructor: ObjectConstructor = constructor;
    Container.addInjectable({
      key,
      name,
      role,
      predicate,
      constructor: maskConstructor,
    });
  })(constructor);

  return class extends constructor {
    constructor(...args: any[]) {

      // get injections from class; previously created by @inject()
      const injections = constructor.injections as Injection[];
      const injectedArgs: any[] =
        injections?.map(({ key, predicate = options?.predicate ?? [] }) => {
          const injectable = roles.reduce((acc: unknown, role: Role) => {
            if (!acc) {
              const store = Container.get(role, key, predicate);
              if (store) {
                return store;
              }
            }

            return acc;
          }, undefined);

          if (injectable) {
            return injectable;
          }
          console.error(`injection ${key} not exist with predicate ${predicate?.join(',')}`);
          return [];
        }) ?? [];
      // call original constructor with injected arguments
      super(...injectedArgs, ...args);
    }
  };
};

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Injectable, Injectables, InjectedInstance, Instantiated, Predicate, Role } from '../types';
import { samePredicate } from '../utils';

export class Container {
  static instantiated: Instantiated = {
    BOUNDED_CONTEXT: new Map(),
    SERVICE: new Map(),
    STORE: new Map(),
    ACTOR: new Map(),
  };

  static injectables: Injectables = {
    BOUNDED_CONTEXT: new Map(),
    SERVICE: new Map(),
    STORE: new Map(),
    ACTOR: new Map(),
  };

  static instantiatedSingleton = () => {
    return this.instantiated;
  };

  static instantiates = () => {
    return this.injectables;
  };

  static addInjectable = (injectable: Injectable) => {
    const role = injectable.role;
    const key = injectable.key;

    if (!Container.injectables[role].get(key)) {
      Container.injectables[role].set(key, []);
    }

    Container.injectables[role].get(key)?.push(injectable);
  };

  static factoryFromInjectable = <T>(role: Role, key: string, predicate: Predicate, args?: Object): T | undefined => {
    const injectable = Container.injectables[role].get(key)?.find((i) => samePredicate(i.predicate, predicate));

    if (!injectable) {
      console.error(`No injectable found for ${role} ${key} with predicate ${predicate} because it is not registered`);

      throw new Error(
        `No injectable found for ${role} ${key} with predicate ${predicate} because it is not registered`,
      );
    }

    const newObject = new injectable.constructor(args);
    const newObjectCasted: T = newObject as T;
    return newObjectCasted;
  };

  static instantiateInjectable = (injectable: Injectable, args?: Object) => {
    try {
      const { role, key } = injectable;
      const instances = Container.instantiated[role].get(key);
      const alreadyExists = instances?.find(({ predicate = [] }) => samePredicate(predicate, injectable.predicate));

      if (alreadyExists) {
        return alreadyExists.instance;
      }

      if (!instances) {
        const injectableInstance: InjectedInstance = {
          predicate: injectable.predicate,
          instance: new injectable.constructor(args),
        };

        Container.instantiated[role].set(key, [injectableInstance]);
        return injectableInstance.instance;
      }

      const injectableInstance: InjectedInstance = {
        predicate: injectable.predicate,
        instance: new injectable.constructor(args),
      };

      Container.instantiated[role].get(key)?.push(injectableInstance);
      return injectableInstance.instance;
    } catch (err: unknown) {
      throw new Error(`Error instantiating a ${injectable.role} object of ${injectable.key}: ${JSON.stringify(err)}`);
    }
  };

  static get = (role: Role, key: string, abictraryPredicate: Predicate = [], args?: Object): any => {
    try {
      const instances = Container.instantiated[role].get(key);
      const alreadyExists = instances?.find(({ predicate = [] }) => samePredicate(predicate, abictraryPredicate));

      if (alreadyExists) {
        return alreadyExists.instance;
      }

      const injectable: Injectable | undefined = Container.injectables[role]
        .get(key)
        ?.find(({ predicate = [] }) => samePredicate(predicate, abictraryPredicate));

      if (injectable) {
        return Container.instantiateInjectable(injectable, args);
      }

      return undefined;
    } catch (err) {
      throw new Error(`${err}`);
    }
  };
}

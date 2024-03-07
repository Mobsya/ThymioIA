/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { LayerOption, Role } from '../types';

import { injectance } from './injectance';

export const Actor = (options: LayerOption) => {
  const role: Role = 'ACTOR';
  const roles: Role[] = ['BOUNDED_CONTEXT'];

  return <T extends { new (...args: any[]): {} }>(
    constructor: T,
    propertyKey?: any,
    descriptor?: any,
    ...argd: any[]
  ): T | void | any => injectance(constructor, options, role, roles);
};

export const BoundedContext = (options: LayerOption) => {
  const role: Role = 'BOUNDED_CONTEXT';
  const roles: Role[] = ['SERVICE', 'STORE'];

  return <T extends { new (...args: any[]): {} }>(
    constructor: T,
    propertyKey?: any,
    descriptor?: any,
    ...argd: any[]
  ): T | void | any => injectance(constructor, options, role, roles);
};

export const Service = (options: LayerOption) => {
  const role: Role = 'SERVICE';
  const roles: Role[] = ['SERVICE', 'STORE'];

  return <T extends { new (...args: any[]): {} }>(
    constructor: T,
    propertyKey?: any,
    descriptor?: any,
    ...argd: any[]
  ): T | void | any => injectance(constructor, options, role, roles);
};

export const Store = (options: LayerOption) => {
  const role: Role = 'STORE';
  const roles: Role[] = ['STORE'];

  return <T extends { new (...args: any[]): {} }>(
    constructor: T,
    propertyKey?: any,
    descriptor?: any,
    ...argd: any[]
  ): T | void | any => injectance(constructor, options, role, roles);
};

export type Role = 'ACTOR' | 'BOUNDED_CONTEXT' | 'SERVICE' | 'STORE';
export type Predicate = Array<string>;

export abstract class InjectedInstance {
  abstract predicate: Predicate;
  abstract instance: unknown;
}

export interface Injection {
  index: number;
  key: string;
  predicate?: Predicate;
}

export abstract class Inject {
  abstract key: string;
  abstract predicate?: Predicate;
}

export type Injectable = {
  key: string;
  name: string;
  role: Role;
  predicate: Predicate;
  constructor: ObjectConstructor;
};

export abstract class Injectables {
  abstract ACTOR: Map<string, Injectable[]>;
  abstract BOUNDED_CONTEXT: Map<string, Injectable[]>;
  abstract SERVICE: Map<string, Injectable[]>;
  abstract STORE: Map<string, Injectable[]>;
}

export abstract class Instantiated {
  abstract ACTOR: Map<string, InjectedInstance[]>;
  abstract BOUNDED_CONTEXT: Map<string, InjectedInstance[]>;
  abstract SERVICE: Map<string, InjectedInstance[]>;
  abstract STORE: Map<string, InjectedInstance[]>;
}

export abstract class LayerOption {
  abstract key: string;
  abstract predicate?: Predicate;
}

export type Args = {
  [x: string]: unknown | (() => unknown);
};

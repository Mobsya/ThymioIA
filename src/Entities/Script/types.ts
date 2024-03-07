import { Observable } from '../../helpers';

/**
 * @class
 */

export abstract class Code {
  abstract value: string;
}

/**
 * @interfaces
 */

export interface Script {
  code: Observable<Code>;
  history: Code[];
  onChange: (args: any) => void;
  send: (code: Code) => void;
}

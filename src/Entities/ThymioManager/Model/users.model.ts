import { Observable } from '../../../helpers';
import { DataEntry } from './thymioIA.model';

export type UsersType = 'AllUser' | 'Teacher' | 'Student' | 'Admin' | 'Dev';

export interface Users {
  captors: Observable<{ [uuid: string]: number[] }>;
  predict: (uuid: string, input: string[]) => void;
  trainModel: (data: DataEntry[]) => Promise<void>;
  getRobotsUuids: () => Promise<string[]>;
  takeControl: (uuid: string, onVariableChange?: (uuid: string, variables: { [name: string]: number }) => void) => void;
  emitAction: (uuid: string, action: string, args: number[]) => Promise<void>;
  emitMotorEvent: (uuid: string, action: string) => Promise<void>;
}

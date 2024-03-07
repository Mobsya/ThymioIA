import { Observable } from '../../../helpers';

export interface DataEntry {
  input: string[];
  output: string;
}

interface IThymioIA {
  captors: Observable<{ [uuid: string]: number[] }>;
  getRobotsUuids: () => Promise<string[]>;
  takeControl: (uuid: string, onVariableChange?: (uuid: string, variables: { [name: string]: number }) => void) => void;
  predict: (uuid: string, input: string[]) => void;
  trainModel: (data: DataEntry[]) => Promise<void>;
  emitAction: (uuid: string, action: string, args: number[]) => Promise<void>;
  emitMotorEvent: (uuid: string, action: string) => Promise<void>;
}

export default IThymioIA;

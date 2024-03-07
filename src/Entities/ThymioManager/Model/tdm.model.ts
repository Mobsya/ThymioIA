export interface TdmController {
  getRobotsUuids: () => Promise<string[]>;
  takeControl: (uuid: string, onVariableChange: (uuid: string, variables: { [name: string]: number }) => void) => void;
  emitAction: (uuid: string, action: string, args: number[]) => Promise<void>;
}

export interface TdmClient {
  connectToTDM: () => void;
  getThymioList: () => string[];
  takeControl: (uuid: string, onVariableChange: (uuid: string, variables: { [name: string]: number }) => void) => void;
  emitAction: (uuid: string, action: string, args: number[]) => Promise<void>;
}

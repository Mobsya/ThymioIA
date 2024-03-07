/**
 * @types
 */

// thymio types
export type ThymioType = 'thymio2' | 'thymio3' | 'thymioExtension';

// connection modes
export type Wifi = 'mqtt' | 'websocket';
export type Bluetooth = 'bluetooth';
export type Usb = 'usb';
export type Dongle = 'dongle';
export type ConnectionModes = Wifi | Bluetooth | Usb | Dongle;

export type ConnectionParams = {
  topic?: string;
  host?: string;
  token?: string;
  path?: string;
  address?: string;
  channel?: string;
};

export type ThymioPorts = {
  [key in ConnectionModes]?: ConnectionParams;
};

export type ThymioStatus = 'unknown' | 'connected' | 'available' | 'busy' | 'ready' | 'disconnected';

/**
 * @interfaces
 */

export type ThymioNode = {
  uuid: string;
  name: string;
  type: ThymioType;
  status: ThymioStatus;
};

export interface Thymio {
  uuid: string;
  name: string;
  type: ThymioType;
  status: ThymioStatus;
  initialize: () => Promise<void>;
  onStatusChanged: (callback: (robot: Robot) => void) => void;
  onVariableChange: (callback: (variables: { [name: string]: number }) => void) => void;
  emitAction: (action: string, args: number[], compt?: number) => Promise<void>;
}

export interface Robot {
  uuid: string;
  name: string;
  type: ThymioType;
  status: ThymioStatus;
}

/**
 * @constants
 */

export const aceptedThymioTypes: ThymioType[] = ['thymio2', 'thymio3', 'thymioExtension'];
export const acceptedThymioConnectionModes: ConnectionModes[] = ['usb', 'dongle', 'mqtt', 'bluetooth', 'websocket'];

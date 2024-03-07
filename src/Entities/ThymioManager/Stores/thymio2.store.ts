import type { Events, INode } from '@mobsya-association/thymio-api';
import { Store } from '../../../helpers';
import { ThymioStatus, Thymio, ThymioType, Robot } from '../Model/thymio.model';
import { mobsya } from '@mobsya-association/thymio-api/dist/thymio_generated';
import { asebaScript, eventsDefinition } from './aesl.resource';

type Queque = {
  action: string;
  args: any;
  at: Date;
  ack: boolean;
  i: number;
};

@Store({ key: 'Thymio Store', predicate: ['thymio2', 'eventVariable'] })
export class Thymio2EventVariable implements Thymio {
  connected = 0;
  VMIN = -400;
  VMAX = 400;
  LMIN = 0;
  LMAX = 32;
  eventCompleteCallback: any = false;
  _leds = [0, 0, 0];
  _dial = -1;

  tap = false;
  noise = false;
  useHorizontalLeds = false;

  whenButtonCenter = false;
  whenButtonForward = false;
  whenButtonBackward = false;
  whenButtonLeft = false;
  whenButtonRight = false;

  prox_horizontal = [0, 0, 0, 0, 0, 0, 0];
  prox_ground_delta = [0, 0];
  distance_front = 0;
  distance_back = 0;
  angle_front = 0;
  angle_back = 0;
  angle_ground = 0;
  odo_x = 0;
  odo_y = 0;
  odo_degree = 0;
  mic_intensity = 0;
  last_mic_detect = new Date();
  motor_left_speed = 0;
  motor_right_speed = 0;
  prox_comm_rx = 0;
  button_center = 0;
  button_forward = 0;
  button_backward = 0;
  button_left = 0;
  button_right = 0;
  lastEmit = new Date();

  compt = 0;
  queque: Queque[] = [];

  thymioid: number | null = null;
  motorsON = false;

  private lastEventTime: Date = new Date(0);
  private eventCooldown: number = 800;
  private lastTapTime: Date = new Date(0); // Para priorizar el tap sobre el clap
  private tapPriorityWindow: number = 1300; // Ventana de tiempo en milisegundos en la que el tap tiene prioridad

  uuid: string;
  type: ThymioType = 'thymio2';
  name: string;
  status: ThymioStatus = 'unknown';
  node: INode;
  variables = {};

  statusCallback: (robot: Robot) => void = () => {};
  eventCallback: (vars: { [name: string]: number }) => void = () => {};

  constructor({ uuid, node }: { uuid: string; node: INode }) {
    this.uuid = uuid;
    this.name = node.name;
    this.node = node;
    this.status = mobsya.fb.NodeStatus[node.status] as ThymioStatus;

    node.onStatusChanged = this.onInternalStatusChanged;
    node.onEvents = this.onEventReceived;

    // this.initializeNode();
  }

  initialize = async () => {
    try {
      await this.node.lock();
      await this.node.setEventsDescriptions(eventsDefinition);
      await this.node.sendAsebaProgram(asebaScript, false);
      await this.node.runProgram();
      await this.emitAction('Inizializer');
      this.last_mic_detect = new Date();
    } catch (error) {
      console.error('Error during node initialization', error);
    }
  };

  onInternalStatusChanged = (newStatus: number) => {
    this.status = mobsya.fb.NodeStatus[newStatus] as ThymioStatus;
    this.statusCallback({ uuid: this.uuid, name: this.name, type: this.type, status: this.status });
  };

  onStatusChanged = (callback: (robot: Robot) => void) => {
    this.statusCallback = callback;
  };

  onVariableChange = (callback: (variables: { [name: string]: number }) => void) => {
    this.eventCallback = callback;
  };

  private onEventReceived = (events: Events) => {
    if (events) {
      events.forEach((value, evt) => {
        switch (evt) {
          case 'ACK':
            this.handleAckEvent(value);
            break;
          case 'ThymioId':
            this.handleThymioIdEvent(value);
            break;
          case 'B_center':
          case 'B_forward':
          case 'B_backward':
          case 'B_left':
          case 'B_right':
            this.handleButtonEvent(evt);
            break;
          case 'Prox':
            this.handleProxEvent(value);
            break;
          case 'Ground':
            this.handleGroundEvent(value);
            break;
          case 'Odometer':
            this.handleOdometerEvent(value);
            break;
          case 'Acc_tap':
            this.handleAccTapEvent(value);
            break;
          case 'A_noise_detect':
            this.handleNoiseDetectEvent(value);
            break;
          default:
            console.log(`Unhandled event: ${evt}`);
        }
      });

      // callback to notify the events
      if (typeof this.eventCompleteCallback === 'function') {
        this.eventCompleteCallback(events);
      }
    }
  };

  private handleAckEvent = (value: number[]) => {
    const diffTemp = new Date().getTime() - this.lastEmit.getTime();

    // remove from queque the value of the ACK
    const tempQueque = this.queque
      .filter(item => item.ack === true)
      .map(item => {
        if (item.i === value[1]) {
          return { ...item, ack: true };
        }
        return item;
      });

    console.log(`ACK ${value[1]} diff=${diffTemp}`);
    this.queque = tempQueque;
  };

  private handleThymioIdEvent = (value: number[]) => {
    const id = Array.isArray(value) ? value[0] : value;
    this.queque = [];
    this.thymioid = id;
    this.verifyQueque();
    this.eventCallback({ thymioid: id });
    console.log('ThymioId', id);
    this.emitAction('M_motors', [0, 0], 1);
  };

  private handleButtonEvent = (evt: string) => {
    const button = evt.replace('B_', '');
    (this as any)[`whenButton${button}`] = true;

    if (evt === 'B_center') {
      this.eventCallback({ button_center: 1 });
    } else if (evt === 'B_forward') {
      this.eventCallback({ button_forward: 1 });
    } else if (evt === 'B_backward') {
      this.eventCallback({ button_backward: 1 });
    } else if (evt === 'B_left') {
      this.eventCallback({ button_left: 1 });
    } else if (evt === 'B_right') {
      this.eventCallback({ button_right: 1 });
    }

    this.last_mic_detect = new Date();
  };

  private handleProxEvent = (value: number[]) => {
    const id = Array.isArray(value) ? value[0] : value;
    if (id === this.thymioid) {
      // evalua y detecta cual fue el sensor que cambio de valor

      let captors = {};

      if (this.prox_horizontal[0] !== value[1]) {
        captors = { ...captors, prox_front_0: value[1] };
      }

      if (this.prox_horizontal[1] !== value[2]) {
        captors = { ...captors, prox_front_1: value[2] };
      }

      if (this.prox_horizontal[2] !== value[3]) {
        captors = { ...captors, prox_front_2: value[3] };
      }

      if (this.prox_horizontal[3] !== value[4]) {
        captors = { ...captors, prox_front_3: value[4] };
      }

      if (this.prox_horizontal[4] !== value[5]) {
        captors = { ...captors, prox_front_4: value[5] };
      }

      if (this.prox_horizontal[5] !== value[6]) {
        captors = { ...captors, prox_back_0: value[6] };
      }

      if (this.prox_horizontal[6] !== value[7]) {
        captors = { ...captors, prox_back_1: value[7] };
      }

      if (Object.keys(captors).length > 0) {
        this.eventCallback(captors);
      }

      this.prox_horizontal = [value[1], value[2], value[3], value[4], value[5], value[6], value[7]];

      if (this.distance_front !== value[8]) {
        // this.eventCallback('distance_front', value[8]);
        this.distance_front = value[8];
      }

      if (this.distance_back !== value[9]) {
        // this.eventCallback('distance_back', value[9]);
        this.distance_back = value[9];
      }

      if (this.angle_front !== value[10]) {
        // this.eventCallback('angle_front', value[10]);
        this.angle_front = value[10];
      }

      if (this.angle_back !== value[11]) {
        // this.eventCallback('angle_back', value[11]);
        this.angle_back = value[11];
      }

      if (this.angle_ground !== value[12]) {
        // this.eventCallback('angle_ground', value[12]);
        this.angle_ground = value[12];
      }

      this.last_mic_detect = new Date();
    }
  };

  private handleGroundEvent = (value: number[]) => {
    const id = Array.isArray(value) ? value[0] : value;
    if (id === this.thymioid) {
      let captors = {};
      if (this.prox_ground_delta[0] !== value[1]) {
        captors = { ...captors, prox_ground_0: value[1] };
      }

      if (this.prox_ground_delta[1] !== value[2]) {
        captors = { ...captors, prox_ground_1: value[2] };
      }

      if (Object.keys(captors).length > 0) {
        this.eventCallback(captors);
      }

      this.prox_ground_delta = [value[1], value[2]];
      this.last_mic_detect = new Date();
    }
  };

  private handleOdometerEvent = (value: number[]) => {
    const id = Array.isArray(value) ? value[0] : value;
    if (id === this.thymioid) {
      this.odo_x = value[1];
      this.odo_y = value[2];
      this.odo_degree = value[3];

      if (this.motor_left_speed !== value[4]) {
        this.eventCallback({ motor_left_speed: value[4] });
        this.motor_left_speed = value[4];
      }

      if (this.motor_right_speed !== value[5]) {
        this.eventCallback({ motor_right_speed: value[5] });
        this.motor_right_speed = value[5];
      }

      if (this.prox_comm_rx !== value[6]) {
        this.eventCallback({ prox_comm_rx: value[6] });
        this.prox_comm_rx = value[6];
      }

      this.last_mic_detect = new Date();
    }
  };

  private handleAccTapEvent = (value: number[]) => {
    const now = new Date();
    // No se necesita comprobar el cooldown para tap, ya que tiene la máxima prioridad
    const id = Array.isArray(value) ? value[0] : value;
    if (id === this.thymioid) {
      this.tap = true;
      this.eventCallback({ tap: 1 });

      this.lastEventTime = now; // Actualizar el timestamp del último evento
      this.lastTapTime = now; // Registrar el momento del tap para priorizarlo sobre clap
    }
  };

  private handleNoiseDetectEvent = (value: number[]) => {
    const now = new Date();
    if (now.getTime() - this.lastEventTime.getTime() < this.eventCooldown) {
      return;
    } // En cooldown, ignora el evento

    // Verificar si ha pasado suficiente tiempo desde el último tap para procesar un clap
    if (now.getTime() - this.lastTapTime.getTime() < this.tapPriorityWindow) {
      return;
    }

    const id = Array.isArray(value) ? value[0] : value;
    if (id === this.thymioid && value[1] !== 0) {
      this.noise = true;
      this.eventCallback({ clap: 1 });

      this.lastEventTime = now; // Actualizar el timestamp del último evento
    }
  };

  private verifyQueque = () => {
    setInterval(() => {
      if (this.queque.length > 0) {
        this.queque.forEach(item => {
          if (!item.ack && new Date().getTime() - (item.at instanceof Date ? item.at.getTime() : item.at) > 70) {
            this.emitAction(item.action, item.args, item.i);
          }
        });
      }
    }, 15);
  };

  emitAction = async (action: string, originalArgs: number[] = [], compt?: number) => {
    if (!this.node) {
      console.warn(`Node not available for emit ${action}`);
      return;
    }

    const id = this.thymioid ?? 0;
    const args = [id, compt ?? this.compt, ...originalArgs.map(Math.round)];

    try {
      await this.node.emitEvents(action, args);
      console.log(`EMIT: ${action}`, args);
    } catch (error) {
      console.error(`Error trying to emit ${action}`, error);
    } finally {
      this.lastEmit = new Date();
      if (compt === undefined) {
        this.queque.push({ i: this.compt, action, args: originalArgs, at: this.lastEmit, ack: false });
        this.compt = this.compt >= 99 ? 0 : this.compt + 1;
      }
    }
  };
}

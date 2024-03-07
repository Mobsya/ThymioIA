import { Actor, Container, Observable } from '../../../helpers';
import { Activity, Robot } from '../Model';
import type IThymioIA from '../Model/thymioIA.model';
import type { Users } from '../Model/users.model';

@Actor({ key: 'User', predicate: ['AllUser'] })
export class AllUser implements Users {
  captors: Observable<{ [uuid: string]: number[] }>;
  getRobotsUuids;
  takeControl;
  predict;
  trainModel;
  emitAction;
  emitMotorEvent;

  constructor({ activity, hosts }: { activity: Activity; hosts: string[] }) {
    const thymioIA = Container.factoryFromInjectable<IThymioIA>('BOUNDED_CONTEXT', 'ThymioIA', [], { activity, hosts });
    if (!thymioIA) {
      throw new Error('BOUNDED_CONTEXT:ThymioIA not found');
    }

    this.captors = thymioIA.captors;
    this.getRobotsUuids = thymioIA.getRobotsUuids;
    this.takeControl = thymioIA.takeControl;
    this.predict = thymioIA.predict;
    this.trainModel = thymioIA.trainModel;
    this.emitAction = thymioIA.emitAction;
    this.emitMotorEvent = thymioIA.emitMotorEvent;
  }
}

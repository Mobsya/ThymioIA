// import { createClient, IGroup, INode, Variables } from '@mobsya-association/thymio-api';
import { Service, Container, Observable, createObservable } from '../../../helpers';
import { TdmController, TdmClient } from '../Model';

@Service({ key: 'HostController', predicate: ['thymio2'] })
export class Thymio2DeviceManager implements TdmController {
  private hosts: string[] = [];

  readonly clients: Observable<{ [host: string]: TdmClient }> = createObservable({
    key: 'Thymios',
    initialValue: {},
  });

  constructor({ hosts }: { hosts: string[] }) {
    this.init(hosts);
  }

  private init = async (hosts: string[]) => {
    await this.setClients(hosts);
  };

  getRobotsUuids = async () => {
    const robotsUuidsInAllHost = await Promise.all(
      this.hosts.map(host => new Promise<string[]>(resolve => resolve(this.getRobotsByHost(host))))
    );

    const robots = robotsUuidsInAllHost.reduce((acc, val) => acc.concat(val), []);
    return robots;
  };

  getRobotsByHost = (host: string) => {
    return this.clients.state[host].getThymioList();
  };

  getRobotByUuid = (uuid: string) => {
    return Object.values(this.clients.state).find(client => client.getThymioList().includes(uuid));
  };

  takeControl = (uuid: string, onVariableChange: (uuid: string, variables: { [name: string]: number }) => void) => {
    const selectClient = this.getRobotByUuid(uuid);
    if (selectClient) {
      selectClient.takeControl(uuid, onVariableChange);
    }
  };

  emitAction = async (uuid: string, action: string, args: number[]) => {
    const selectClient = this.getRobotByUuid(uuid);
    if (selectClient) {
      await selectClient.emitAction(uuid, action, args);
    }
  };

  setClients = async (hosts: string[]) =>
    new Promise((resolve, reject) => {
      try {
        this.hosts = hosts;

        this.hosts.forEach(host => {
          const client = Container.factoryFromInjectable<TdmClient>('SERVICE', 'ClientDeviceManager', ['thymio2'], {
            host,
          });

          if (client) {
            client.connectToTDM();

            this.clients.set({
              ...this.clients.state,
              [host]: client,
            });
          }
        });

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
}

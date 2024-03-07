import { createClient, INode } from '@mobsya-association/thymio-api';
import { Service, Container, Observable, createObservable } from '../../../helpers';
import { TdmClient, Thymio } from '../Model';

@Service({ key: 'ClientDeviceManager', predicate: ['thymio2'] })
export class ClientDeviceManager implements TdmClient {
  private readonly host: string = '';

  readonly nodeList: Observable<{ [uuid: string]: Thymio }> = createObservable({
    key: 'ThymioList',
    initialValue: {},
  });

  constructor({ host }: { host: string }) {
    this.host = host;
  }

  private setRobot = (
    nodes: {
      nodeId: string;
      node: INode;
    }[]
  ) => {
    const thymioListNodes = nodes
      .map(({ nodeId, node }) =>
        Container.factoryFromInjectable<Thymio>('STORE', 'Thymio Store', ['thymio2', 'eventVariable'], {
          uuid: nodeId,
          node,
        })
      )
      .reduce((acc: { [uuid: string]: Thymio }, thymio: Thymio | undefined) => {
        if (thymio) {
          return { ...acc, [thymio.uuid]: thymio };
        }
        return acc;
      }, {});

    this.nodeList.set(thymioListNodes);
  };

  takeControl = async (
    uuid: string,
    onVariableChange: (uuid: string, variables: { [name: string]: number }) => void
  ) => {
    const thymio = this.nodeList.state[uuid];

    if (thymio) {
      await thymio.initialize();
      const _thymio = this.nodeList.state[uuid];
      _thymio.onVariableChange((variables: { [name: string]: number }) => {
        onVariableChange(uuid, variables);
      });
    }
  };

  emitAction = async (uuid: string, action: string, originalArgs: number[]) => {
    const thymio = this.nodeList.state[uuid];

    if (thymio) {
      await thymio.emitAction(action, originalArgs);
    }
  };

  getThymioByUuid = (uuid: string) => this.nodeList.state[uuid];

  setThymioByUuid = (uuid: string, thymio: Thymio) => this.nodeList.set({ ...this.nodeList.state, [uuid]: thymio });

  getThymioList = () => {
    return Object.values(this.nodeList.state).map((thymio: Thymio) => thymio.uuid);
  };

  connectToTDM = async () =>
    new Promise((resolve, reject) => {
      try {
        createClient(`ws://${this.host}:8597`).onNodesChanged = (nodes: INode[]) => {
          const catchNodes = nodes.map((node: INode) => {
            const nodeId = node.id.toString().replace(/[^a-zA-Z0-9 -]/g, '');
            return { nodeId, node };
          });

          this.setRobot(catchNodes);

          resolve(true);
        };
      } catch (error) {
        reject(error);
      }
    });
}

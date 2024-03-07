import { Container } from '../../helpers';
import { Activity } from './Model/activity';
import { Users, UsersType } from './Model/users.model';

type ThymioManagerFactoryParams = {
  user: UsersType;
  activity: Activity;
  hosts: string[];
};

type ThymioManagerFactory = (params: ThymioManagerFactoryParams) => Users;

export const thymioManagerFactory: ThymioManagerFactory = ({ user, activity, hosts }) => {
  const actor = Container.factoryFromInjectable<Users>('ACTOR', 'User', [user], { activity, hosts });

  if (!actor) {
    throw new Error('ACTOR:User not found');
  }

  return actor;
};

import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { thymioManagerFactory } from '../../Entities/ThymioManager';
import { observer } from 'mobx-react';

const user = thymioManagerFactory({ user: 'AllUser', activity: 'ThymioIA', hosts: ['localhost'] });

const App = observer(() => {
  const [robots, setRobots] = useState<string[]>([]);
  const [controledRobot, setControledRobot] = useState<string>('');
  const [trainer, setTrainer] = useState<{ uuid: string; action: string; captors: number[] }[]>([]);
  const [mode, setMode] = useState<'TRAIN' | 'PREDICT'>('TRAIN');

  const onClickGetRobots = async () => {
    const _robots = await user.getRobotsUuids();
    setRobots(_robots);
  };

  const onSelectRobot = async (robotUuid: string) => {
    user.takeControl(robotUuid);
    setControledRobot(robotUuid);
  };

  const onAction = async (action: string) => {
    setTrainer([...trainer, { uuid: controledRobot, action, captors: user.captors.state[controledRobot] }]);
    await user.emitMotorEvent(controledRobot, action);
  };

  const onExecute = async () => {
    const data = trainer.map(({ action, captors }) => ({
      input: captors.map(captor => captor.toString()),
      output: action,
    }));

    await user.trainModel(data);
    setMode('PREDICT');
  };

  useEffect(() => {
    if (mode === 'PREDICT') {
      const data = user.captors.state[controledRobot].map(captor => captor.toString());
      user.predict(controledRobot, data);
    }
  }, [mode, user.captors.state, controledRobot]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mode === 'PREDICT') {
        const data = user.captors.state[controledRobot].map(captor => captor.toString());
        user.predict(controledRobot, data);
      }
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <>
      <h1>ThymioAI</h1>

      {controledRobot !== '' ? (
        <>
          <button onClick={() => onAction('STOP')}>STOP</button>
          <button onClick={() => onAction('FORWARD')}>FORWARD</button>
          <button onClick={() => onAction('BACKWARD')}>BACKWARD</button>
          <button onClick={() => onAction('LEFT')}>LEFT</button>
          <button onClick={() => onAction('RIGHT')}>RIGHT</button>
          <pre>{JSON.stringify(user.captors.state, null)}</pre>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            {trainer.map(({ action, captors }, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '250px',
                  height: '1.2rem',
                }}
              >
                <p>{action}</p>
                <pre>{JSON.stringify(captors, null)}</pre>
              </div>
            ))}
            <br />
            <button onClick={onExecute}>EXECUTE</button>
          </div>
        </>
      ) : (
        <>
          <div className="card">
            <button onClick={onClickGetRobots}>getRobots</button>
          </div>

          {robots.map((robot, index) => (
            <div key={index} className="card">
              <button onClick={() => onSelectRobot(robot)}>
                <p>{robot}</p>
              </button>
            </div>
          ))}
        </>
      )}
    </>
  );
});

export default App;

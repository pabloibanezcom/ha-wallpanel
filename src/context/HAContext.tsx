import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  type Connection,
  type HassEntities,
  callService as haCallService,
  createConnection,
  createLongLivedTokenAuth,
  getAuth,
  subscribeEntities,
} from 'home-assistant-js-websocket';
import { getHaToken, getHaUrl } from '../config/ha';

interface HAContextValue {
  connection: Connection | null;
  entities: HassEntities;
  connected: boolean;
  callService: (
    domain: string,
    service: string,
    data?: Record<string, unknown>,
  ) => Promise<void>;
}

const HAContext = createContext<HAContextValue>({
  connection: null,
  entities: {},
  connected: false,
  callService: async () => {},
});

export function HAProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [entities, setEntities] = useState<HassEntities>({});
  const [connected, setConnected] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const connRef = useRef<Connection | null>(null);

  useEffect(() => {
    const haUrl = getHaUrl();
    const haToken = getHaToken();

    async function connect() {
      try {
        const auth = haToken
          ? createLongLivedTokenAuth(haUrl, haToken)
          : await getAuth({ hassUrl: haUrl, limitHassInstance: true });
        const conn = await createConnection({ auth });
        connRef.current = conn;
        setConnection(conn);
        setConnected(true);
        unsubRef.current = subscribeEntities(conn, (ents) => {
          setEntities(ents);
        });
      } catch (err) {
        console.error('HA connection failed:', err);
      }
    }

    connect();

    return () => {
      unsubRef.current?.();
      connRef.current?.close();
    };
  }, []);

  async function callService(
    domain: string,
    service: string,
    data: Record<string, unknown> = {},
  ) {
    if (!connection) return;
    await haCallService(connection, domain, service, data);
  }

  return (
    <HAContext.Provider value={{ connection, entities, connected, callService }}>
      {children}
    </HAContext.Provider>
  );
}

export function useHA() {
  return useContext(HAContext);
}

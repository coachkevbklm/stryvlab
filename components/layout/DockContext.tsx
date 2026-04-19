"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type OpenClient = {
  id: string;
  firstName: string;
  lastName: string;
};

type DockContextType = {
  openClients: OpenClient[];
  activeClientId: string | null;
  openClient: (client: OpenClient) => void;
  closeClient: (clientId: string) => void;
  setActiveClient: (clientId: string) => void;
};

const DockContext = createContext<DockContextType>({
  openClients: [],
  activeClientId: null,
  openClient: () => {},
  closeClient: () => {},
  setActiveClient: () => {},
});

export function DockProvider({ children }: { children: ReactNode }) {
  const [openClients, setOpenClients] = useState<OpenClient[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  const openClient = useCallback((client: OpenClient) => {
    setOpenClients((prev) => {
      if (prev.find((c) => c.id === client.id)) return prev;
      return [...prev, client];
    });
    setActiveClientId(client.id);
  }, []);

  const closeClient = useCallback((clientId: string) => {
    setOpenClients((prev) => {
      const next = prev.filter((c) => c.id !== clientId);
      return next;
    });
    setActiveClientId((prev) => {
      if (prev !== clientId) return prev;
      return null;
    });
  }, []);

  const setActiveClient = useCallback((clientId: string) => {
    setActiveClientId(clientId);
  }, []);

  return (
    <DockContext.Provider value={{ openClients, activeClientId, openClient, closeClient, setActiveClient }}>
      {children}
    </DockContext.Provider>
  );
}

export function useDock() {
  return useContext(DockContext);
}

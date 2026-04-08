"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type TopBarContent = {
  left?: ReactNode;
  right?: ReactNode;
};

type TopBarContextType = {
  content: TopBarContent;
  setTopBar: (content: TopBarContent) => void;
};

const TopBarContext = createContext<TopBarContextType>({
  content: {},
  setTopBar: () => {},
});

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<TopBarContent>({});

  const setTopBar = useCallback((c: TopBarContent) => {
    setContent(c);
  }, []);

  return (
    <TopBarContext.Provider value={{ content, setTopBar }}>
      {children}
    </TopBarContext.Provider>
  );
}

export function useTopBar() {
  return useContext(TopBarContext);
}

import { createContext, useContext, useState, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface TopBarActionsContextValue {
  actions: ReactNode | null;
  setActions: (actions: ReactNode | null) => void;
}

const TopBarActionsContext = createContext<TopBarActionsContextValue | null>(null);

export function TopBarActionsProvider() {
  const [actions, setActions] = useState<ReactNode | null>(null);

  return (
    <TopBarActionsContext.Provider value={{ actions, setActions }}>
      <Outlet />
    </TopBarActionsContext.Provider>
  );
}

export function useTopBarActions() {
  const ctx = useContext(TopBarActionsContext);
  if (!ctx) throw new Error('useTopBarActions must be used within TopBarActionsProvider');
  return ctx;
}

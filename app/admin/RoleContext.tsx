// app/admin/RoleContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface RoleContextType {
  activeRole: string | null;
  setActiveRole: (role: string | null) => void;
  actualRole: string | null;
  setActualRole: (role: string | null) => void;
}

const RoleContext = createContext<RoleContextType>({
  activeRole: null,
  setActiveRole: () => {},
  actualRole: null,
  setActualRole: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [actualRole, setActualRole] = useState<string | null>(null);

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole, actualRole, setActualRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
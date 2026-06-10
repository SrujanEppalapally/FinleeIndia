import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  userName: string;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userName: 'Priya Sharma',
        login: () => setIsAuthenticated(true),
        logout: () => setIsAuthenticated(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

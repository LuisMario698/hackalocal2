import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthCtx {
  isVerifier: boolean;
  setIsVerifier: (v: boolean) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
}

const AuthContext = createContext<AuthCtx>({
  isVerifier: false,
  setIsVerifier: () => {},
  isAdmin: false,
  setIsAdmin: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isVerifier, setIsVerifier] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  return (
    <AuthContext.Provider value={{ isVerifier, setIsVerifier, isAdmin, setIsAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthCtx {
  isVerifier: boolean;
  setIsVerifier: (v: boolean) => void;
}

const AuthContext = createContext<AuthCtx>({
  isVerifier: false,
  setIsVerifier: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isVerifier, setIsVerifier] = useState(false);
  return (
    <AuthContext.Provider value={{ isVerifier, setIsVerifier }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

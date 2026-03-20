import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { ClientResponseError } from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import { loginWithPassword, logoutUser } from '@/modules/auth/auth-api';
import { pocketbase } from '@/shared/api/pocketbase';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: RecordModel | null;
  userEmail: string;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(pocketbase.authStore.record);
  const [isAuthenticated, setIsAuthenticated] = useState(pocketbase.authStore.isValid);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return pocketbase.authStore.onChange(() => {
      setUser(pocketbase.authStore.record);
      setIsAuthenticated(pocketbase.authStore.isValid);
    });
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    user,
    userEmail: typeof user?.email === 'string' ? user.email : 'Signed out',
    error,
    clearError: () => setError(null),
    login: async (email, password) => {
      setIsLoading(true);
      setError(null);

      try {
        const auth = await loginWithPassword(email, password);
        setUser(auth.record);
        setIsAuthenticated(true);
      } catch (caughtError) {
        if (caughtError instanceof ClientResponseError) {
          setError(caughtError.response?.message || caughtError.message || 'Unable to log in.');
        } else if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError('Unable to log in.');
        }

        throw caughtError;
      } finally {
        setIsLoading(false);
      }
    },
    logout: () => {
      logoutUser();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

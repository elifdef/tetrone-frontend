import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { UserData } from '@/types/user';

export interface AuthContextValue {
    user: UserData | null;
    setUser: Dispatch<SetStateAction<UserData | null>>;
    login: (newUser: UserData) => void;
    logout: () => Promise<void>;
    loading: boolean;
    initError: boolean;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    setUser: () => {},
    login: () => {},
    logout: async () => {},
    loading: true,
    initError: false,
    isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

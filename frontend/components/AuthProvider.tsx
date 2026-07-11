'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getToken, setToken } from '@/lib/api';
import { useCurrentUser } from '@/lib/hooks';
import type { User } from '@/lib/types';

interface AuthContextValue {
    user: User | undefined;
    isLoading: boolean;
    isAuthed: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const qc = useQueryClient();
    // `mounted` stays false through SSR and the first client render, so the tree
    // is identical on both (no localStorage read during render) — avoids a
    // hydration mismatch. After mount we know whether a token exists.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const hasToken = mounted && !!getToken();
    const { data: user, isLoading: queryLoading } = useCurrentUser();

    const logout = useCallback(() => {
        setToken(null);
        qc.clear();
        // Repopulate anonymous queries.
        qc.invalidateQueries();
    }, [qc]);

    // Until mounted, report "loading" so auth-gated screens render a stable
    // placeholder that matches the server output.
    const isLoading = !mounted || (hasToken && queryLoading);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthed: !!user,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

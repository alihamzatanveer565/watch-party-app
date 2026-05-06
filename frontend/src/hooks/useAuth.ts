'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { authService } from '@/services/auth.service';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = authService.getUser();
    const token = authService.getToken();
    if (cached && token) {
      setUser(cached);
      // Verify token is still valid
      authService.me()
        .then((u) => { setUser(u); authService.saveSession(token, u); })
        .catch(() => { authService.clearSession(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    authService.saveSession(res.token, res.user);
    setUser(res.user);
    return res;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await authService.signup(name, email, password);
    authService.saveSession(res.token, res.user);
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(() => {
    authService.clearSession();
    setUser(null);
  }, []);

  return { user, loading, login, signup, logout, isAuthenticated: !!user };
}

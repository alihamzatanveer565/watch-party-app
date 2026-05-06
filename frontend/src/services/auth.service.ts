import api from '@/lib/axios';
import { User } from '@/types';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/signup', { name, email, password });
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  saveSession(token: string, user: User) {
    localStorage.setItem('wp_token', token);
    localStorage.setItem('wp_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('wp_token');
    localStorage.removeItem('wp_user');
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('wp_token');
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('wp_user');
    return raw ? JSON.parse(raw) : null;
  },
};

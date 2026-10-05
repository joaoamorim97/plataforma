import type { UserRole } from '@/types';

/**
 * Lightweight local auth used when Supabase credentials are not configured.
 * It mints an unsigned JWT (header.payload.signature) that the backend accepts
 * in dev mode (SUPABASE_JWT_SECRET unset). This keeps the full MVP flow testable
 * out of the box. In production, configure Supabase and this path is never used.
 */

const STORAGE_KEY = 'perto.demo.users';
const SESSION_KEY = 'perto.demo.session';

interface DemoUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface DemoSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
}

function base64url(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function makeToken(user: DemoUser): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + 60 * 60 * 24 * 30,
    }),
  );
  return `${header}.${payload}.demo`;
}

function loadUsers(): DemoUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: DemoUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function uuid(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const demoAuth = {
  signUp(email: string, password: string, name: string, role: UserRole): DemoSession {
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Já existe uma conta com este e-mail.');
    }
    const user: DemoUser = { id: uuid(), email, password, name, role };
    users.push(user);
    saveUsers(users);
    return this.persistSession(user);
  },

  signIn(email: string, password: string): DemoSession {
    const users = loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('E-mail ou senha inválidos.');
    }
    return this.persistSession(user);
  },

  persistSession(user: DemoUser): DemoSession {
    const session: DemoSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token: makeToken(user),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  currentSession(): DemoSession | null {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
    } catch {
      return null;
    }
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY);
  },
};

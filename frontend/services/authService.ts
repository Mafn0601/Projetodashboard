export type UserSession = {
  role: 'admin' | 'user';
};

const KEY = 'currentUser';

export function login(role: 'admin' | 'user') {
  const session: UserSession = { role };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, JSON.stringify(session));
      window.localStorage.setItem('currentUserRole', role);
    }
  } catch {}
}

export function getUser(): UserSession | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function logout() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem('currentUserRole');
    }
  } catch {}
}

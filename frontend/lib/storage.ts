import { isBrowser } from "./utils";

export function readArray<T>(key: string): T[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function writeArray<T>(key: string, value: T[]): void {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function appendItem<T>(key: string, item: T): T[] {
  const current = readArray<T>(key);
  const next = [...current, item];
  writeArray(key, next);
  return next;
}

export function updateItemById<T extends { id: string | number }>(
  key: string,
  id: string | number,
  updater: (item: T) => T
): T[] {
  const current = readArray<T>(key);
  const next = current.map((item) =>
    item.id === id ? updater(item) : item
  );
  writeArray(key, next);
  return next;
}


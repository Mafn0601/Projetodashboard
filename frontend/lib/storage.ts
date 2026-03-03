import { isBrowser } from "./utils";

// lê um array do localStorage
export function readArray<T>(key: string): T[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    // se der erro no parse, só retorna vazio
    return [];
  }
}

export function writeArray<T>(key: string, value: T[]): void {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// adiciona um item no final do array
export function appendItem<T>(key: string, item: T): T[] {
  const current = readArray<T>(key);
  const next = [...current, item];
  writeArray(key, next);
  return next;
}

// atualiza um item específico por ID
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


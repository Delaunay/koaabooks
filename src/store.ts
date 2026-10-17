// Browser storage (localStorage) for the books. Each document is a JSON value
// under `koaabooks:<key>`: one per tax year ("2025") plus the shared lists, whose
// keys start with "_" (_categories, _value-lists, _csv-profiles).
//
// Same shape as the Okaasan JSON store the tracker came from, so a year file
// from Okaasan (uploads/data/expense-tracker/<year>.json) imports as is.

const PREFIX = 'koaabooks:';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const store = {
  /** Every key, years and lists alike. */
  keys(): string[] {
    const s = storage();
    if (!s) return [];
    const out: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
    }
    return out.sort();
  },

  /** The tax years that have been saved. */
  years(): string[] {
    return store.keys().filter(k => !k.startsWith('_'));
  },

  get<T>(key: string): T | null {
    const raw = storage()?.getItem(PREFIX + key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /** Throws when storage is full or blocked, so callers can tell the user. */
  put<T>(key: string, data: T): void {
    const s = storage();
    if (!s) throw new Error('browser storage is blocked');
    s.setItem(PREFIX + key, JSON.stringify(data));
  },

  remove(key: string): void {
    storage()?.removeItem(PREFIX + key);
  },
};

// ── Backup ─────────────────────────────────────────────────

export interface Backup {
  app: 'koaabooks';
  version: 1;
  savedAt: string;
  files: Record<string, unknown>;
}

export function makeBackup(): Backup {
  const files: Record<string, unknown> = {};
  for (const k of store.keys()) files[k] = store.get(k);
  return { app: 'koaabooks', version: 1, savedAt: new Date().toISOString(), files };
}

/**
 * The documents in an imported file, by key. Accepts a Koaabooks backup, or a
 * single Okaasan expense-tracker file named after its key (2025.json,
 * _categories.json, ...). Returns null when the file is neither.
 */
export function readImport(fileName: string, data: unknown): Record<string, unknown> | null {
  if (data && typeof data === 'object' && (data as Backup).app === 'koaabooks') {
    const files = (data as Backup).files;
    return files && typeof files === 'object' ? files : null;
  }
  const key = fileName.replace(/\.json$/i, '').replace(/ \(\d+\)$/, '');
  const isYear = data && typeof data === 'object' && Array.isArray((data as { entries?: unknown }).entries);
  const isList = key.startsWith('_') && data && typeof data === 'object';
  if ((isYear || isList) && /^[\w-]+$/.test(key)) return { [key]: data };
  return null;
}

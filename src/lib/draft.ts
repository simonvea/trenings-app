// Unsaved workout input kept in the browser, so a PWA that iOS kills in the background
// (e.g. while switching to a music app between sets) comes back with the ticks intact.
// Storage can be unavailable or full; a lost draft is better than a crashed session page.

export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

// Reading the `localStorage` global itself throws when site data is blocked
export const browserStorage = (): DraftStorage | undefined => {
	try {
		return window.localStorage;
	} catch {
		return undefined;
	}
};

export const readDraft = <T>(
	storage: DraftStorage | undefined,
	key: string,
	fallback: T,
	fits: (value: unknown) => value is T
): T => {
	try {
		const stored = storage?.getItem(key) ?? null;
		if (stored === null) return fallback;
		const value: unknown = JSON.parse(stored);
		return fits(value) ? value : fallback;
	} catch {
		return fallback;
	}
};

export const writeDraft = (
	storage: DraftStorage | undefined,
	key: string,
	value: unknown
): void => {
	try {
		storage?.setItem(key, JSON.stringify(value));
	} catch {
		// Nothing to do: the draft is a convenience
	}
};

export const clearDrafts = (storage: DraftStorage | undefined, prefix: string): void => {
	if (!storage) return;
	try {
		const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
		for (const key of keys) {
			if (key === prefix || key?.startsWith(`${prefix}-`)) storage.removeItem(key);
		}
	} catch {
		// Nothing to do: a stale draft is ignored once the session is completed
	}
};

import { describe, expect, it } from 'vitest';
import { clearDrafts, readDraft, writeDraft, type DraftStorage } from './draft';

const memoryStorage = (entries: Record<string, string> = {}): DraftStorage => {
	const map = new Map(Object.entries(entries));
	return {
		get length() {
			return map.size;
		},
		key: (i) => [...map.keys()][i] ?? null,
		getItem: (k) => map.get(k) ?? null,
		setItem: (k, v) => void map.set(k, v),
		removeItem: (k) => void map.delete(k)
	};
};

const isNumberList = (value: unknown): value is number[] =>
	Array.isArray(value) && value.every((n) => typeof n === 'number');

describe('readDraft', () => {
	describe('given nothing is stored', () => {
		it('when reading, then the fallback is returned', () => {
			// Arrange
			const storage = memoryStorage();

			// Act
			const draft = readDraft(storage, 'session-1', [0], isNumberList);

			// Assert
			expect(draft).toEqual([0]);
		});
	});

	describe('given a written draft', () => {
		it('when reading it back and it still fits, then the stored value is returned', () => {
			// Arrange
			const storage = memoryStorage();
			writeDraft(storage, 'session-1', [5, 5, 3]);

			// Act
			const draft = readDraft(storage, 'session-1', [], isNumberList);

			// Assert
			expect(draft).toEqual([5, 5, 3]);
		});
	});

	describe('given a stored draft that no longer fits the plan', () => {
		it('when reading, then the fallback is returned', () => {
			// Arrange
			const storage = memoryStorage({ 'session-1': '["not", "numbers"]' });

			// Act
			const draft = readDraft(storage, 'session-1', [0], isNumberList);

			// Assert
			expect(draft).toEqual([0]);
		});
	});

	describe('given corrupt JSON in storage', () => {
		it('when reading, then the fallback is returned instead of throwing', () => {
			// Arrange
			const storage = memoryStorage({ 'session-1': '{oops' });

			// Act
			const draft = readDraft(storage, 'session-1', [0], isNumberList);

			// Assert
			expect(draft).toEqual([0]);
		});
	});

	describe('given storage that is unavailable', () => {
		it('when reading and writing, then nothing throws', () => {
			// Arrange
			const broken = memoryStorage();
			broken.getItem = () => {
				throw new Error('SecurityError');
			};
			broken.setItem = () => {
				throw new Error('QuotaExceededError');
			};

			// Act
			const read = () => readDraft(broken, 'session-1', [0], isNumberList);
			const write = () => writeDraft(broken, 'session-1', [1]);

			// Assert
			expect(read).not.toThrow();
			expect(write).not.toThrow();
		});
	});
});

describe('given no storage at all', () => {
	it('when reading, writing and clearing, then the fallback is used and nothing throws', () => {
		// Arrange
		const missing = undefined;

		// Act
		const draft = readDraft(missing, 'session-1', [0], isNumberList);
		const writeAndClear = () => {
			writeDraft(missing, 'session-1', [1]);
			clearDrafts(missing, 'session-1');
		};

		// Assert
		expect(draft).toEqual([0]);
		expect(writeAndClear).not.toThrow();
	});
});

describe('clearDrafts', () => {
	it('when clearing a session prefix, then only that session’s drafts are removed', () => {
		// Arrange
		const storage = memoryStorage({
			'session-1': '[]',
			'session-1-assistance-1': '[]',
			'session-12': '[]'
		});

		// Act
		clearDrafts(storage, 'session-1');

		// Assert
		expect(storage.getItem('session-1')).toBeNull();
		expect(storage.getItem('session-1-assistance-1')).toBeNull();
		expect(storage.getItem('session-12')).toBe('[]');
	});
});

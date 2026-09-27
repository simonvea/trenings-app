import { describe, expect, it } from 'vitest';
import { pendingMigrations } from './migrations';

describe('pendingMigrations', () => {
	describe('given migration files keyed by path', () => {
		const files = {
			'./migrations/002_add_notes.sql': 'ALTER TABLE x ADD notes TEXT;',
			'./migrations/001_init.sql': 'CREATE TABLE x (id INTEGER);'
		};

		it('when the database is new, then all migrations are returned in version order', () => {
			// Arrange
			const currentVersion = 0;

			// Act
			const pending = pendingMigrations(files, currentVersion);

			// Assert
			expect(pending).toEqual([
				{ version: 1, name: '001_init.sql', sql: 'CREATE TABLE x (id INTEGER);' },
				{ version: 2, name: '002_add_notes.sql', sql: 'ALTER TABLE x ADD notes TEXT;' }
			]);
		});

		it('when the database is at version 1, then only later migrations are returned', () => {
			// Arrange
			const currentVersion = 1;

			// Act
			const pending = pendingMigrations(files, currentVersion);

			// Assert
			expect(pending.map((m) => m.version)).toEqual([2]);
		});

		it('when the database is up to date, then nothing is returned', () => {
			// Arrange
			const currentVersion = 2;

			// Act
			const pending = pendingMigrations(files, currentVersion);

			// Assert
			expect(pending).toEqual([]);
		});
	});

	describe('given a file name without a numeric prefix', () => {
		it('when collecting migrations, then it throws naming the file', () => {
			// Arrange
			const files = { './migrations/init.sql': 'CREATE TABLE x (id INTEGER);' };

			// Act
			const act = () => pendingMigrations(files, 0);

			// Assert
			expect(act).toThrow('init.sql');
		});
	});

	describe('given two files with the same version', () => {
		it('when collecting migrations, then it throws naming the version', () => {
			// Arrange
			const files = {
				'./migrations/001_a.sql': 'SELECT 1;',
				'./migrations/001_b.sql': 'SELECT 2;'
			};

			// Act
			const act = () => pendingMigrations(files, 0);

			// Assert
			expect(act).toThrow('version 1');
		});
	});
});

import type { DatabaseSync } from 'node:sqlite';

export type Migration = { version: number; name: string; sql: string };

const toMigration = ([path, sql]: [string, string]): Migration => {
	const name = path.split('/').pop()!;
	const match = /^(\d+)_/.exec(name);
	if (!match) throw new Error(`Migration file must start with a version number: ${name}`);
	return { version: Number(match[1]), name, sql };
};

export const pendingMigrations = (
	files: Record<string, string>,
	currentVersion: number
): Migration[] => {
	const migrations = Object.entries(files)
		.map(toMigration)
		.sort((a, b) => a.version - b.version);

	const duplicate = migrations.find((m, i) => migrations[i + 1]?.version === m.version);
	if (duplicate) throw new Error(`Two migrations share version ${duplicate.version}`);

	return migrations.filter((m) => m.version > currentVersion);
};

const migrationFiles = import.meta.glob<string>('./migrations/*.sql', {
	query: '?raw',
	import: 'default',
	eager: true
});

export function migrate(db: DatabaseSync): void {
	const { user_version } = db.prepare('PRAGMA user_version').get() as { user_version: number };

	for (const migration of pendingMigrations(migrationFiles, user_version)) {
		db.exec('BEGIN');
		try {
			db.exec(migration.sql);
			db.exec(`PRAGMA user_version = ${migration.version}`);
			db.exec('COMMIT');
		} catch (e) {
			db.exec('ROLLBACK');
			throw new Error(`Migration ${migration.name} failed: ${(e as Error).message}`, { cause: e });
		}
	}
}

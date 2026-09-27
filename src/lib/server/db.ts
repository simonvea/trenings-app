import { DatabaseSync, type SQLTagStore } from 'node:sqlite';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { migrate } from './migrations';

let db: DatabaseSync;
export let sql: SQLTagStore;

if (!building) {
	if (!env.DB_URL) throw new Error('Missing database connection!');

	db = new DatabaseSync(env.DB_URL);
	db.exec('PRAGMA foreign_keys = ON');
	migrate(db);

	sql = db.createTagStore();
}

export function transaction<T>(fn: () => T): T {
	db.exec('BEGIN');
	try {
		const result = fn();
		db.exec('COMMIT');
		return result;
	} catch (e) {
		db.exec('ROLLBACK');
		throw e;
	}
}

process.on('sveltekit:shutdown', async () => {
	db?.close();
});

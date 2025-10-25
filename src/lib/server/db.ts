import { DatabaseSync, type SQLTagStore } from 'node:sqlite';
import { DB_URL } from '$env/static/private';
import { building } from '$app/environment';

let db: DatabaseSync;
export let sql: SQLTagStore;

if (!building) {
	if (!DB_URL) throw new Error('Missing database connection!');

	db = new DatabaseSync(DB_URL);

	sql = db.createTagStore();
}

process.on('sveltekit:shutdown', async () => {
	db?.close();
});

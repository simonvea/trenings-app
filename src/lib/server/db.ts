import { DatabaseSync } from 'node:sqlite';
import { DB_URL } from '$env/static/private';

if (!DB_URL) throw new Error('Missing database connection!');

const db = new DatabaseSync(DB_URL);

export const sql = db.createTagStore();

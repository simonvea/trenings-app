import { sql } from '$lib/server/db';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ params }) => {
	const { id } = params;

	if (!id) error(400, 'Need an id');

	const history = sql.all`SELECT * FROM assistance_work INNER JOIN workout_sessions ON workout_sessions.id = assistance_work.session_id WHERE exercise_id = ${Number(id)} ORDER BY workout_sessions.completed_date LIMIT 10`;

	return json(history);
};

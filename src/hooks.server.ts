import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, verifyToken } from '$lib/auth/session';
import { authSecret } from '$lib/server/auth';

const publicPaths = new Set(['/login', '/health']);

export const handle: Handle = async ({ event, resolve }) => {
	if (publicPaths.has(event.url.pathname)) return resolve(event);

	if (!verifyToken(event.cookies.get(SESSION_COOKIE), authSecret(), Date.now())) {
		const redirectTo = event.url.pathname + event.url.search;
		redirect(303, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	return resolve(event);
};

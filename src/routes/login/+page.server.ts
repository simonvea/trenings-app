import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	SESSION_COOKIE,
	SESSION_TTL_MS,
	createToken,
	passwordMatches,
	safeRedirectTarget
} from '$lib/auth/session';
import { authPassword, authSecret } from '$lib/server/auth';

export const load: PageServerLoad = () => ({ title: 'Logg inn' });

export const actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const password = String(data.get('password') ?? '');
		if (!passwordMatches(password, authPassword())) return fail(400, { error: 'Feil passord' });

		cookies.set(SESSION_COOKIE, createToken(authSecret(), Date.now()), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: SESSION_TTL_MS / 1000
		});
		redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
	}
} satisfies Actions;

import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

if (!building && (!env.AUTH_PASSWORD || !env.AUTH_SECRET))
	throw new Error('Missing AUTH_PASSWORD or AUTH_SECRET');

export const authPassword = (): string => env.AUTH_PASSWORD!;
export const authSecret = (): string => env.AUTH_SECRET!;

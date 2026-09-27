import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000;

const sign = (secret: string, expiresAt: string): Buffer =>
	createHmac('sha256', secret).update(expiresAt).digest();

export const createToken = (secret: string, now: number): string => {
	const expiresAt = String(now + SESSION_TTL_MS);
	return `${expiresAt}.${sign(secret, expiresAt).toString('base64url')}`;
};

export const verifyToken = (token: string | undefined, secret: string, now: number): boolean => {
	const [expiresAt, signature, ...rest] = token?.split('.') ?? [];
	if (!expiresAt || !signature || rest.length > 0) return false;
	if (!/^\d+$/.test(expiresAt) || Number(expiresAt) <= now) return false;

	const expected = sign(secret, expiresAt);
	const actual = Buffer.from(signature, 'base64url');
	return actual.length === expected.length && timingSafeEqual(actual, expected);
};

// Hash both sides so timingSafeEqual gets equal-length buffers regardless of input length.
const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

export const passwordMatches = (input: string, expected: string): boolean =>
	timingSafeEqual(digest(input), digest(expected));

export const safeRedirectTarget = (redirectTo: string | null): string => {
	// "//host" and "/\host" are protocol-relative in browsers; only same-origin paths allowed.
	if (!redirectTo || !redirectTo.startsWith('/') || /^\/[/\\]/.test(redirectTo)) return '/';
	return redirectTo;
};

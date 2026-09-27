import { describe, expect, it } from 'vitest';
import {
	SESSION_TTL_MS,
	createToken,
	passwordMatches,
	safeRedirectTarget,
	verifyToken
} from './session';

const secret = 'test-secret';
const now = Date.UTC(2026, 8, 27);

describe('verifyToken', () => {
	describe('given a token created with the same secret', () => {
		it('when verified before expiry, then it is accepted', () => {
			// Arrange
			const token = createToken(secret, now);

			// Act
			const valid = verifyToken(token, secret, now + SESSION_TTL_MS - 1);

			// Assert
			expect(valid).toBe(true);
		});

		it('when verified at expiry, then it is rejected', () => {
			// Arrange
			const token = createToken(secret, now);

			// Act
			const valid = verifyToken(token, secret, now + SESSION_TTL_MS);

			// Assert
			expect(valid).toBe(false);
		});

		it('when the expiry is changed, then it is rejected', () => {
			// Arrange
			const [, signature] = createToken(secret, now).split('.');
			const tampered = `${now + 10 * SESSION_TTL_MS}.${signature}`;

			// Act
			const valid = verifyToken(tampered, secret, now);

			// Assert
			expect(valid).toBe(false);
		});
	});

	describe('given a token created with another secret', () => {
		it('when verified, then it is rejected', () => {
			// Arrange
			const token = createToken('other-secret', now);

			// Act
			const valid = verifyToken(token, secret, now);

			// Assert
			expect(valid).toBe(false);
		});
	});

	describe('given a missing or malformed token', () => {
		it.each([undefined, '', 'garbage', '123', 'abc.def', `${now}.`, '.sig'])(
			'when verifying %j, then it is rejected',
			(token) => {
				// Arrange
				// (token from test table)

				// Act
				const valid = verifyToken(token, secret, now);

				// Assert
				expect(valid).toBe(false);
			}
		);
	});
});

describe('passwordMatches', () => {
	it('when the input equals the expected password, then it matches', () => {
		// Arrange
		const expected = 'hemmelig';

		// Act
		const matches = passwordMatches('hemmelig', expected);

		// Assert
		expect(matches).toBe(true);
	});

	it('when the input differs, then it does not match', () => {
		// Arrange
		const expected = 'hemmelig';

		// Act
		const matches = passwordMatches('hemmelig2', expected);

		// Assert
		expect(matches).toBe(false);
	});
});

describe('safeRedirectTarget', () => {
	it.each([
		['/history', '/history'],
		['/sessions/2026-09-27?x=1', '/sessions/2026-09-27?x=1'],
		[null, '/'],
		['', '/'],
		['https://evil.example', '/'],
		['//evil.example', '/'],
		['/\\evil.example', '/']
	])('when redirectTo is %j, then the target is %j', (redirectTo, expected) => {
		// Arrange
		// (redirectTo from test table)

		// Act
		const target = safeRedirectTarget(redirectTo);

		// Assert
		expect(target).toBe(expected);
	});
});

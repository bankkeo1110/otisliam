import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, COOKIE_NAME } from '../lib/auth';

describe('auth – signToken', () => {
  it('returns a non-empty JWT string', async () => {
    const token = await signToken({ studentId: 1, name: 'Alice' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });

  it('encodes studentId and name in the payload', async () => {
    const token = await signToken({ studentId: 42, name: 'Bob' });
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(decoded.studentId).toBe(42);
    expect(decoded.name).toBe('Bob');
  });

  it('sets expiry ~30 days in the future', async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await signToken({ studentId: 1, name: 'Alice' });
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    const thirtyDays = 30 * 24 * 60 * 60;
    expect(decoded.exp - before).toBeGreaterThanOrEqual(thirtyDays - 5);
    expect(decoded.exp - before).toBeLessThanOrEqual(thirtyDays + 5);
  });
});

describe('auth – verifyToken', () => {
  it('returns the original user from a valid token', async () => {
    const token = await signToken({ studentId: 7, name: 'Charlie' });
    const user = await verifyToken(token);
    expect(user).toEqual({ studentId: 7, name: 'Charlie' });
  });

  it('returns null for a tampered token', async () => {
    const token = await signToken({ studentId: 1, name: 'Alice' });
    const tampered = token.slice(0, -4) + 'xxxx';
    const user = await verifyToken(tampered);
    expect(user).toBeNull();
  });

  it('returns null for a random string', async () => {
    const user = await verifyToken('not-a-token');
    expect(user).toBeNull();
  });

  it('returns null for an empty string', async () => {
    const user = await verifyToken('');
    expect(user).toBeNull();
  });

  it('sign → verify round-trip preserves all fields', async () => {
    const original = { studentId: 99, name: 'Student With Spaces' };
    const token = await signToken(original);
    const result = await verifyToken(token);
    expect(result).toEqual(original);
  });
});

describe('auth – constants', () => {
  it('COOKIE_NAME is the expected value', () => {
    expect(COOKIE_NAME).toBe('mathapp_token');
  });
});

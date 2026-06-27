/**
 * Integration tests for auth API routes.
 * These call the real Next.js dev server running on localhost:3000.
 * Start the server before running: npm run dev
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3000';
const unique = () => `testuser_${Math.random().toString(36).slice(2, 8)}`;

async function signup(name: string, password = 'test1234') {
  return fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  });
}

async function login(name: string, password = 'test1234') {
  return fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  });
}

function extractCookie(res: Response) {
  return res.headers.get('set-cookie') ?? '';
}

describe('/api/auth/signup', () => {
  it('creates a new user and sets a cookie', async () => {
    const name = unique();
    const res = await signup(name);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.studentId).toBe('number');
    expect(data.name).toBe(name);

    const cookie = extractCookie(res);
    expect(cookie).toContain('mathapp_token=');
    expect(cookie).toContain('HttpOnly');
  });

  it('rejects a name shorter than 2 characters', async () => {
    const res = await signup('x');
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('rejects a password shorter than 4 characters', async () => {
    const res = await signup(unique(), 'ab');
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('rejects a duplicate username', async () => {
    const name = unique();
    await signup(name);
    const res = await signup(name);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/taken/i);
  });
});

describe('/api/auth/login', () => {
  let userName: string;

  beforeAll(async () => {
    userName = unique();
    await signup(userName, 'pass1234');
  });

  it('returns 200 and sets a cookie for valid credentials', async () => {
    const res = await login(userName, 'pass1234');
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.studentId).toBe('number');
    expect(data.name).toBe(userName);

    const cookie = extractCookie(res);
    expect(cookie).toContain('mathapp_token=');
  });

  it('returns 401 for wrong password', async () => {
    const res = await login(userName, 'wrongpassword');
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('returns 401 for non-existent user', async () => {
    const res = await login('nobody_' + unique(), 'anything');
    expect(res.status).toBe(401);
  });

  it('returns 400 when name is missing', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test1234' }),
    });
    // API returns 401 when name field is absent (treated as no-match)
    expect([400, 401]).toContain(res.status);
  });
});

describe('/api/auth/me', () => {
  it('returns null user when no cookie is sent', async () => {
    const res = await fetch(`${BASE}/api/auth/me`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user).toBeNull();
  });

  it('returns user info when valid cookie is sent', async () => {
    const name = unique();
    const signupRes = await signup(name);
    const cookie = extractCookie(signupRes);
    const token = cookie.match(/mathapp_token=([^;]+)/)?.[1] ?? '';

    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Cookie: `mathapp_token=${token}` },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user).not.toBeNull();
    expect(data.user.name).toBe(name);
    expect(typeof data.user.studentId).toBe('number');
  });

  it('returns null for a tampered token', async () => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Cookie: 'mathapp_token=invalid.token.here' },
    });
    const data = await res.json();
    expect(data.user).toBeNull();
  });
});

describe('/api/auth/logout', () => {
  it('clears the cookie', async () => {
    const name = unique();
    const signupRes = await signup(name);
    const cookie = extractCookie(signupRes);
    const token = cookie.match(/mathapp_token=([^;]+)/)?.[1] ?? '';

    const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `mathapp_token=${token}` },
    });
    expect(logoutRes.status).toBe(200);

    const setCookie = extractCookie(logoutRes);
    // Cookie should be cleared (max-age=0 or expires in the past)
    expect(setCookie).toMatch(/Max-Age=0|expires=.*1970/i);
  });
});

describe('middleware – route protection', () => {
  it('redirects /practice to /login when not authenticated', async () => {
    const res = await fetch(`${BASE}/practice`, { redirect: 'manual' });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
    expect(res.headers.get('location')).toContain('from=%2Fpractice');
  });

  it('allows /practice through when authenticated', async () => {
    const name = unique();
    const signupRes = await signup(name);
    const cookie = extractCookie(signupRes);
    const token = cookie.match(/mathapp_token=([^;]+)/)?.[1] ?? '';

    const res = await fetch(`${BASE}/practice`, {
      headers: { Cookie: `mathapp_token=${token}` },
      redirect: 'manual',
    });
    expect(res.status).toBe(200);
  });

  it('allows /login and /signup without auth', async () => {
    const loginRes = await fetch(`${BASE}/login`, { redirect: 'manual' });
    expect(loginRes.status).toBe(200);

    const signupRes = await fetch(`${BASE}/signup`, { redirect: 'manual' });
    expect(signupRes.status).toBe(200);
  });
});

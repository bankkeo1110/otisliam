import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'mathfun-jwt-secret-otisliam-2024'
);

export const COOKIE_NAME = 'mathapp_token';

export interface AuthUser {
  studentId: number;
  name: string;
}

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ studentId: user.studentId, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { studentId: payload.studentId as number, name: payload.name as string };
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

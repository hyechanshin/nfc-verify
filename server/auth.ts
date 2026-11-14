import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';

const COOKIE = 'admin_session';
const SESSION_DAYS = 7;

function adminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('ADMIN_PASSWORD is not set in .env');
  return password;
}

// Sessions are signed with SESSION_SECRET, a long random value kept apart from the
// password, so a stolen cookie cannot be used to guess the password offline.
// Changing SESSION_SECRET logs everyone out.
let warned = false;
function sessionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (secret) return crypto.createHash('sha256').update(`session:${secret}`).digest();
  if (!warned) {
    console.warn('SESSION_SECRET is not set; falling back to a key derived from ADMIN_PASSWORD.');
    warned = true;
  }
  return crypto.createHash('sha256').update(`session:${adminPassword()}`).digest();
}

function sign(value: string): string {
  return crypto.createHmac('sha256', sessionKey()).update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

// Cookie value: "<expiry ms>.<signature>"
function isAdmin(req: Request): boolean {
  const value = readCookie(req, COOKIE);
  if (!value) return false;
  const [expires, signature] = value.split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return safeEqual(signature, sign(expires));
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: 'Please log in as admin.' });
}

export const authRoutes = Router();

authRoutes.post('/login', async (req: Request, res: Response) => {
  const password = String(req.body?.password ?? '');
  if (!safeEqual(password, adminPassword())) {
    // Slow down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(401).json({ error: 'Wrong password.' });
  }
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE, `${expires}.${sign(String(expires))}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    expires: new Date(expires)
  });
  res.json({ admin: true });
});

authRoutes.post('/logout', (req: Request, res: Response) => {
  res.clearCookie(COOKIE);
  res.json({ admin: false });
});

authRoutes.get('/me', (req: Request, res: Response) => {
  res.json({ admin: isAdmin(req) });
});

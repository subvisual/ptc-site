import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

export const authRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'ptcadmin';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'ptc-dev-secret-change-in-prod';
const COOKIE = 'ptc_session';

function sign(value: string) {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

function makeToken() {
  const ts = Date.now().toString();
  return `${ts}.${sign(ts)}`;
}

function verifyToken(token: string): boolean {
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  const expected = sign(ts);
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

authRouter.post('/login', (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Palavra-passe incorreta.' });
  }
  const token = makeToken();
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ ok: true });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

authRouter.get('/session', (req, res) => {
  const token = req.cookies?.[COOKIE];
  res.json({ authenticated: !!token && verifyToken(token) });
});

export function requireAuth(req: any, res: any, next: any) {
  const token = req.cookies?.[COOKIE];
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  next();
}

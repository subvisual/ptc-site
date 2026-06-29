import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { requireAuth } from './auth.js';
import { createMagicToken, consumeToken } from '../lib/tokens.js';
import { sendMagicLink } from '../lib/email.js';
import { getLeaderByEmail, getCommunitiesByIds } from '../notion.js';

export const portalRouter = Router();

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'ptc-dev-secret-change-in-prod';
const COOKIE = 'ptc_portal';

interface PortalSession {
  communityIds: string[];
  email: string;
  iat: number;
}

function signPortalSession(session: PortalSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const sig = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyPortalSession(cookie: string): PortalSession | null {
  const [payload, sig] = cookie.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as PortalSession;
  } catch {
    return null;
  }
}

export function getPortalSession(req: any): PortalSession | null {
  const cookie = req.cookies?.[COOKIE];
  if (!cookie) return null;
  return verifyPortalSession(cookie);
}

function setPortalCookie(res: any, session: PortalSession) {
  res.cookie(COOKIE, signPortalSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
  });
}

// Admin sends a magic link to a community leader's email
portalRouter.post('/magic-link', requireAuth, async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ error: 'Email obrigatório.' });

    const leader = await getLeaderByEmail(email);
    if (!leader || !leader.communityIds.length) {
      return res.status(404).json({ error: 'Nenhuma comunidade associada a este email.' });
    }

    const communities = await getCommunitiesByIds(leader.communityIds);
    const names = communities.map(c => c.name);
    const firstSlug = communities[0]?.slug || 'ptc';

    const token = createMagicToken(leader.communityIds, email, firstSlug);
    await sendMagicLink(email, token, names);

    res.json({ ok: true, communities: names });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Leader clicks magic link → set session cookie → redirect to portal
portalRouter.get('/auth/:token', async (req, res) => {
  const data = consumeToken(req.params.token);
  if (!data) {
    const siteUrl = process.env.SITE_URL ?? 'http://localhost:5173';
    return res.redirect(`${siteUrl}/#portal-expired`);
  }
  setPortalCookie(res, { communityIds: data.communityIds, email: data.email, iat: Date.now() });
  const siteUrl = process.env.SITE_URL ?? 'http://localhost:5173';
  res.redirect(`${siteUrl}/#portal`);
});

// Returns the current portal session
portalRouter.get('/session', (req, res) => {
  const session = getPortalSession(req);
  if (!session) return res.json({ authenticated: false });
  res.json({ authenticated: true, communityIds: session.communityIds, email: session.email });
});

portalRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

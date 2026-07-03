import { Router } from "express";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { ADMIN_PASSWORD, SESSION_SECRET, SESSION_TTL_MS } from "../lib/env.js";
import { authLimiter } from "../lib/ratelimit.js";
import { validate, loginInput } from "../lib/validation.js";

export const authRouter = Router();

const COOKIE = "ptc_session";

function sign(value: string) {
	return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

function makeToken() {
	const ts = Date.now().toString();
	return `${ts}.${sign(ts)}`;
}

function verifyToken(token: string): boolean {
	const [ts, sig] = token.split(".");
	if (!ts || !sig) return false;

	// Reject expired tokens server-side (the cookie maxAge is only a client hint).
	const issued = Number(ts);
	if (!Number.isFinite(issued) || Date.now() - issued > SESSION_TTL_MS)
		return false;

	const expected = sign(ts);
	try {
		return timingSafeEqual(
			Buffer.from(sig, "hex"),
			Buffer.from(expected, "hex"),
		);
	} catch {
		return false;
	}
}

// Constant-time password comparison (hash first so unequal lengths don't leak).
function passwordMatches(candidate: string): boolean {
	const a = createHash("sha256").update(candidate).digest();
	const b = createHash("sha256").update(ADMIN_PASSWORD).digest();
	return timingSafeEqual(a, b);
}

authRouter.post("/login", authLimiter, (req, res) => {
	const parsed = validate(loginInput, req.body);
	if (!parsed.ok || !passwordMatches(parsed.data.password)) {
		return res.status(401).json({ error: "Palavra-passe incorreta." });
	}
	const token = makeToken();
	res.cookie(COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		maxAge: SESSION_TTL_MS,
		secure: process.env.NODE_ENV === "production",
	});
	res.json({ ok: true });
});

authRouter.post("/logout", (_req, res) => {
	res.clearCookie(COOKIE);
	res.json({ ok: true });
});

authRouter.get("/session", (req, res) => {
	const token = req.cookies?.[COOKIE];
	res.json({ authenticated: !!token && verifyToken(token) });
});

export function verifyAdminSession(req: any): boolean {
	const token = req.cookies?.[COOKIE];
	return !!token && verifyToken(token);
}

export function requireAuth(req: any, res: any, next: any) {
	if (!verifyAdminSession(req)) {
		return res.status(401).json({ error: "Não autorizado." });
	}
	next();
}

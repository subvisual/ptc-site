import rateLimit from "express-rate-limit";

const common = {
	standardHeaders: true,
	legacyHeaders: false,
};

// Login + magic-link issuance: tight, to blunt password brute force and email abuse.
export const authLimiter = rateLimit({
	...common,
	windowMs: 15 * 60 * 1000,
	max: 10,
	message: { error: "Demasiadas tentativas. Tenta novamente mais tarde." },
});

// Public, unauthenticated submissions (community + leader): spam control.
export const publicSubmitLimiter = rateLimit({
	...common,
	windowMs: 60 * 60 * 1000,
	max: 15,
	message: { error: "Demasiados envios. Tenta novamente mais tarde." },
});

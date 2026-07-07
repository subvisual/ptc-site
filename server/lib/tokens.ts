import { randomBytes } from "crypto";

interface TokenData {
	communityIds: string[];
	email: string;
	exp: number;
}

const store = new Map<string, TokenData>();
const TTL_MS = 24 * 60 * 60 * 1000;

// Periodically evict expired tokens so the in-memory store can't grow unbounded.
// NOTE: this store is per-process; it does not survive restarts or scale across
// multiple instances. Move to a shared store (e.g. Redis) before horizontal scaling.
setInterval(
	() => {
		const now = Date.now();
		for (const [token, data] of store) {
			if (now > data.exp) store.delete(token);
		}
	},
	60 * 60 * 1000,
).unref();

function slugInitials(slug: string): string {
	return slug
		.split("-")
		.map((w) => w[0] ?? "")
		.join("")
		.slice(0, 4);
}

export function createMagicToken(
	communityIds: string[],
	email: string,
	firstSlug: string,
): string {
	const prefix = slugInitials(firstSlug);
	const rand = randomBytes(10).toString("hex");
	const token = `${prefix}-${rand}`;
	store.set(token, { communityIds, email, exp: Date.now() + TTL_MS });
	return token;
}

export function consumeToken(token: string): TokenData | null {
	const data = store.get(token);
	if (!data) return null;
	if (Date.now() > data.exp) {
		store.delete(token);
		return null;
	}
	store.delete(token);
	return data;
}

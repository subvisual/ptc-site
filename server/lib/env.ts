// Centralised environment/config access with fail-fast validation.
// Secrets are read here once so every module shares the same values and the
// same defaults, and so production can refuse to boot with insecure settings.

const isProd = process.env.NODE_ENV === "production";

const DEFAULT_SESSION_SECRET = "ptc-dev-secret-change-in-prod";
const DEFAULT_ADMIN_PASSWORD = "ptcadmin";

export const SESSION_SECRET =
	process.env.SESSION_SECRET ?? DEFAULT_SESSION_SECRET;
export const ADMIN_PASSWORD =
	process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

// Sessions (both admin and portal) are valid for 8 hours, enforced server-side.
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/**
 * Validate configuration at startup. In production, missing or default secrets
 * are a hard error (exit 1) rather than a silent, forgeable-session footgun.
 */
export function validateEnv(): void {
	const problems: string[] = [];

	if (isProd) {
		if (
			!process.env.SESSION_SECRET ||
			process.env.SESSION_SECRET === DEFAULT_SESSION_SECRET
		) {
			problems.push(
				"SESSION_SECRET must be set to a strong, unique value in production.",
			);
		} else if (process.env.SESSION_SECRET.length < 32) {
			problems.push("SESSION_SECRET must be at least 32 characters long.");
		}

		if (
			!process.env.ADMIN_PASSWORD ||
			process.env.ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD
		) {
			problems.push(
				"ADMIN_PASSWORD must be set to a non-default value in production.",
			);
		}

		if (!process.env.NOTION_TOKEN) {
			problems.push("NOTION_TOKEN is required.");
		}
	}

	if (problems.length) {
		console.error(
			"\n[FATAL] Refusing to start with insecure configuration:\n" +
				problems.map((p) => `  - ${p}`).join("\n") +
				"\n",
		);
		process.exit(1);
	}

	if (!isProd && SESSION_SECRET === DEFAULT_SESSION_SECRET) {
		console.warn(
			"[warn] Using the default SESSION_SECRET. This is fine for local dev only.",
		);
	}
}

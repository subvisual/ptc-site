import type { Response } from "express";

/**
 * Log an unexpected error server-side and return a generic message to the
 * client. Never echo `err.message` to callers — it leaks Notion/internal detail.
 */
export function serverError(res: Response, err: unknown): void {
	console.error("[api error]", err);
	res.status(500).json({ error: "Erro interno do servidor." });
}

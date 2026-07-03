import "./lib/load-env.js";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { existsSync } from "fs";
import { join } from "path";
import { validateEnv } from "./lib/env.js";
import { authRouter } from "./routes/auth.js";
import { eventsRouter } from "./routes/events.js";
import { communitiesRouter } from "./routes/communities.js";
import { configRouter } from "./routes/config.js";
import { portalRouter } from "./routes/portal.js";

validateEnv();

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);
const isProd = process.env.NODE_ENV === "production";

// Behind a reverse proxy in production: trust it so req.ip (used for rate
// limiting) reflects the real client, not the proxy.
if (isProd) app.set("trust proxy", 1);

// Security headers. CSP is left off because the SPA relies on inline styles and
// external Google Fonts; configure a CSP if/when those are removed.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/communities", communitiesRouter);
app.use("/api/config", configRouter);
app.use("/api/portal", portalRouter);

// Optionally serve the built SPA in production (a reverse proxy can do this too).
const distDir = join(process.cwd(), "dist");
if (isProd && existsSync(distDir)) {
	app.use(express.static(distDir));
	// SPA fallback for non-API GET requests (Express 5: avoid wildcard route strings).
	app.use((req, res, next) => {
		if (req.method !== "GET" || req.path.startsWith("/api")) return next();
		res.sendFile(join(distDir, "index.html"));
	});
}

app.listen(PORT, () => {
	console.log(`API server running on http://localhost:${PORT}`);
});

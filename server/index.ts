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

// Security headers, including a CSP restricting scripts/styles/fonts to self
// and the Google Fonts origins the SPA loads.
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
				fontSrc: ["https://fonts.gstatic.com"],
				imgSrc: ["'self'", "data:", "https:"],
				connectSrc: ["'self'"],
				objectSrc: ["'none'"],
				baseUri: ["'self'"],
				frameAncestors: ["'none'"],
			},
		},
	}),
);
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

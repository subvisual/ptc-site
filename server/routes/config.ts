import { Router } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { requireAuth } from "./auth.js";
import { serverError } from "../lib/http.js";
import { validate, configInput } from "../lib/validation.js";

export const configRouter = Router();

const CONFIG_PATH = join(process.cwd(), "data", "site-config.json");

const DEFAULT_CONFIG = {
	aboutText:
		"Portuguese Tech Communities (PTC) is a directory of meetups, talks, and tech events happening across Portugal. Curated by the organizers themselves.",
	faqs: [
		{
			q: "How can I add my community?",
			a: 'Click "Submit yours" and fill in the form. The PTC team will review and publish it shortly.',
		},
		{
			q: "Is PTC free?",
			a: "Yes, the directory is completely free for both organizers and participants.",
		},
		{
			q: "How often are events updated?",
			a: "Events are updated continuously by the organizers of each community.",
		},
		{
			q: "What events are listed here?",
			a: "Only in-person events organized by and run within Portugal's tech communities. Standalone events that aren't tied to a community aren't part of the curation, at least for now.",
		},
	],
	notionFormUrl: "",
	contactFormUrl:
		"https://subvisual.notion.site/e99c402a87554e1da9d6242c1a8f4cd3",
	newsletterUrl: "",
	whatsappUrl: "https://www.whatsapp.com/channel/0029VbClHwg7oQhYhNupxd3R",
	telegramUrl: "https://t.me/+NPjwePZ6jEVmMmM8",
	twitterUrl: "",
	linkedinUrl: "",
	instagramUrl: "",
};

function readConfig() {
	try {
		if (existsSync(CONFIG_PATH)) {
			return {
				...DEFAULT_CONFIG,
				...JSON.parse(readFileSync(CONFIG_PATH, "utf-8")),
			};
		}
	} catch {}
	return DEFAULT_CONFIG;
}

function writeConfig(config: object) {
	const dir = join(process.cwd(), "data");
	// Synchronous mkdir so the directory exists before the write (no race).
	mkdirSync(dir, { recursive: true });
	writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

configRouter.get("/", (_req, res) => {
	res.json(readConfig());
});

configRouter.put("/", requireAuth, (req, res) => {
	try {
		const parsed = validate(configInput, req.body);
		if (!parsed.ok) return res.status(400).json({ error: parsed.error });
		const current = readConfig();
		const updated = { ...current, ...parsed.data };
		writeConfig(updated);
		res.json(updated);
	} catch (e) {
		serverError(res, e);
	}
});

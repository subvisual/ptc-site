import { Router } from "express";
import {
	notion,
	COMMUNITIES_DB,
	COMMUNITY_LEADERS_DB,
	getCommunities,
	parseCommunity,
} from "../notion.js";
import { requireAuth, verifyAdminSession } from "./auth.js";
import { serverError } from "../lib/http.js";
import { publicSubmitLimiter } from "../lib/ratelimit.js";
import {
	validate,
	communityInput,
	communitySubmitInput,
	submitLeaderInput,
} from "../lib/validation.js";

export const communitiesRouter = Router();

communitiesRouter.get("/", async (req, res) => {
	try {
		// Only admins may list unapproved communities.
		const includeUnapproved =
			req.query.all === "true" && verifyAdminSession(req);
		const data = await getCommunities(includeUnapproved);
		res.json(data);
	} catch (e) {
		serverError(res, e);
	}
});

communitiesRouter.get("/:id", async (req, res) => {
	try {
		const page = (await notion.pages.retrieve({
			page_id: req.params.id,
		})) as any;
		const community = parseCommunity(page);
		// Unapproved communities are only visible to admins.
		if (!community.approved && !verifyAdminSession(req)) {
			return res.status(404).json({ error: "Comunidade não encontrada." });
		}
		res.json(community);
	} catch (e) {
		serverError(res, e);
	}
});

communitiesRouter.put("/:id", requireAuth, async (req, res) => {
	try {
		const parsed = validate(communityInput, req.body);
		if (!parsed.ok) return res.status(400).json({ error: parsed.error });
		const body = parsed.data;
		const props: Record<string, any> = {};

		if (body.name !== undefined)
			props["Name"] = { title: [{ text: { content: body.name } }] };
		if (body.slug !== undefined)
			props["Slug"] = { rich_text: [{ text: { content: body.slug } }] };
		if (body.region !== undefined)
			props["Region"] = { select: { name: body.region } };
		if (body.topics !== undefined)
			props["Topic"] = {
				multi_select: body.topics.map((t: string) => ({ name: t })),
			};
		if (body.members !== undefined)
			props["Members"] = { rich_text: [{ text: { content: body.members } }] };
		if (body.founded !== undefined) props["Founded"] = { number: body.founded };
		if (body.description !== undefined)
			props["Description"] = {
				rich_text: [{ text: { content: body.description } }],
			};
		if (body.communityPage !== undefined)
			props["Community Page"] = { url: body.communityPage || null };
		if (body.logoUrl !== undefined)
			props["Logo URL"] = { url: body.logoUrl || null };
		if (body.status !== undefined)
			props["Status"] = { select: { name: body.status } };
		if (body.approved !== undefined)
			props["Approved"] = { checkbox: body.approved };

		const updated = (await notion.pages.update({
			page_id: req.params.id,
			properties: props,
		})) as any;
		res.json(parseCommunity(updated));
	} catch (e) {
		serverError(res, e);
	}
});

// Public: submit organizer contact linked to a community
communitiesRouter.post(
	"/submit-leader",
	publicSubmitLimiter,
	async (req, res) => {
		try {
			const parsed = validate(submitLeaderInput, req.body);
			if (!parsed.ok) return res.status(400).json({ error: parsed.error });
			const { name, email, role, communityId } = parsed.data;

			// Confirm the community actually exists before linking a leader to it.
			try {
				await notion.pages.retrieve({ page_id: communityId });
			} catch {
				return res.status(400).json({ error: "Comunidade inválida." });
			}

			await notion.pages.create({
				parent: { database_id: COMMUNITY_LEADERS_DB },
				properties: {
					Name: { title: [{ text: { content: name?.trim() ?? "" } }] },
					mail: { email: email.trim() },
					...(role?.trim() ? { Role: { select: { name: role.trim() } } } : {}),
					"Community that leads": { relation: [{ id: communityId }] },
				},
			});
			res.json({ ok: true });
		} catch (e) {
			serverError(res, e);
		}
	},
);

// Public submission — always unapproved
communitiesRouter.post("/submit", publicSubmitLimiter, async (req, res) => {
	try {
		const parsed = validate(communitySubmitInput, req.body);
		if (!parsed.ok) return res.status(400).json({ error: parsed.error });
		const body = parsed.data;
		const foundedNum =
			body.founded !== undefined ? parseInt(String(body.founded), 10) : NaN;
		const page = (await notion.pages.create({
			parent: { database_id: COMMUNITIES_DB() },
			properties: {
				Name: { title: [{ text: { content: body.name.trim() } }] },
				Slug: { rich_text: [{ text: { content: "" } }] },
				Region: { select: { name: body.region ?? "Lisboa" } },
				Topic: {
					multi_select: (body.topics ?? []).map((t: string) => ({ name: t })),
				},
				...(Number.isFinite(foundedNum)
					? { Founded: { number: foundedNum } }
					: {}),
				Description: {
					rich_text: [{ text: { content: body.description ?? "" } }],
				},
				"Community Page": { url: body.communityPage?.trim() || null },
				Status: { select: { name: "Active" } },
				Approved: { checkbox: false },
			},
		})) as any;
		res.json({ ok: true, id: page.id });
	} catch (e) {
		serverError(res, e);
	}
});

communitiesRouter.post("/", requireAuth, async (req, res) => {
	try {
		const parsed = validate(communityInput, req.body);
		if (!parsed.ok) return res.status(400).json({ error: parsed.error });
		const body = parsed.data;
		const page = (await notion.pages.create({
			parent: { database_id: COMMUNITIES_DB() },
			properties: {
				Name: { title: [{ text: { content: body.name ?? "" } }] },
				Slug: { rich_text: [{ text: { content: body.slug ?? "" } }] },
				Region: { select: { name: body.region ?? "Lisboa" } },
				Topic: {
					multi_select: (body.topics ?? []).map((t: string) => ({ name: t })),
				},
				Members: { rich_text: [{ text: { content: body.members ?? "" } }] },
				Founded: { number: body.founded ?? null },
				Description: {
					rich_text: [{ text: { content: body.description ?? "" } }],
				},
				Status: { select: { name: body.status ?? "Active" } },
				Approved: { checkbox: body.approved ?? false },
			},
		})) as any;
		res.json(parseCommunity(page));
	} catch (e) {
		serverError(res, e);
	}
});

communitiesRouter.delete("/:id", requireAuth, async (req, res) => {
	try {
		await notion.pages.update({ page_id: req.params.id, archived: true });
		res.json({ ok: true });
	} catch (e) {
		serverError(res, e);
	}
});

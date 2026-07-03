import { Router } from "express";
import {
	notion,
	EVENTS_DB,
	getEvents,
	pageInDatabase,
	parseEvent,
} from "../notion.js";
import { verifyAdminSession } from "./auth.js";
import { getPortalSession } from "./portal.js";
import { serverError } from "../lib/http.js";
import { validate, eventInput } from "../lib/validation.js";

export const eventsRouter = Router();

function requireAdminOrPortal(req: any, res: any, next: any) {
	if (verifyAdminSession(req) || getPortalSession(req)) return next();
	res.status(401).json({ error: "Não autorizado." });
}

eventsRouter.get("/", async (req, res) => {
	try {
		const wantAll = req.query.all === "true";
		const includePast = req.query.past === "true";

		// Admins can list every unapproved event.
		if (wantAll && verifyAdminSession(req)) {
			return res.json(await getEvents(true, includePast));
		}

		// Community leaders see approved events plus their OWN pending ones —
		// never other communities' drafts.
		const portal = wantAll ? getPortalSession(req) : null;
		if (portal) {
			const all = await getEvents(true, includePast);
			const scoped = all.filter(
				(e) =>
					e.approved ||
					e.communityIds.some((id) => portal.communityIds.includes(id)),
			);
			return res.json(scoped);
		}

		// Public: approved events only.
		res.json(await getEvents(false, includePast));
	} catch (e) {
		serverError(res, e);
	}
});

eventsRouter.get("/:id", async (req, res) => {
	try {
		const page = (await notion.pages.retrieve({
			page_id: req.params.id,
		})) as any;
		if (!pageInDatabase(page, EVENTS_DB())) {
			return res.status(404).json({ error: "Evento não encontrado." });
		}
		const event = parseEvent(page);
		// Don't expose unapproved events to the public; only admins or owning leaders.
		if (!event.approved) {
			const portal = getPortalSession(req);
			const owns =
				!!portal &&
				event.communityIds.some((id) => portal.communityIds.includes(id));
			if (!verifyAdminSession(req) && !owns) {
				return res.status(404).json({ error: "Evento não encontrado." });
			}
		}
		res.json(event);
	} catch (e) {
		serverError(res, e);
	}
});

eventsRouter.put("/:id", requireAdminOrPortal, async (req, res) => {
	try {
		const parsed = validate(eventInput, req.body);
		if (!parsed.ok) return res.status(400).json({ error: parsed.error });
		const body: Record<string, any> = parsed.data;
		const portalSession = getPortalSession(req);

		if (portalSession) {
			const existing = (await notion.pages.retrieve({
				page_id: req.params.id,
			})) as any;
			const existingEvent = parseEvent(existing);
			const owns = existingEvent.communityIds.some((id: string) =>
				portalSession.communityIds.includes(id),
			);
			if (!owns)
				return res
					.status(403)
					.json({ error: "Sem permissão para editar este evento." });
			delete body.approved;
			delete body.communityIds;
		}

		const props: Record<string, any> = {};
		if (body.name !== undefined)
			props["Name"] = { title: [{ text: { content: body.name } }] };
		if (body.description !== undefined)
			props["Description"] = {
				rich_text: [{ text: { content: body.description } }],
			};
		if (body.venue !== undefined)
			props["Venue"] = { rich_text: [{ text: { content: body.venue } }] };
		if (body.date !== undefined)
			props["Date"] = { date: body.date ? { start: body.date } : null };
		if (body.region !== undefined)
			props["Region"] = { select: { name: body.region } };
		if (body.format !== undefined)
			props["Format"] = { select: { name: body.format } };
		if (body.topics !== undefined)
			props["Topic"] = {
				multi_select: body.topics.map((t: string) => ({ name: t })),
			};
		if (body.eventUrl !== undefined)
			props["Event URL"] = { url: body.eventUrl || null };
		if (body.price !== undefined)
			props["Price"] = { select: { name: body.price } };
		if (body.approved !== undefined)
			props["Approved"] = { checkbox: body.approved };
		if (body.communityIds !== undefined)
			props["Community"] = {
				relation: body.communityIds.map((id: string) => ({ id })),
			};

		const updated = (await notion.pages.update({
			page_id: req.params.id,
			properties: props,
		})) as any;
		res.json(parseEvent(updated));
	} catch (e) {
		serverError(res, e);
	}
});

eventsRouter.post("/", requireAdminOrPortal, async (req, res) => {
	try {
		const parsed = validate(eventInput, req.body);
		if (!parsed.ok) return res.status(400).json({ error: parsed.error });
		const body = parsed.data;
		const portalSession = getPortalSession(req);

		// community auth: force communityIds and always pending approval
		const communityIds = portalSession
			? portalSession.communityIds
			: (body.communityIds ?? []);
		const approved = portalSession ? false : (body.approved ?? false);

		const page = (await notion.pages.create({
			parent: { database_id: EVENTS_DB() },
			properties: {
				Name: { title: [{ text: { content: body.name ?? "" } }] },
				Description: {
					rich_text: [{ text: { content: body.description ?? "" } }],
				},
				Venue: { rich_text: [{ text: { content: body.venue ?? "" } }] },
				Date: body.date ? { date: { start: body.date } } : { date: null },
				Region: { select: { name: body.region ?? "Lisboa" } },
				Format: { select: { name: body.format ?? "Meetup" } },
				Topic: {
					multi_select: (body.topics ?? []).map((t: string) => ({ name: t })),
				},
				Price: { select: { name: body.price ?? "Free" } },
				Approved: { checkbox: approved },
				Community: { relation: communityIds.map((id: string) => ({ id })) },
			},
		})) as any;
		res.json(parseEvent(page));
	} catch (e) {
		serverError(res, e);
	}
});

eventsRouter.delete("/:id", requireAdminOrPortal, async (req, res) => {
	try {
		const portalSession = getPortalSession(req);

		if (portalSession) {
			const existing = (await notion.pages.retrieve({
				page_id: req.params.id,
			})) as any;
			const existingEvent = parseEvent(existing);
			const owns = existingEvent.communityIds.some((id: string) =>
				portalSession.communityIds.includes(id),
			);
			if (!owns)
				return res
					.status(403)
					.json({ error: "Sem permissão para apagar este evento." });
		}

		await notion.pages.update({ page_id: req.params.id, archived: true });
		res.json({ ok: true });
	} catch (e) {
		serverError(res, e);
	}
});

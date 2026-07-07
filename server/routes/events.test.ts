import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { makeNotionMock } from "../test/notion-mock.js";

// Mock the dependency notion.ts actually delegates to — `@notionhq/client` —
// instead of "../notion.js" directly, so the router gets the REAL parseEvent
// helper while `notion.pages.*` resolve to our mock (see communities.test.ts).
const mock = makeNotionMock();
vi.mock("@notionhq/client", () => ({ Client: vi.fn(() => mock) }));

let adminOk = false;
let portal: { communityIds: string[] } | null = null;
vi.mock("./auth.js", () => ({
	verifyAdminSession: () => adminOk,
	requireAuth: (_r: any, _s: any, n: any) => n(),
}));
vi.mock("./portal.js", () => ({
	getPortalSession: () => portal,
}));

const { eventsRouter } = await import("./events.js");

function app() {
	const a = express();
	a.use(express.json());
	a.use("/api/events", eventsRouter);
	return a;
}

function eventPage(id: string, approved: boolean, commIds: string[]) {
	return {
		id,
		properties: {
			Name: { type: "title", title: [{ plain_text: "E" }] },
			Approved: { checkbox: approved },
			Community: { relation: commIds.map((c) => ({ id: c })) },
		},
	};
}

beforeEach(() => {
	adminOk = false;
	portal = null;
	Object.values(mock.pages).forEach((f: any) => f.mockReset());
});

describe("event ownership", () => {
	it("blocks a portal leader from editing another community's event (403)", async () => {
		portal = { communityIds: ["mine"] };
		mock.pages.retrieve.mockResolvedValueOnce(
			eventPage("e1", true, ["theirs"]),
		);
		await request(app()).put("/api/events/e1").send({ name: "x" }).expect(403);
	});

	it("blocks a portal leader from deleting another community's event (403)", async () => {
		portal = { communityIds: ["mine"] };
		mock.pages.retrieve.mockResolvedValueOnce(
			eventPage("e1", true, ["theirs"]),
		);
		await request(app()).delete("/api/events/e1").expect(403);
	});

	it("lets a portal leader edit their own event", async () => {
		portal = { communityIds: ["mine"] };
		mock.pages.retrieve.mockResolvedValueOnce(eventPage("e1", false, ["mine"]));
		mock.pages.update.mockResolvedValueOnce(eventPage("e1", false, ["mine"]));
		await request(app()).put("/api/events/e1").send({ name: "x" }).expect(200);
	});
});

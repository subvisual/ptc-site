import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { makeNotionMock, queryPage } from "../test/notion-mock.js";

// The brief's originally-specified approach — `vi.mock("../notion.js", async (orig) => ({
// ...await orig(), notion: mock }))` — does not intercept the real helpers' closures in
// Vitest v3 (see server/notion.test.ts for the full explanation). Mock the dependency
// notion.ts actually delegates to — `@notionhq/client` — instead, so the router gets the
// REAL `getLeaders`/`parseLeader` helpers while `notion.pages.*` / `notion.databases.query`
// resolve to our mock.
const mock = makeNotionMock();
vi.mock("@notionhq/client", () => ({ Client: vi.fn(() => mock) }));
// Admin session always valid for these tests.
vi.mock("./auth.js", () => ({
	requireAuth: (_req: any, _res: any, next: any) => next(),
	verifyAdminSession: () => true,
}));

const { communitiesRouter } = await import("./communities.js");

function app() {
	const a = express();
	a.use(express.json());
	a.use(cookieParser());
	a.use("/api/communities", communitiesRouter);
	return a;
}

beforeEach(() => {
	mock.databases.query.mockReset();
	mock.pages.create.mockReset();
	mock.pages.retrieve.mockReset();
	mock.pages.update.mockReset();
});

describe("submit-leader", () => {
	it("creates the leader as unapproved", async () => {
		mock.pages.retrieve.mockResolvedValueOnce({
			id: "c1",
			parent: {
				type: "database_id",
				database_id: "358caae5-8631-80b0-af88-d19d858259f5",
			},
			properties: {},
		});
		mock.pages.create.mockResolvedValueOnce({ id: "l1", properties: {} });
		await request(app())
			.post("/api/communities/submit-leader")
			.send({ email: "x@y.com", communityId: "c1" })
			.expect(200);
		const props = mock.pages.create.mock.calls[0][0].properties;
		expect(props.Approved).toEqual({ checkbox: false });
	});
});

describe("GET /leaders", () => {
	it("lists pending leaders (not captured by /:id)", async () => {
		mock.databases.query.mockResolvedValueOnce(
			queryPage([
				{
					id: "l1",
					properties: {
						mail: { email: "x@y.com" },
						Approved: { checkbox: false },
					},
				},
			]),
		);
		const res = await request(app())
			.get("/api/communities/leaders?pending=true")
			.expect(200);
		expect(res.body[0].notionId).toBe("l1");
	});
});

describe("PUT /leaders/:id", () => {
	it("approves a leader", async () => {
		mock.pages.update.mockResolvedValueOnce({
			id: "l1",
			properties: { Approved: { checkbox: true } },
		});
		const res = await request(app())
			.put("/api/communities/leaders/l1")
			.send({ approved: true })
			.expect(200);
		expect(mock.pages.update.mock.calls[0][0].properties.Approved).toEqual({
			checkbox: true,
		});
		expect(res.body.approved).toBe(true);
	});
});

describe("GET /:id database-membership guard", () => {
	it("404s a page that is not in the communities DB", async () => {
		mock.pages.retrieve.mockResolvedValueOnce({
			id: "p1",
			parent: { type: "database_id", database_id: "some-other-db" },
			properties: { Approved: { checkbox: true } },
		});
		await request(app()).get("/api/communities/p1").expect(404);
	});
});

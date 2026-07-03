import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeNotionMock, queryPage } from "./test/notion-mock.js";

// The brief's originally-specified approach — `vi.mock("./notion.js", async (orig) => ({
// ...await orig(), notion: mock }))` — does not intercept `queryAll`'s calls in Vitest v3.
// `queryAll` is a real function defined inside notion.ts; its body references the
// module-local `notion` binding via closure, not the object this factory returns. Spreading
// `actual` and overriding the `notion` *property* on the returned object only changes what
// other modules see when they `import { notion } from "./notion.js"` — it can't rebind the
// closure that the real (already-defined) `queryAll` captured over the real `notion` proxy.
// So the test still drove a live `notion.databases.query()` call and failed with the SDK's
// "API token is invalid" error.
//
// Fix (test-only): mock the dependency `notion.ts` actually delegates to — `@notionhq/client`
// — instead of trying to self-mock `./notion.js`. `getClient()` in notion.ts does
// `new Client(...)`; mocking `Client` to return our fake `databases.query` object means the
// real `notion` Proxy (untouched, still production code) forwards property access straight to
// our mock, and `queryAll` (also untouched) genuinely gets intercepted.
const mock = makeNotionMock();
vi.mock("@notionhq/client", () => ({
	Client: vi.fn(() => mock),
}));

const { queryAll, getLeaderByEmail, parseLeader, getLeaders } = await import(
	"./notion.js"
);

beforeEach(() => {
	mock.databases.query.mockReset();
});

describe("queryAll", () => {
	it("concatenates results across pages", async () => {
		mock.databases.query
			.mockResolvedValueOnce(queryPage([{ id: "a" }], true, "cur1"))
			.mockResolvedValueOnce(queryPage([{ id: "b" }], false, null));
		const rows = await queryAll({ database_id: "db" });
		expect(rows.map((r: any) => r.id)).toEqual(["a", "b"]);
		expect(mock.databases.query).toHaveBeenCalledTimes(2);
	});
});

function leaderPage(
	id: string,
	email: string,
	approved: boolean,
	commIds: string[],
) {
	return {
		id,
		properties: {
			Name: { type: "title", title: [{ plain_text: "L" }] },
			mail: { email },
			Role: { select: { name: "Organizer" } },
			"Community that leads": { relation: commIds.map((c) => ({ id: c })) },
			Approved: { checkbox: approved },
		},
	};
}

describe("getLeaderByEmail", () => {
	it("returns null when only unapproved records match", async () => {
		mock.databases.query.mockResolvedValueOnce(queryPage([]));
		const r = await getLeaderByEmail("x@y.com");
		expect(r).toBeNull();
		// the query must include an Approved=true filter
		const arg = mock.databases.query.mock.calls[0][0];
		expect(JSON.stringify(arg)).toContain("Approved");
	});

	it("merges communityIds across approved records", async () => {
		mock.databases.query.mockResolvedValueOnce(
			queryPage([
				leaderPage("l1", "x@y.com", true, ["c1"]),
				leaderPage("l2", "x@y.com", true, ["c2"]),
			]),
		);
		const r = await getLeaderByEmail("x@y.com");
		expect(r?.communityIds.sort()).toEqual(["c1", "c2"]);
	});
});

describe("getLeaders", () => {
	it("parses pending leaders", async () => {
		mock.databases.query.mockResolvedValueOnce(
			queryPage([leaderPage("l1", "x@y.com", false, ["c1"])]),
		);
		const rows = await getLeaders(true);
		expect(rows[0]).toMatchObject({
			notionId: "l1",
			email: "x@y.com",
			approved: false,
			communityIds: ["c1"],
		});
	});
});

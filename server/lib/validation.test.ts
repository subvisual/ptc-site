import { describe, it, expect } from "vitest";
import {
	validate,
	loginInput,
	eventInput,
	communitySubmitInput,
	configInput,
} from "./validation.js";

describe("validate", () => {
	it("accepts a well-formed login body", () => {
		const r = validate(loginInput, { password: "abc" });
		expect(r.ok).toBe(true);
	});
	it("rejects a missing password", () => {
		const r = validate(loginInput, {});
		expect(r.ok).toBe(false);
	});
});

describe("httpUrl scheme validation", () => {
	it("rejects javascript: in eventUrl", () => {
		const r = validate(eventInput, { eventUrl: "javascript:alert(1)" });
		expect(r.ok).toBe(false);
	});
	it("rejects data: URLs", () => {
		const r = validate(eventInput, {
			eventUrl: "data:text/html,<script>1</script>",
		});
		expect(r.ok).toBe(false);
	});
	it("accepts https URLs", () => {
		const r = validate(eventInput, { eventUrl: "https://meetup.com/x" });
		expect(r.ok).toBe(true);
	});
	it("accepts an empty string (field cleared)", () => {
		const r = validate(eventInput, { eventUrl: "" });
		expect(r.ok).toBe(true);
	});
	it("rejects javascript: in community submit page", () => {
		const r = validate(communitySubmitInput, {
			name: "X",
			communityPage: "javascript:1",
		});
		expect(r.ok).toBe(false);
	});
	it("rejects javascript: in config social URL", () => {
		const r = validate(configInput, { twitterUrl: "javascript:1" });
		expect(r.ok).toBe(false);
	});
});

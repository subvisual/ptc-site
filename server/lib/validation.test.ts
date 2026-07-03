import { describe, it, expect } from "vitest";
import { validate, loginInput } from "./validation.js";

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

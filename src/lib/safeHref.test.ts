import { describe, it, expect } from "vitest";
import { safeHref } from "./safeHref";

describe("safeHref", () => {
	it("passes through https URLs", () => {
		expect(safeHref("https://x.com")).toBe("https://x.com");
	});
	it("neutralizes javascript: URLs", () => {
		expect(safeHref("javascript:alert(1)")).toBe("#");
	});
	it("returns # for empty/undefined", () => {
		expect(safeHref("")).toBe("#");
		expect(safeHref(undefined)).toBe("#");
	});
});

import { vi } from "vitest";

export function queryPage(
	results: any[],
	hasMore = false,
	nextCursor: string | null = null,
) {
	return { results, has_more: hasMore, next_cursor: nextCursor };
}

export function makeNotionMock() {
	return {
		databases: { query: vi.fn() },
		pages: {
			retrieve: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
	};
}

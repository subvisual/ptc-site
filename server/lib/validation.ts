import { z } from "zod";

// Shared field primitives with length caps to bound what we write into Notion.
const shortStr = z.string().max(200);
const longStr = z.string().max(5000);
const urlStr = z
	.string()
	.max(500)
	.trim()
	.refine((v) => v === "" || /^https?:\/\//i.test(v), {
		message: "URL deve começar por http:// ou https://",
	});
const topicList = z.array(z.string().max(80)).max(30);
const idList = z.array(z.string().max(100)).max(50);

// z.object strips unknown keys by default, so extra fields can't be injected.

export const eventInput = z.object({
	name: shortStr.optional(),
	description: longStr.optional(),
	venue: shortStr.optional(),
	date: shortStr.nullable().optional(),
	region: shortStr.optional(),
	format: shortStr.optional(),
	topics: topicList.optional(),
	eventUrl: urlStr.optional(),
	price: shortStr.optional(),
	approved: z.boolean().optional(),
	communityIds: idList.optional(),
});

export const communityInput = z.object({
	name: shortStr.optional(),
	slug: shortStr.optional(),
	region: shortStr.optional(),
	topics: topicList.optional(),
	members: shortStr.optional(),
	founded: z.number().nullable().optional(),
	description: longStr.optional(),
	communityPage: urlStr.optional(),
	logoUrl: urlStr.optional(),
	status: shortStr.optional(),
	approved: z.boolean().optional(),
});

export const communitySubmitInput = z.object({
	name: shortStr.min(1),
	description: longStr.optional(),
	communityPage: urlStr.optional(),
	region: shortStr.optional(),
	topics: topicList.optional(),
	founded: z.union([z.number(), z.string().max(10)]).optional(),
});

export const submitLeaderInput = z.object({
	name: shortStr.optional(),
	email: z.string().email().max(200),
	role: shortStr.optional(),
	communityId: z.string().min(1).max(100),
});

export const magicLinkInput = z.object({
	email: z.string().email().max(200),
});

export const leaderUpdateInput = z.object({
	approved: z.boolean(),
});

export const loginInput = z.object({
	password: z.string().min(1).max(200),
});

const faqItem = z.object({ q: shortStr, a: longStr });

export const configInput = z.object({
	aboutText: longStr.optional(),
	faqs: z.array(faqItem).max(50).optional(),
	notionFormUrl: urlStr.optional(),
	contactFormUrl: urlStr.optional(),
	newsletterUrl: urlStr.optional(),
	whatsappUrl: urlStr.optional(),
	telegramUrl: urlStr.optional(),
	twitterUrl: urlStr.optional(),
	linkedinUrl: urlStr.optional(),
	instagramUrl: urlStr.optional(),
});

export type Validated<S extends z.ZodTypeAny> = z.infer<S>;

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Parse `data` against `schema`, returning either the typed value or a message. */
export function validate<T>(
	schema: z.ZodType<T>,
	data: unknown,
): ValidateResult<T> {
	const result = schema.safeParse(data);
	if (result.success) return { ok: true, data: result.data };
	const issue = result.error.issues[0];
	const path = issue?.path.join(".");
	return {
		ok: false,
		error: path
			? `${path}: ${issue.message}`
			: (issue?.message ?? "Dados inválidos."),
	};
}

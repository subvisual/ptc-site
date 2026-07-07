export function safeHref(url?: string): string {
	if (!url) return "#";
	return /^https?:\/\//i.test(url.trim()) ? url : "#";
}

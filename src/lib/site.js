const DEFAULT_SITE_URL = 'https://kjv-bible-7mw.pages.dev';

const configuredSiteUrl = import.meta.env.PUBLIC_SITE_URL;

export function normalizeSiteUrl(value, fallback = DEFAULT_SITE_URL) {
	const candidate = (value || fallback || DEFAULT_SITE_URL).trim();

	if (!candidate) return DEFAULT_SITE_URL;

	try {
		const parsed = new URL(candidate.includes('://') ? candidate : `https://${candidate}`);
		return parsed.origin;
	} catch {
		return DEFAULT_SITE_URL;
	}
}

export const SITE_URL = normalizeSiteUrl(configuredSiteUrl);
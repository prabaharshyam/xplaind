// The public address, for the sitemap and absolute links. Set NEXT_PUBLIC_SITE_URL
// in the host's environment settings; the default is the domain in use.
export const siteUrl = (): string => (process.env.NEXT_PUBLIC_SITE_URL || "https://xplaind.in").replace(/\/$/, "");

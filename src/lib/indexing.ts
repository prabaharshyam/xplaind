// Search engines stay out until launch. Set ALLOW_INDEXING=1 in the host's
// environment settings on launch day (slice S8); nothing else needs to change.
export const allowIndexing = (): boolean => process.env.ALLOW_INDEXING === "1";

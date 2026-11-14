// PR-1: the README of a public GitHub repository, read for a project review. Only github.com links
// are fetched, and only from raw.githubusercontent.com, so a link cannot make the server fetch
// anything else. Nothing is stored.

/** owner and repo from a GitHub link, or null. Pure. */
export function githubRepo(url: string): { owner: string; repo: string } | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || (u.hostname !== "github.com" && u.hostname !== "www.github.com")) return null;
  const [owner, repo] = u.pathname.replace(/^\/+/, "").split("/");
  const ok = (s: string | undefined) => !!s && /^[A-Za-z0-9_.-]{1,100}$/.test(s) && s !== "." && s !== "..";
  if (!ok(owner) || !ok(repo)) return null;
  return { owner: owner!, repo: repo!.replace(/\.git$/, "") };
}

/** The repository's README, cut to `max` characters, or "" when there is none or it cannot be read in time. */
export async function readme(url: string, max = 12_000): Promise<string> {
  const r = githubRepo(url);
  if (!r) return "";
  for (const name of ["README.md", "readme.md", "README.rst", "README"]) {
    const res = await fetch(`https://raw.githubusercontent.com/${r.owner}/${r.repo}/HEAD/${name}`, { signal: AbortSignal.timeout(8000), redirect: "error" }).catch(() => null);
    if (res?.ok) return (await res.text()).slice(0, max);
  }
  return "";
}

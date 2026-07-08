const BLOCKED_EXACT_PATHS = new Set([
  "/package.json",
  "/package-lock.json",
  "/README.md",
  "/wrangler.jsonc",
  "/atawi-comedy-skill.md",
  "/build_site.js"
]);

const BLOCKED_PREFIXES = [
  "/.agents/",
  "/.codex/",
  "/.git/",
  "/.github/",
  "/.wrangler/",
  "/articles-md/",
  "/docs/",
  "/scripts/"
];

function isBlockedPath(pathname) {
  return BLOCKED_EXACT_PATHS.has(pathname) ||
    BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);

  if (isBlockedPath(pathname)) {
    return new Response("Not found\n", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex"
      }
    });
  }

  return context.next();
}

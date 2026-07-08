# ATAWI COMEDY

ATAWI COMEDY is a static sibling site of ATAWI MUSIC for official comedy videos.

Core settings:

- Site name: ATAWI COMEDY
- Domain: https://atawicomedy.link/
- Cloudflare Pages project: atawi-comedy
- Branch: main
- Build command: empty
- Build output directory: /
- Selection axes: 間 / 世界 / ワード
- Published videos: official or official-related YouTube only
- Current recovery floor: at least 16 published article pages
- Production deploy command: `npm run deploy:production`

Before deploying, run `npm run verify`. The check fails if `data/videos.json`,
article HTML files, `sitemap.xml`, or footer injection fall back to an older
short version.


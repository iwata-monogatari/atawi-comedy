import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const minPublishedVideos = Number(process.env.MIN_PUBLISHED_VIDEOS || 16);

function fail(message) {
  console.error(`verify-site: ${message}`);
  process.exitCode = 1;
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function listHtmlFiles(relativeDir) {
  return fs
    .readdirSync(path.join(root, relativeDir), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => path.posix.join(relativeDir, entry.name));
}

let videos = [];
try {
  videos = JSON.parse(readText("data/videos.json"));
} catch (error) {
  fail(`data/videos.json is not valid UTF-8 JSON: ${error.message}`);
}

if (!Array.isArray(videos)) {
  fail("data/videos.json must contain a JSON array");
  videos = [];
}

const publishedVideos = videos.filter(
  (video) => video.status === "published" && video.official_status === "verified"
);

if (publishedVideos.length < minPublishedVideos) {
  fail(
    `published verified videos fell to ${publishedVideos.length}; expected at least ${minPublishedVideos}`
  );
}

const articleFiles = listHtmlFiles("articles").filter((file) => file !== "articles/index.html");

if (articleFiles.length < minPublishedVideos) {
  fail(`article HTML files fell to ${articleFiles.length}; expected at least ${minPublishedVideos}`);
}

for (const video of publishedVideos) {
  if (!video.id) {
    fail("published video is missing id");
    continue;
  }
  if (!video.article_url) {
    fail(`${video.id} is missing article_url`);
    continue;
  }

  const articlePath = video.article_url.replace(/^\//, "");
  if (!exists(articlePath)) {
    fail(`${video.id} points to missing article file: ${video.article_url}`);
  }
}

let sitemap = "";
try {
  sitemap = readText("sitemap.xml");
} catch (error) {
  fail(`sitemap.xml could not be read: ${error.message}`);
}

for (const video of publishedVideos) {
  if (video.article_url && !sitemap.includes(`https://atawicomedy.link${video.article_url}`)) {
    fail(`${video.id} is missing from sitemap.xml`);
  }
}

const articleHtmlFiles = listHtmlFiles("articles");
const htmlFilesToCheck = [
  "index.html",
  "about.html",
  "contact.html",
  "home-and-memory.html",
  "oishi-selection-viewpoint.html",
  "playlist/index.html",
  ...articleHtmlFiles
];

for (const file of htmlFilesToCheck) {
  const html = readText(file);
  const hasFooterTarget = html.includes("data-site-footer");
  const hasFooterScript = html.includes("/assets/js/footer.js");

  if (hasFooterTarget !== hasFooterScript) {
    fail(`${file} has mismatched footer target/script`);
  }
}

if (!exists("assets/js/footer.js")) {
  fail("assets/js/footer.js is missing");
}

if (!exists("wrangler.jsonc") || !readText("wrangler.jsonc").includes('"name": "atawi-comedy"')) {
  fail("wrangler.jsonc must target the atawi-comedy Pages project");
}

const redirects = readText("_redirects");
const middleware = readText("functions/_middleware.js");
const protectedPaths = [
  "/package.json",
  "/README.md",
  "/wrangler.jsonc",
  "/.github/*",
  "/scripts/*",
  "/articles-md/*"
];

for (const protectedPath of protectedPaths) {
  if (!redirects.includes(`${protectedPath} /404.html 404`)) {
    fail(`${protectedPath} must be blocked in _redirects`);
  }
}

const middlewareNeedles = [
  '"/package.json"',
  '"/.github/"',
  '"/articles-md/"',
  'status: 404',
  "context.next()"
];

for (const needle of middlewareNeedles) {
  if (!middleware.includes(needle)) {
    fail(`functions/_middleware.js is missing ${needle}`);
  }
}

if (process.exitCode) {
  process.exit();
}

console.log(
  `verify-site: ok (${publishedVideos.length} published videos, ${articleFiles.length} article pages)`
);

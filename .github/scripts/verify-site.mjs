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

import {setTimeout as wait} from 'node:timers/promises';
const targets=JSON.parse(fs.readFileSync('.github/scripts/prod-targets.json','utf8'));
const site='https://atawicomedy.link';let ready=false;
for(let i=0;i<20;i++){try{const response=await fetch(site+'/guides/konto-manzai/?fga_internal=1');if(response.ok&&(await response.text()).includes('7組のコント・漫才を公式動画で見る')){ready=true;break;}}catch{}await wait(5000);}
if(!ready)throw Error('Production not yet ready');
const failures=[];let cursor=0,ok=0;
async function worker(){while(cursor<targets.length){const [url,...tokens]=targets[cursor++];let error='';let pass=false;for(let n=0;n<3;n++){try{const res=await fetch(site+url+'?fga_internal=1',{signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error('HTTP '+res.status);const html=await res.text();if(!tokens.every(t=>html.includes(t)))throw Error('content mismatch');pass=true;break;}catch(e){error=e.message;await wait(900);}}if(pass)ok++;else failures.push([url,error]);await wait(80);}}
await Promise.all(Array.from({length:5},worker));const data=await (await fetch(site+'/data/videos.json?fga_internal=1')).json();const count=data.filter(x=>x.status==='published'&&x.official_status==='verified').length;console.log('PRODUCTION_REPORT '+JSON.stringify({checked:targets.length,ok,count,failures}));if(failures.length||count!==1000)process.exitCode=1;
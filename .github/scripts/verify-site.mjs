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

// This one-off check runs on the verification branch, without changing the production site.
import {setTimeout as pause} from 'node:timers/promises';
const inputs = JSON.parse(fs.readFileSync('.github/scripts/link-candidates.json','utf8'));
const report=[];
let cursor=0, throttled=false;
async function worker() {
  while(cursor<inputs.length && !throttled){
    const entry=inputs[cursor++]; const [id,needDetails]=entry;
    const watch='https://www.youtube.com/watch?v='+id;
    try{
      const response=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(watch),{signal:AbortSignal.timeout(14000)});
      const result={id,status:response.status};
      if(response.status===429){throttled=true;}
      if(response.ok){
        const data=await response.json();
        Object.assign(result,{title:data.title,channel:data.author_name,channel_url:data.author_url});
        if(needDetails){
          const page=await fetch(watch,{signal:AbortSignal.timeout(14000)});
          if(page.ok){const html=await page.text();
            const prop=(k)=>{const tag=html.match(new RegExp('<meta\\s[^>]*itemprop=["\x27]'+k+'["\x27][^>]*>','i'))?.[0];return tag?.match(/content=["']([^"']+)/i)?.[1];};
            result.date=prop('uploadDate');result.duration=prop('duration');const regions=prop('regionsAllowed');if(regions)result.jp=regions.split(',').includes('JP');
          }
          if(page.status===429){throttled=true;}
        }
      }
      report.push(result);
    }catch(error){report.push({id,status:0,error:error.message});}
    await pause(120);
  }
}
await Promise.all(Array.from({length:4},worker));
for(let i=0;i<report.length;i+=8){
  console.log('LINKCHECK '+Buffer.from(JSON.stringify(report.slice(i,i+8))).toString('base64'));
}
console.log('Audited',report.length,'of',inputs.length, 'YouTube watch URLs');

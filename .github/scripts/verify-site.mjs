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

import {execFileSync} from 'node:child_process';
const f=process.env.RUNNER_TEMP+'/channel-inventory';
execFileSync('python3',['-m','pip','install','--quiet','--target',f,'yt-dlp'],{stdio:'inherit',timeout:90000});
const include=new Set(["3jN_fXSw7RE","Qhx32TWhiTM","C13AZwqG-CI","AaBsjN7-V-I","hwI9T2c-ngo","FePI9xYhQHk","_kXrQNPyYbQ","u3g2iB7ecR0","dyNdzlrsaV4","5OzEJWQrauI","bQYqPZT4ubc","tFi262jWJZI","0sSgZtsZKdY","fU32d8OUMlo","8U-aHBt0jh4","qP-grgjZcn8","kKwwQ9NaSKE","W8hmqCSxKB4","uXI4I2ZADvw","dTWwweGtSks","BQ-TxQX8iYA","SMnKt_2f8To","N6CqWntWBEk","R3hs_0Ra7nI","ODrpE50itt8","-IneAMhp3zA","8DU-5Vh_R5w","zZyYpk4ygtA","7YAoK5NmOQA","Q8Tj8qtIUwk","3ShZdJ2lp44","IJR1v-rMaAI","YUgGEIRvuL8","hVrumpaf90E","reEClXmcswk","4LcvyjJi9Os","uXi36SPAQpI","pAfSVrpuBf4","lAMabiPcBk4","4D6XDiBuCag","D_KrEOcG9lE","DDyu2gISLmw","Kn-dGoEX1ME","-S5efG3dc5c","sCxrTDfBgD0","5wGgVuHnSh8","qRxH8QHEuJQ","8j9C1DVYlXE","9d5vS_Zndek","qZny-HDjZL0","ibHN9W3laGU","T6JGnOp8Jpw","tlECYW_R0LE","VasuG0HPuwI","CrsnASyxL0I","JT3q6PbjE4w","GK2lOO8ft-8","iGHXTwpvDgg","5HC9zrO8AAY","pBb5SqmawD4","brB6WLvs4I4","cr1gl0bmB5U","NAYMXed5RvY","oE-RNAGVE6k","PmI8yQWDarA","nR0FVEatsFQ","G2X-iB3KbXY","48W0rjXplI4","daC6R7X9a7E","UdTeiZ8JF-E","whOnCs2wk7U","FcnR4bmrir4","j-AkzTiBlVg","mKHU7_A4l-M","MSUW5qDyejc","vDwiBw20tCw","-3P6e3V94TE","ikkBaq6khuU","EDv-gNkkd88","huJ93g_kGjU","9lYwvpIhT1U","0bSK8XHe8rU","vb7L27fmVTU","c570Ytj9N2Y","RTuJ2kyJmk4","62Ap-AMqIH4","boyYlK3MxzU","PJfv9bkZZTY","qWX5VBZuGpQ","_RebsYEHikU","n5EYV0YHFj4","Q2pNxV4cr9s","9ciNCXxu3Fk","jkynCaxLjrg","XyYAgGiHYwg","aF5wncOvYjA","TuZRsrgeMM0","q6QYAcF9Uoc","cnALwCUp_Mk","0_4Yq_nDW1o","JALzgOlGqxg","Sn25JX0gdcs","MN9F7wPwJWo","67E5p6N0tFs","SAyxqtTnzZI","vaAAtmxBwMk","WHIc2T2oqb0","pbgnc3BuqW8","XrhkDnSmFjU","IQHg0EQuRv0","CS40jh5sl64","P3CuHJ1tThM","obzhopOubpk","OoSnCF-b15Q","gftvGSuKso0","HsD8_-ypTqY","ywsyZNylaT8","Pw_x-QeKDDQ","QRovHA6mzjw","CmD8xIn0CRg","rk0A7uQHBvQ","b0Q5UkVLSjI","wRW3DbNf-m8","errLVgGJ574","FTHyYau5_ig","hQm-Kxw5PV4","l3cC2JHenqA","CXhM8Ds-uJA","a88gqadWS-Y","QResrM_UK6U","zu6fNCEMj1w","Go95MxJ5mis","smIizu2ZOQw","W6Ag64D3_sM","mdgE3P0QlM8","BQ_hcX5_bGE","lPD7ElDHpcs","jkaCctXnUMo","B9sEkjONM2k","JkoXjG0yeYw","_5U90q0WPW0","u0lwbOppKKs","ahABoNy_OAk","lcvODoX--Yg","89ba7jZVGig","n5BNZ_AKHa4","6tlbb2_RwEU","_KDa5DTErpw","gxlMIx7vlGA","objfFWiFQjM","NCjngOYvUJ8","gxHuuYdiFgk","uzmLmzHEbWw","ZIQ48E4MXxA","3bwdE-Dma-k","iBLcboqYkZ0","2lJ_uSAtSlY","MZ_UnCVZtYg","LdCEXnF8TmQ","y0ImMtXwfv0","d-II9QDeado","Rn_sTEJGsfE","1Sy_w9yXfHU","_-iYi2JYZ2Y","IZiRaG-yXI0","eEnMsc1ZqDA","Y3OYKeGbNzQ","DWnc8ag7Vw0","75tyz1s7rkw","-jSkIASQoPM","mtvhjROePVw","x1t_35a0da0","iOGjiaMcwtM","y61Z1ydmM2w","i1Hi7DTiiG8","JBnKsAieAzI","5FejvFO1fM0","qzqRFOdER2M","VB32zuyFBrM","ko0UuEgdavc","1izbHtJ1nLg","1bIZwVDelg0","M8KfKAsao-Y","HNlMff8dMtY","7Ihy3OZb82o","gEB58_WSsko","fWubIFt9ZF0","D0CllwVkxxo","HY0rU5WmK9k","a_UAow986jQ","EEIAqrGJLSc","uuXfw5QdioE","iqqX6de2CNY","Vmx6tJYC8P4","BOjVFZTnEF0","_xA_WvoBL9g","0Zw3Bpu4OLc","rOpvQT39j0s","WRlQ3RYd8dE","IFo25Ut-WlA","LYwE44GmAsE","kVLRsxaKWGI","9dhs6jvNSv0","zVZjfs-rNXQ","4XPS09HBpUE","VEKCLyx062o","C6Xj_pWmTAw","rc6nG-Fj4Fs","Zgj0JaJIMco","DffRzNzXIEE","os_hxNF4694","qFOa1DXBhWg","_QcKHea854c","4Ggv_--Oq_w","2I7R8vmxb2w","bqGReJH-grU","PEAIjOmrOGo","kR7ou8z4wwA","52KywVY4Sq0","BhQGhKaMenc","ISfu76VTdJs","snFbsQb1nFI","3Q8gln2Zbvg","sC5T1l-yT48","kB5eIF9Niy4","0cYKbeKGJpw","AHY1VjuZXyo","8ucKWs-fViw","wlgj373wOpA","HssCy9vHJ8w","KwzJmxPqtSc","Nh76bstUK6k","G2JuMtHsm5Y","uteRHmNcnyM","t4rTFh7LxXQ","qDIllK4BTNA","AxqasBUAl5o","8l_oDwCJ0lE","nl46oYNJJR0","jhhGWsO0KKM","VdNJ_nfhJW8","enoUCj-WNCI","IaBDGFGNYK0","rLOD_Tt0ZpM","q2UcCMyLKdQ","mXLntt3ikt8","HRqPbOZheWg","jUhA-0nNVO0","f0xPUeti-i4","x32mNzbHxVs","tzWbdRU5QSc","vAEitV5SPn0","5lysh4pBctU","68wk8rXPNSY","JBxGRjySZ6Y","57Kx_FBFtPM","5yX3ExKQlLk","Ep8urRGbpf8","iuDw8CX1LAQ","Sw4I46cpWmg","edsi3p9If-s","-RhomIYh8VM","ScGofXnZivg","tA8Wi7LEZ6Q","D3PRCkwPF5k","iXVSRoJMOvI","-ePSLZfmZlw","FAqQ9w-8oGU","2I1HkRu5ZX4","ZvwYat5B_s0","HHHdZ-6-9vU","FcSjj9TUw1w","58XcCHBgUHM","mcCiMoA4np0","ou-gviqKb84","LFQHhw6XgsU","tmT5Qnrqtow","Qs5nLieOGEI","VewbMFyOUp8","oQsUhlzNBZE","r_fWgigylOU","tmuAHcBILiQ","CjRoDCH354M","kkkyrKkrIME","PDSQZS3SSOQ","oswC2Sv4JBA","gEmUp1pw2yE","Q3nYKYhwEy4","2epslOh-bwU","Cr6RyXb8zHc","4RroOApkP-4","eDMOGCl88H0","YporYE-9ceU","06LuYBOEgtE","1NPxG-oFzmc","LEvBGVsqvQk","83kUrBHd8mo","vb7pBE08TZY","pzM7de0IGKs","ANMPleRkMVE","lOx9A4phJXI","5TkNQZAreLs","mRj89LevZUM","EhU2z34zv58","lyEEBLB1wos","X2DXXoJqacI","iVIR6Yk3-GQ","6CPWxNPWmpI","dUV6dwQ_pLE","2iiVEQO-btg","ahPcG-6iw2w","1VymoXspDJQ","rc-3mpt3If0","TjA18yQb06k","0jZToPwWh0M","4MjdQlaAqv8","guWTXwFcGaw","wvSM1sTc_u8","RJ1Hj55nyFQ","LTD1_65Emsg","XDiohI3juNw","Bb2xfIY012Y","i7RdVrxHscc","feeKixTbIOk","Pj99F7PkZEg","u12lePTf8FY","7qkyv18OXPg","_23lEk_I_7A","Dmv20MIzWDQ","j0WzES6iFRY","SjylbuwIenM","BJzN69DTwxU","eFsRoMvRlpo","DMVhIKmTe-k","0EZoeG_3G-k","-IWOo6PnuhQ","cLLJn_y51aQ","s4ywMb_xFVM","fh7UcbPX2ck","lgD1mIJesiI","UoEI1VMUMxw","RODb1axmpkQ","cZDaJkZ3AtY","UnSct1eNWxA","OKaJRqYbxus","qcl5G2XzGLU","5R2UHbG9_fk","MHPY1uGquZM","8GTfOiiiA1o","0JavytuDYmY","R7DvhMt8dIc","QqRDF8EfoBw","m9DS6e4oGBk","AGljF3SDW0Q","3dd2TAyYzAs","qQHquYM9e04","7KIVvtw3PtE","3W5bCnx0EJ8","MBWHCN9za3U","jyh76kGzixc","Mw3GH14Djg8","WbzIQS9g-s0","-9ll6eZYRDk","eDPFpQsdssU","dcWKXBS8LoQ","AYNjA2HMkaM","Bl8oU3y5m0o","VAd2-Ulza38","45PHz3shLV4","XpCOjjG5LdE","iDtkgZGuTqg","5btMeR4fXBU","ainUtxr60SI","TuUa-VrxJ9M","zybgHip6MLw","rhTuQkFrXBs","qkKkua7WpLY","5TmdObFYKFo","hNTXdHinJBc","VuPzGpHAsWg","JVKWDNVnHpw","RESnjapVOmg","v8TQit7sK3E","oDQtqNnoyfo","3YTnPhCqVCk","yudhtfD2ANc","Uv8Rnto7C-8","_Dd7kFkPNOE","L0tC203n4Js","j3f2SBXjHNs","BJMm8vLF7h4","qVZ_9z_t6vE","R5gT9t_rwgk","Vwit2-UQkWg","khvCBUiZGzY","KtB4eJnViwI","5Ip8eS3AjwM","JCu3kYFKXk0","V29T4dsPwgk","k8a4GvVxJic","24AfY75nPVw","DZI9t4-kkYg","8xr62ib6Oxw","UF2awhfHhEU","tAm4J3e1N7w","u1VCxtYXt-E","Cq7JVs0Z4wM","U2zsjb9gDl0","L4k8c28YpKg","welICwdnyhM","RcKUV82QCHE","jWIu4MqrKY4","V10aweuE6BA","WVo-EkgOVYo","iOqMFyhMJ0M","lpb1eNw-QrM","jhgC65NHodE","CbEfp1X4jOw","GCQvaqCZpic","eLTraus-mww","cb-zsfm8m8g","LDJH_ejU_Gs","TVPZjVYQDCk","87yeqrs0bwg","f_6G8iW1jKk","VY1IeQpNvPw","Yt2YVPku9f4","zwp2VGNMjiE","1N9gpj_sZNI","9PsIlNq5kyQ","2SRnsC-0CHo","r_XGNEzslls","QpdUVqQ17ZM","DNk8S8djwN4","IAB9yaoc1Mk","NSgGnmJtjLQ","V7RC3e3GVkE","50IN9ErOGEk","FdG30X1biK8","9WrrSsTbdVI","l0HO01-xax0","twUv2_0k0Ms","Ke2xNpSV7o8","qg2SJwZ-6Fs","zp61SQVXt58","UMa3qF-2sxA","SO8n9mq7JCQ","lSRChWaW-CQ","MtE2kaXuz1g","HH9cAsEY9Sc","U7XU5rkC4kQ","UDSHDjMVB3U","6oKXKQVkdzs","74vVc27q-gM","yJmKUO5toug","IFmSDumc9Ec","xcSKu6Ugbyk","U4JjABZ_rlM","CaqtkVGfIA8","XBlpqZ2jhro","onJ3Vgv9rq0","FUgQfwGKHzM","gyAqsOycmVk","RYgAVXXjGkU","gVZyjT6wrAg","cv28GjncMco","iAA39BWYt28","WbnMeSROtRQ","gJBtB_lPDa4","iGY0SQpmV44","OPmvHLS9uJA","zcTjfyweoA4","MNmxF_BcZMU","2VhAj3Mh_Qk","GZY14vCC-PU","uv30A-XRXnI","K1VWZ4qH-oA","R2T44TWfogI","z9Dce-Qolu4","8wcg1PYlXZo","MhyMMzTNE_I","VJlb1jaij0Q","PmUd9tUu6ec","ZV7y1IMP8QM","o9x3_m_hi08","6q0pxl3SmTI","A06eW6OcxD4","CZwmXJ3LpxI","KUxWrcPhEiQ","C0bqrJgHTCI","noE3ZBa4odI","pixiR-JsjYA","_Siu5IsFt48","Ge7mO5-bxow","dblqd10WKS0","A1_nCu0JkSs","bDHNTRj2_0E","yYY9HdRVx_k","NB7UnPQgREw","aw3y9iCtQI0","TK9LbFicW2o","ppy2b4GL8KY","Wh_XdbhnHZE","ydzcDyDzOTs","TGP_1sF38HQ","ly9uZfcUHc0","DNf0-WyzooE","434di6l6CKs","vHpo0pOoMcs","CsTUcTckZKw","md11O8thPqc","B1FlUUPLAOE","-Icr0znGVnA","yYooJKxuz3E","0NSxi-X-4IU","ACd7K7uhWAY","fnl2PvQgY7w","nMcrdMSkB1M","SqOGF7fMBD0","dTwFkQQ--rM","hUjilgnF3VM","YXym2PKCAec","PtVnX-nWa7o","VxVOwNXhaOk","_QsiD7q2Fsc","qCBOHbh0IN8","2-d4RiW40k4","jSvJO6KNOEw","mgbTRnqO9Uc","VHA6VblkQ8E","yYAHVvBjVzI","05d09_K9ShI","ToJF5AzLmSE","gEL_qSGJDYY","mYeUjWN2N6o","_J6FhD-3YAs","QoXUygXHpFI","OuaztBkaSP8","ExVgZojhhjY","N0fKywWOOoo","gD5vZArruN8","qZLITMTDk-A","IWfPrYpXc_4","DIYIoOhwnuU","mZk2kzoV3lg","QNoX0sNPK5M","_huA1dJZHfE","k3V3snAZ2J4","G7U8hb9Niec","C-ezz2dyiTA","6-4omia3u38","pT_nl4rllKM","wOPVykjlm3Q","ymTf1fsxqUY","Zd37x_teDYQ","vqKhKuryxkQ","84bKhiVZ4e0","UGSTxG4gCxQ","kWMvf0xw-Jo","ToaF6MX8Y3o","pnV4YJiUB90","oof79MZ3juE","GYmrLVssYuk","Oz8uSMdHlFo","eOF4l4jsIns","0JU3mtIQxdU","Zri9dxT5DYg","L7NG4Z2Dtuo","qnHscb33ZO0","Cl9T55HGZlQ","BhdE5G6bt-Q","DOV7S6blCyY","rYI_DMgtEDc","Gax4SAeFz2o","E1H8_fLUaHU","i8MX8Qb_lYo","ojqNqMfgPek","q5ymSak9_BI","2zeViIiSJY4","gsg50GXGnQI","NDcPtuBLshM","-5T0m87EGMI","ckm4KT4LVxE","rGo5UBs1HFw","l8F2B6HfsYE","9qLFxmxwGSk","q_p_HzlWq9M","Bfifa0NXkmA","8lfcJjsxbWw","GPfd1c8VgMg","auiaN3XNwcA","yRB-w4_Ol0Q","YgmirNft6eE","zenWzhC6dCo","4IC22-2e_ZQ","S-ZFsPHrOaU","GkgzqObk2iw","FWXlwdgyXY4","iZOp19ip40M","Xgk3Xens15I","Ic-Go9aTC7s","3lNr5zl-mtk","Gn_72t9hsG4","gi0zmApeUSQ","_mNDUBh-xPQ","jiTg2O61WS4","rd4ZbSkbOfc","EZ8R7lmspFE","rEwvMxZVN6c","CMD2blaCjXY","8jkJMZKlQEo","5jDmKdWNVYo","8boTw5ayl-g","VaEW5F5J8sU","zJtvAn8qBUc","8oQjtXgsAsk","G3yzhGe86kA","ogkYflV8J-M","qA6WebE_1n0","6ZptVo5DbY4","le8tG5uumq8","6AYL2LVbx8I","yXOM49k9mIo","Mb4uFS_WA00","5rX5zxS8kOc","OHd11d5xxB8","I5392WfqEc0","nQMbsmlXAnw","zj2bYnQxmBc","fBFurvjOPUY","UCX68kgfLY0","YC_txkpiyfU","aeaXAE0EkIw","rhX2NSddvH4","Hf0j5O3HXLg","q8WCpYZVWRk","El8gKg4AsUk","Gc7qlL5oYC4","clyjyVISbIg","lWFH9KGobmg","qfMULFS7S-k","5cczXfxdstg","4ueaEEOyCPI","QX8wbRPaKD4","pNb98pHU0z0","tWPyAe5W9As","1p8kN9Fz3E4","757EVlgc4k4","o1StzrRx4QE","eIZs_8iieHA","XCUXlKYeee4","a5REUBsGu6U","z4OZt5vj40g","XiSfCm5cfs0","bSf0r6vZ6wE","0YBsJGkSsUg","3yqrI2QnnR4","YSp3JZwXjS8","mUVvPA8fZ5s","GMN4oqofCTs","-_j9V1Pt--A","9jdnK8qP9-Q","MtPbimKT-WU","IOGRzbUp7ig","mLzBj25aUss","QxFWsedqQFk","0frVUSfYoTs","2w40sho5dP4","BS5X9JwGuyc","5AsB934xnx4","M_63I4ncMsQ","Yp9HRkxp9a8","sAxMPIPHOqQ","qpOznCVqwrs","74-eGySC_jA","9NOe2tAYDp4","NzuIjYIlI8s","jExCyzM7hFQ","ux1Z2WXn7zY","6UO3ZO8pT9c","AHR-DHtbg3s","b7yi6NpDxOY","cgs-0BlDdWU","skf3gjqE7gc","pEx3n-lae6A","ri9nQfUEIBQ","gqvP4yzSf9A","ut16cmOl4Bw","oevWZMFK6-g","vOMEleC_-rw","jlH_gzjma6k","fwZ2wJm15qI","I9lOZq8rjCU","JTGdZ4oGMnc","IEQR9pvUvUI","-2WohXHJWPA","1WUaUheIzCQ","61Kn5EQ4uJI","SOPk5dgswQo","fBjvsMYJr5M","TbzgCdRCnfo","4if8O4ZcGeg","8KI6M6DPVqM","DVz15sor7wc","wW9zMnVjugA","RriNvDLTyDI","eNVWKoUtGkk","_qrVgGUb8Go","L7f2YGFr7NU","Y2qzmI9jcPQ","w4l_0I68VdY","nHgQQDKNqfo","-KQUVpOX4Hc","ysbv1P0Pjks","j1rsrkTOIZI","q9CXKDGNwto","Xg5hR1b8buY","cfM7J_xYd3c","uyUDBFG_93o","FEm-ZZEq_x0","DWSnjjzSK-Y","cOSIfJAie-4","CDKyxa-t5_E","O861BnEFC3s","caOkZrxQhK4","zULdX4WZxR0","6Rdx9puqZu4","IIpot5ZzuPg","t-gEQdx9pFs","vJFUDQE7LjI","DEZPrPQ0-zc","FqqqXXh9zVQ","5ijms3RrMYE","tHIlpqoYEXc","88B9pkgVE9Y","1zw-l_an0jE","Qq3pGrc17Ek","gPB3QyEK0Wg","XeaSVpFG8Z8","rzjRCH8lavY","tmSgItZWpUE","PSdDxQltvT8","vVncisPprBU","GxDXgHCm2IM","9clzCug1sGg","z38MOjIpVuY","xk-mSLiXajw","dR88GtLmdi0","lQTijtbM3gk","TJ5PBn8ALeE","iHXhgD7gqh4","rk2T7pQgQug","Ozz5J7g-c78","7Z6_N7pAIFU","XDLBoju_51Q","24MWxGKR0UQ","KwIUkb7A3Cc","1GB4kRmNuL4","jQz9D3qCTxM","2mP1A_z5hBI","a6nnumSqhbg","e0SGTGqfvIM","TUcoBiqsGC4","lAJ5zleHihA","JuqCrXHS57U","gjZlUhOE6WA","fx1fyUQ4SgU","ev-mcUwQFFc","p1jhyDGorfk","9tei60RyPTI","W1RzNW1I5LQ","uwdtQnDOAnQ","LnD0TD1dLBI","iToC0N4Z4xk","KDZLCHXCyR4","6AP15kzuZz4","hycDOSO9MxA","Mc_VfGDKunw","cVQ-mSJN7rE","OT6gY4wFMTU","DG93Z3Lka_Q","lOH3lQ2Y9_8","NXQtq3Y30yE","BLXD1Vv87pU","T9_JEb_zcpQ","M-_c0FTT1Ls","aiD7BbMepVk","tBDUTLvn4pM","vLw__chuack","4sX5_Lq7eT8","FgUwDUPRbGg","znKRyZF8E10","SyX3ry8fcYw","pUeJRyDk9e4","9s-EwiE-wEo","TP7o2aZqse4","3wcf6kz8r3U","FBLWk9lvvtk","9aURN0I7Qbw","nYlUJK4B-2Y","Zf8TEch8IXg","x52UHIXqrL8","SaXIUcNYTPs","sCPx2vxtUTE","x0L6TpsTYBQ","Bo5Jd7Gp1UM","kaVdKaq78wY","cI0nDFfj2xE","5PcUJALuUog","TBzo3i6WwPU","n0OxOyPc7KI","ynRR8kFAGJY","E7RQYP3GC5M","XX2J7-BMNhI","YozrFd0Cq7s","nMJnCOXnq38","5HQMaPGb1JY","-d5XFSE2mt4","QYWe4g5_d6I","66IXlIVgmaY","IOncGIj6L78","YDB5Gqs2zLM","KbDtMsATv24","_LXrk3CLRlE"]);
for (const id of ["UCOg6P-Ne5Hdd5tDtcOHDd-Q","UCbJFVj5Zp7NVzOxAj75F7GQ","UCQpvlT4xWlVmUj39iNt8oRg","UCQ75mjyRYZbprTUwO5kP8ig","UCM5TUWTwC4i9IIiBCGpN25w","UCkBhsreS_wIyoL_7hqNVRWg","UCWNewOqSFLhMiZ1XneLc5xA","UCsSVOnuH739ibN24Lma-12Q"]){try{
const j=JSON.parse(execFileSync('python3',['-m','yt_dlp','--flat-playlist','--ignore-errors','--retries','1','--extractor-retries','1','--socket-timeout','12','--extractor-args','youtube:lang=ja','--extractor-args','youtubetab:lang=ja','-J','https://www.youtube.com/channel/'+id+'/videos'],{env:{...process.env,PYTHONPATH:f},encoding:'utf8',maxBuffer:96*1024*1024,timeout:160000}));
const rows=j.entries.filter(x=>x&&include.has(x.id)).map(x=>[x.id,x.title,x.duration,x.description?.slice(0,450),x.upload_date,x.timestamp]);for(let i=0;i<rows.length;i+=5)console.log('METAJP '+Buffer.from(JSON.stringify(rows.slice(i,i+5))).toString('base64'));
console.log('LISTCOUNT',id,rows.length);
}catch(err){console.log('List unavailable',id,String(err.message).slice(0,150))}}
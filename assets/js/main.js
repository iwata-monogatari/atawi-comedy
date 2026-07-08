const DEFAULT_INITIAL_COUNT = 10;
const DEFAULT_PAGE_SIZE = 20;

const selectionLabels = {
  ma: "間",
  world: "世界",
  word: "ワード"
};

const cardLabels = {
  ma: "間が光る一本",
  world: "世界に入る一本",
  word: "ワードが残る一本"
};

let allVideos = [];
let filteredVideos = [];
let listSettings = {
  initialCount: DEFAULT_INITIAL_COUNT,
  pageSize: DEFAULT_PAGE_SIZE
};
let visibleCount = DEFAULT_INITIAL_COUNT;

function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getListSettings() {
  const list = qs("[data-video-list]");
  return {
    initialCount: parsePositiveInt(list?.dataset.initialCount, DEFAULT_INITIAL_COUNT),
    pageSize: parsePositiveInt(list?.dataset.pageSize, DEFAULT_PAGE_SIZE)
  };
}

function resetVisibleCount() {
  listSettings = getListSettings();
  visibleCount = listSettings.initialCount;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stars(value) {
  const score = Math.max(0, Math.min(5, Number(value || 0)));
  return "★".repeat(score) + "☆".repeat(5 - score);
}

function getSelection(video) {
  return video.rating?.selection || "ma";
}

function isPublicVideo(video) {
  return video.status === "published" && video.official_status === "verified";
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${path} could not be loaded`);
  }
  return response.json();
}

function fillSelect(select, values, label) {
  if (!select) return;
  const uniqueValues = Array.from(new Set(values.filter(Boolean))).sort();
  select.innerHTML = `<option value="">${escapeHtml(label)}</option>` + uniqueValues
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
}

function setupFilters(videos) {
  fillSelect(qs("[data-filter-performer]"), videos.map((video) => video.performer), "芸人を選ぶ");
  fillSelect(qs("[data-filter-decade]"), videos.map((video) => video.decade), "年代を選ぶ");
  fillSelect(qs("[data-filter-theme]"), videos.flatMap((video) => [
    video.genre,
    ...(video.mood_tags || []),
    ...(video.theme_tags || [])
  ]), "ジャンル・気分を選ぶ");

  qsa("[data-video-controls] input, [data-video-controls] select").forEach((control) => {
    control.addEventListener("input", () => {
      resetVisibleCount();
      renderList();
    });
  });

  const reset = qs("[data-reset-filters]");
  if (reset) {
    reset.addEventListener("click", () => {
      qsa("[data-video-controls] input, [data-video-controls] select").forEach((control) => {
        control.value = "";
      });
      resetVisibleCount();
      renderList();
    });
  }
}

function getFilteredVideos() {
  const keyword = qs("[data-search]")?.value.trim().toLowerCase() || "";
  const performer = qs("[data-filter-performer]")?.value || "";
  const decade = qs("[data-filter-decade]")?.value || "";
  const theme = qs("[data-filter-theme]")?.value || "";
  const sort = qs("[data-sort]")?.value || "featured";

  const result = allVideos.filter((video) => {
    if (!isPublicVideo(video)) return false;
    const text = [
      video.title,
      video.source_title,
      video.performer,
      video.genre,
      video.summary,
      ...(video.mood_tags || []),
      ...(video.theme_tags || [])
    ].join(" ").toLowerCase();
    const tags = [video.genre, ...(video.mood_tags || []), ...(video.theme_tags || [])];
    return (!keyword || text.includes(keyword))
      && (!performer || video.performer === performer)
      && (!decade || video.decade === decade)
      && (!theme || tags.includes(theme));
  });

  result.sort((a, b) => {
    if (sort === "year-desc") return (b.release_year || 0) - (a.release_year || 0);
    if (sort === "year-asc") return (a.release_year || 0) - (b.release_year || 0);
    if (sort === "performer") return a.performer.localeCompare(b.performer, "ja");
    if (sort === "title") return a.title.localeCompare(b.title, "ja");
    if (sort === "created-desc") return new Date(b.created_at) - new Date(a.created_at);
    return (a.featured_order || 9999) - (b.featured_order || 9999);
  });

  return result;
}

function renderCard(video) {
  const selection = getSelection(video);
  const selectionLabel = selectionLabels[selection] || "間";
  const tags = [video.genre, ...(video.mood_tags || []).slice(0, 2)].filter(Boolean);
  return `
    <article class="video-card">
      <a class="thumb-link" href="${escapeHtml(video.article_url)}" aria-label="${escapeHtml(video.performer)} ${escapeHtml(video.title)}の記事を読む">
        <img src="${escapeHtml(video.thumbnail_url)}" alt="${escapeHtml(video.performer)} ${escapeHtml(video.title)}" loading="lazy">
      </a>
      <div class="video-card-body">
        <p class="eyebrow">${escapeHtml(video.performer)} / ${escapeHtml(video.genre)} / ${escapeHtml(video.release_year)}年</p>
        <h3><a href="${escapeHtml(video.article_url)}">${escapeHtml(video.title)}</a></h3>
        <p class="summary">${escapeHtml(video.summary)}</p>
        <div class="selection-pill">大石セレクション：${escapeHtml(selectionLabel)}</div>
        <dl class="rating-grid" aria-label="大石セレクション評価">
          <div><dt>間</dt><dd>${stars(video.rating?.ma)}</dd></div>
          <div><dt>世界</dt><dd>${stars(video.rating?.world)}</dd></div>
          <div><dt>ワード</dt><dd>${stars(video.rating?.word)}</dd></div>
        </dl>
        <p class="card-label">${escapeHtml(cardLabels[selection] || "大石が出会った一本")}</p>
        <div class="tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="card-actions">
          <a class="button primary" href="${escapeHtml(video.article_url)}">記事を読む</a>
          <a class="button secondary" href="${escapeHtml(video.youtube_url)}" target="_blank" rel="noopener">公式YouTube</a>
        </div>
      </div>
    </article>
  `;
}

function renderList() {
  const list = qs("[data-video-list]");
  if (!list) return;

  filteredVideos = getFilteredVideos();
  const visibleVideos = filteredVideos.slice(0, visibleCount);
  list.innerHTML = visibleVideos.map(renderCard).join("");

  const count = qs("[data-video-count]");
  if (count) {
    count.textContent = `${filteredVideos.length}件`;
  }

  const loadMore = qs("[data-load-more]");
  if (loadMore) {
    loadMore.hidden = visibleCount >= filteredVideos.length;
    loadMore.textContent = `さらに${listSettings.pageSize}件表示`;
    loadMore.onclick = () => {
      visibleCount += listSettings.pageSize;
      renderList();
    };
  }
}

function handleRandom(videos) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("random") !== "1") return;
  const publicVideos = videos.filter(isPublicVideo);
  if (!publicVideos.length) return;
  const video = publicVideos[Math.floor(Math.random() * publicVideos.length)];
  window.location.replace(video.article_url);
}

async function initVideoList() {
  const list = qs("[data-video-list]");
  const randomOnly = new URLSearchParams(window.location.search).get("random") === "1";
  if (!list && !randomOnly) return;

  try {
    allVideos = await loadJson("/data/videos.json");
    handleRandom(allVideos);
    resetVisibleCount();
    setupFilters(allVideos);
    renderList();
  } catch (error) {
    if (list) {
      list.innerHTML = `<p class="notice">ネタデータを読み込めませんでした。</p>`;
    }
    console.error(error);
  }
}

async function initPlaylist() {
  const root = qs("[data-playlist]");
  if (!root) return;
  try {
    const data = await loadJson("/data/oishi-playlist.json");
    const total = data.reduce((sum, day) => sum + (day.items?.length || 0), 0);
    root.innerHTML = `
      <div class="stats-row">
        <div><span>${total}</span><small>累計再生メモ</small></div>
        <div><span>${data[0]?.items?.length || 0}</span><small>今日の追加</small></div>
        <div><span>${escapeHtml(data[0]?.date || "未設定")}</span><small>更新日</small></div>
      </div>
      ${data.map((day) => `
        <details class="playlist-day" open>
          <summary>${escapeHtml(day.date)} / ${day.items.length}件</summary>
          <ul>
            ${day.items.map((item) => `
              <li>
                <strong>${escapeHtml(item.performer)}「${escapeHtml(item.title)}」</strong>
                <a href="${escapeHtml(item.article_url)}">記事</a>
                <a href="${escapeHtml(item.youtube_url)}" target="_blank" rel="noopener">YouTube</a>
              </li>
            `).join("")}
          </ul>
        </details>
      `).join("")}
    `;
  } catch (error) {
    root.innerHTML = `<p class="notice">再生リストを読み込めませんでした。</p>`;
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initVideoList();
  initPlaylist();
});

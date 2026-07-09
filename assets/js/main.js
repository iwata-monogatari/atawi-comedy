const DEFAULT_INITIAL_COUNT = 10;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT = "random";

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
let randomOrder = new Map();
let listSettings = {
  initialCount: DEFAULT_INITIAL_COUNT,
  pageSize: DEFAULT_PAGE_SIZE
};
let currentPage = 1;

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

function getPageFromUrl() {
  return parsePositiveInt(new URLSearchParams(window.location.search).get("page"), 1);
}

function setPage(page, updateUrl = false) {
  currentPage = Math.max(1, page);
  if (updateUrl) {
    const url = new URL(window.location.href);
    if (currentPage === 1) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", String(currentPage));
    }
    window.history.pushState({}, "", url);
  }
}

function resetToFirstPage() {
  setPage(1, true);
}

function getVideoKey(video) {
  return video.id || video.article_url || video.youtube_url || `${video.performer}-${video.title}`;
}

function setupRandomOrder(videos) {
  const shuffled = videos.map((video) => getVideoKey(video));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  randomOrder = new Map(shuffled.map((key, index) => [key, index]));
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

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日付未設定";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
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
      resetToFirstPage();
      renderList();
    });
  });

  const reset = qs("[data-reset-filters]");
  if (reset) {
    reset.addEventListener("click", () => {
      qsa("[data-video-controls] input, [data-video-controls] select").forEach((control) => {
        control.value = control.matches("[data-sort]") ? DEFAULT_SORT : "";
      });
      resetToFirstPage();
      renderList();
    });
  }
}

function getFilteredVideos() {
  const keyword = qs("[data-search]")?.value.trim().toLowerCase() || "";
  const performer = qs("[data-filter-performer]")?.value || "";
  const decade = qs("[data-filter-decade]")?.value || "";
  const theme = qs("[data-filter-theme]")?.value || "";
  const sort = qs("[data-sort]")?.value || DEFAULT_SORT;

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
    if (sort === "random") {
      const aOrder = randomOrder.get(getVideoKey(a)) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = randomOrder.get(getVideoKey(b)) ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    }
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
  const tags = [selectionLabel, video.genre, ...(video.mood_tags || []).slice(0, 2)].filter(Boolean);
  const officialText = video.official_status === "verified" ? "公式YouTube確認済み" : "公式リンク確認中";
  const postedDate = formatDate(video.created_at);
  const releaseText = video.release_year ? `${video.release_year}年公開` : "公開年未設定";
  return `
    <article class="video-card" data-selection="${escapeHtml(selection)}">
      <a class="thumb-link" href="${escapeHtml(video.article_url)}" aria-label="${escapeHtml(video.performer)} ${escapeHtml(video.title)}の記事を読む">
        <img src="${escapeHtml(video.thumbnail_url)}" alt="${escapeHtml(video.performer)} ${escapeHtml(video.title)}" loading="lazy">
      </a>
      <div class="video-card-body">
        <p class="eyebrow">${escapeHtml(video.performer)} / ${escapeHtml(video.genre)}</p>
        <h3><a href="${escapeHtml(video.article_url)}">${escapeHtml(video.title)}</a></h3>
        <p class="summary">${escapeHtml(video.summary)}</p>
        <div class="video-meta">
          <span>投稿日 ${escapeHtml(postedDate)}</span>
          <span>${escapeHtml(releaseText)}</span>
        </div>
        <div class="source-badge">${escapeHtml(officialText)}</div>
        <div class="selection-pill">大石セレクション：${escapeHtml(selectionLabel)}</div>
        <dl class="rating-grid" aria-label="大石セレクション評価">
          <div><dt>間</dt><dd>${stars(video.rating?.ma)}</dd></div>
          <div><dt>世界</dt><dd>${stars(video.rating?.world)}</dd></div>
          <div><dt>ワード</dt><dd>${stars(video.rating?.word)}</dd></div>
        </dl>
        <p class="card-label">${escapeHtml(cardLabels[selection] || "大石が出会った一本")}</p>
        <div class="tag-row">${tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="card-actions">
          <a class="button primary" href="${escapeHtml(video.article_url)}">読む</a>
          <a class="button secondary" href="${escapeHtml(video.youtube_url)}" target="_blank" rel="noopener">YouTubeで見る</a>
        </div>
      </div>
    </article>
  `;
}

function renderList() {
  const list = qs("[data-video-list]");
  if (!list) return;

  listSettings = getListSettings();
  filteredVideos = getFilteredVideos();
  const totalPages = getTotalPages(filteredVideos.length);
  if (currentPage > totalPages) {
    setPage(totalPages, true);
  }
  const { start, end } = getPageBounds(currentPage, filteredVideos.length);
  const visibleVideos = filteredVideos.slice(start, end);
  if (visibleVideos.length) {
    list.innerHTML = visibleVideos.map(renderCard).join("");
  } else {
    list.innerHTML = `
      <div class="empty-state">
        <strong>ただいま、今日出会ってほしい一本を準備しています。</strong>
        <p>条件を変えるか、少し時間を置いて再読み込みしてください。</p>
      </div>
    `;
  }

  const count = qs("[data-video-count]");
  if (count) {
    count.textContent = formatCount(filteredVideos.length, start, end);
  }

  renderPagination(filteredVideos.length);
}

function getTotalPages(total) {
  if (total <= listSettings.initialCount) return 1;
  return 1 + Math.ceil((total - listSettings.initialCount) / listSettings.pageSize);
}

function getPageBounds(page, total) {
  if (page <= 1) {
    return {
      start: 0,
      end: Math.min(listSettings.initialCount, total)
    };
  }
  const start = listSettings.initialCount + (page - 2) * listSettings.pageSize;
  return {
    start,
    end: Math.min(start + listSettings.pageSize, total)
  };
}

function formatCount(total, start, end) {
  if (!total) return "0件";
  return `${total}件中${start + 1}〜${end}件を表示`;
}

function getPageHref(page) {
  const url = new URL(window.location.href);
  if (page <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(page));
  }
  url.searchParams.delete("random");
  return `${url.pathname}${url.search}${url.hash}`;
}

function renderPagination(total) {
  const pagination = qs("[data-pagination]");
  if (!pagination) return;

  const totalPages = getTotalPages(total);
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    pagination.hidden = true;
    return;
  }

  pagination.hidden = false;
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);
  const pageLinks = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const bounds = getPageBounds(page, total);
    const label = `${bounds.start + 1}-${bounds.end}`;
    return `<a class="pagination-link${page === currentPage ? " is-active" : ""}" href="${escapeHtml(getPageHref(page))}" data-page="${page}"${page === currentPage ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
  }).join("");

  pagination.innerHTML = `
    <a class="pagination-link" href="${escapeHtml(getPageHref(previousPage))}" data-page="${previousPage}" ${currentPage === 1 ? 'aria-disabled="true"' : ""}>前へ</a>
    <div class="pagination-pages">${pageLinks}</div>
    <a class="pagination-link" href="${escapeHtml(getPageHref(nextPage))}" data-page="${nextPage}" ${currentPage === totalPages ? 'aria-disabled="true"' : ""}>次へ</a>
  `;

  qsa("[data-page]", pagination).forEach((link) => {
    link.addEventListener("click", (event) => {
      const page = parsePositiveInt(link.dataset.page, 1);
      if (page === currentPage) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      setPage(page, true);
      renderList();
      qs("#video-list-title, #article-list-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
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
    setupRandomOrder(allVideos.filter(isPublicVideo));
    handleRandom(allVideos);
    setPage(getPageFromUrl());
    setupFilters(allVideos);
    renderList();
  } catch (error) {
    if (list) {
      list.innerHTML = `
        <div class="empty-state">
          <strong>ネタデータをうまく読み込めませんでした。</strong>
          <p>少し時間を置いて再読み込みしてください。公式YouTubeへの敬意を保ったまま、表示を整え直します。</p>
        </div>
      `;
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

window.addEventListener("popstate", () => {
  setPage(getPageFromUrl());
  renderList();
});

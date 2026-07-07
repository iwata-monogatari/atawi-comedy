(() => {
  const STORAGE_KEY = "atawi_comedy_deai_log";

  function readLog() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeLog(entry) {
    const log = readLog();
    log.unshift({
      ...entry,
      at: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(0, 100)));
  }

  document.addEventListener("click", (event) => {
    const randomLink = event.target.closest("[data-random-link]");
    if (randomLink) {
      writeLog({ type: "random-click", label: "ランダムに1ネタと出会う" });
    }

    const youtubeLink = event.target.closest("[data-youtube-link]");
    if (youtubeLink) {
      writeLog({
        type: "youtube-click",
        title: youtubeLink.getAttribute("data-video-title") || document.title
      });
    }
  });
})();


(() => {
  function loadFujigaokaAnalytics() {
    if (document.querySelector('script[data-fujigaoka-analytics="true"]')) return;
    const script = document.createElement("script");
    script.defer = true;
    script.src = "https://fujigaoka-analytics-worker.hiroyukio0122.workers.dev/tracker.js";
    script.setAttribute("data-site", "atawi-comedy");
    script.setAttribute("data-fujigaoka-analytics", "true");
    document.head.appendChild(script);
  }

  loadFujigaokaAnalytics();

  const target = document.querySelector("[data-site-footer]");
  if (!target) return;

  fetch("/assets/partials/footer.html", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("Footer request failed");
      return response.text();
    })
    .then((html) => {
      target.outerHTML = html;
    })
    .catch(() => {
      target.remove();
    });
})();

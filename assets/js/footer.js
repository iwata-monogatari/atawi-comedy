(() => {
  const target = document.querySelector("[data-site-footer]");
  if (!target) return;

  target.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div>
          <p class="footer-logo">ATAWI COMEDY</p>
          <p>笑いは、探すものではなく、出会うもの。</p>
        </div>
        <nav aria-label="フッターナビゲーション">
          <a href="/">トップ</a>
          <a href="/oishi-selection-viewpoint.html">大石セレクション</a>
          <a href="/articles/">記事一覧</a>
          <a href="/about.html">プロフィール</a>
          <a href="/playlist/">大石再生リスト</a>
          <a href="/contact.html">お問い合わせ</a>
        </nav>
      </div>
    </footer>
  `;
})();

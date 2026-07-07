(() => {
  const target = document.querySelector("[data-site-footer]");
  if (!target) return;
  target.innerHTML = `
    <footer class="site-footer">
      <div class="footer-compact">
        <p class="footer-title"><a href="/" aria-label="ATAWI COMEDY トップへ戻る"><strong>ATAWI COMEDY</strong><span>大石浩之の、笑いと記憶をたどるお笑い帖</span></a></p>
        <p class="footer-label">地域・暮らし</p>
        <p><a href="https://iwata-monogatari.net/">磐田物語</a>・<a href="https://enshu-lifehack.com/">遠州ライフハック</a>・<span aria-hidden="true">🌱</span><a href="https://iwata.enshu-lifehack.com/">磐田ライフハック</a>・<span aria-hidden="true">🍈</span><a href="https://fukuroi.enshu-lifehack.com/">袋井ライフハック</a>・<span aria-hidden="true">🍵</span><a href="https://kakegawa.enshu-lifehack.com/">掛川ライフハック</a>・<span aria-hidden="true">🌲</span><a href="https://morimachi.enshu-lifehack.com/">森町ライフハック</a>・<span aria-hidden="true">🌼</span><a href="https://kikugawa.enshu-lifehack.com/">菊川ライフハック</a>・<span aria-hidden="true">🌊</span><a href="https://omaezaki.enshu-lifehack.com/">御前崎ライフハック</a>・<span aria-hidden="true">🌅</span><a href="https://kosai.enshu-lifehack.com/">湖西ライフハック</a>・<span aria-hidden="true">🎹</span><a href="https://hamamatsu.enshu-lifehack.com/">浜松ライフハック</a>・<a href="https://atawimusic.link/">ATAWI MUSIC</a>・<a href="https://atawicomedy.link/">ATAWI COMEDY</a></p>
        <p class="footer-label">仕事の相談</p>
        <p><a href="https://www.fujigaoka-service.co.jp/">富士ヶ丘サービス不動産</a>・<a href="https://www.fujigaoka-service.info/">富士ヶ丘サービス介護</a>・<a href="https://iwata-monogatari.github.io/fujigaoka-jikka-soudan/">実家じまい・空き家相談</a>・<a href="https://iwata-monogatari.github.io/fujigaoka-souzoku-soudan/">相続のはじめ・空き家相談</a>・<a href="https://hiroyukio0122.wixsite.com/for202904">大石ひろゆき</a></p>
        <p class="footer-label">運営</p>
        <p class="footer-bottom">大石浩之 / 富士ヶ丘サービス株式会社 © 2026 ATAWI COMEDY</p>
      </div>
    </footer>
  `;
})();

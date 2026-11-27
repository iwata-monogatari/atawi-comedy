"""Build metadata guides from the reviewed official-video catalog; no invented reviews."""
import collections
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATE = '2026-11-27'
CONFIG = {
    'jarujaru': ('ジャルジャル', 'じゃるじゃる', 'コンビ'),
    'hanako': ('ハナコ', 'はなこ', 'トリオ'),
    'milkboy': ('ミルクボーイ', 'みるくぼーい', 'コンビ'),
    'jinnai-tomonori': ('陣内智則', 'じんないとものり', 'ピン芸人'),
}
LABELS = {'ma': '間', 'world': '世界', 'word': 'ワード', 'official': '公式ネタ'}
def read(p): return (ROOT / p).read_text(encoding='utf-8-sig')
def write(p, text):
    dest = ROOT / p
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.is_file() and dest.read_text(encoding='utf-8') == text:
        return
    dest.write_text(text, encoding='utf-8')
def load(p): return json.loads(read(p))
def save(p, data): write(p, json.dumps(data, ensure_ascii=False, indent=2) + '\n')
def esc(x): return html.escape(str(x), quote=True)
def selection(v): return LABELS.get(v.get('rating', {}).get('selection') or v.get('selection'), '公式ネタ')
def pill(v): return '<div class="selection-pill">大石セレクション：' + selection(v) + '</div>'

source = load('.github/data/four-performers.json')
videos = load('data/videos.json')
old_by_id = {v['id']: v for v in videos}
header = re.search(r'<header class="site-header">.*?</header>', read('articles/index.html'), re.S)[0]
footer = '<div data-site-footer></div><script src="/assets/js/footer.js?v=20260708f"></script>'

def page(title, description, url, body, script=False, image=None):
    return f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}｜ATAWI COMEDY</title><meta name="description" content="{esc(description)}">
<link rel="canonical" href="https://atawicomedy.link{url}">
<meta property="og:site_name" content="ATAWI COMEDY"><meta property="og:type" content="website">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="https://atawicomedy.link{url}">
{f'<meta property="og:image" content="{esc(image)}">' if image else ''}
<link rel="stylesheet" href="/assets/css/style.css?v=20260709a"><link rel="stylesheet" href="/assets/css/video-guides.css">
{'<script src="/assets/js/main.js?v=20261127c" defer></script>' if script else ''}
</head><body>{header}<main class="page-main">{body}</main>{footer}<script src="/js/deai-log.js?v=20260708"></script></body></html>
'''

groups = collections.defaultdict(list)
counter = collections.Counter()
for s in source:
    slug = s['slug']
    counter[slug] += 1
    vid = s.get('id') or f'{slug}-{counter[slug]:04d}'
    seconds = int(s.get('duration_seconds') or 0)
    duration = f'{seconds // 60}:{seconds % 60:02d}' if seconds else ''
    v = {
        'id': vid, 'title': s['title'], 'source_title': s['source_title'],
        'performer': s['performer'], 'performers': [s['performer']], 'genre': s['genre'],
        'article_url': f'/articles/{vid}.html',
        'youtube_url': 'https://www.youtube.com/watch?v=' + s['youtube_video_id'],
        'youtube_video_id': s['youtube_video_id'], 'channel_name': s['channel_name'],
        'channel_url': s['channel_url'], 'source_owner': s['channel_name'],
        'official_status': 'verified', 'created_at': DATE + 'T12:00:00+09:00',
        'status': 'published', 'featured_order': 9999, 'recommended': False,
        'thumbnail_url': 'https://i.ytimg.com/vi/' + s['youtube_video_id'] + '/hqdefault.jpg',
        'mood_tags': [], 'theme_tags': [s['genre']], 'content_type': 'video_guide',
        'duration': duration, 'source_checked_at': DATE, 'selection': 'official',
        'summary': f'{s["performer"]}「{s["title"]}」の公式{s["genre"]}動画。{s["channel_name"]}で公開されている一本です。',
    }
    if seconds: v['duration_iso'] = f'PT{seconds}S'
    if vid in old_by_id:
        existing = old_by_id[vid]
        assert existing['youtube_video_id'] == v['youtube_video_id'], 'Refuse to reuse an article ID for another video'
        v = {**existing, **v}
        videos[videos.index(existing)] = v
    else:
        videos.append(v)
    groups[slug].append(v)

for v in videos:
    if not v.get('rating', {}).get('selection'):
        v.setdefault('selection', 'official')

for slug, entries in groups.items():
    name, kana, kind = CONFIG[slug]
    for index, v in enumerate(entries):
        title = f'{name}「{v["title"]}」'
        related = [entries[(index + k) % len(entries)] for k in range(1, min(4, len(entries)))]
        md = f'# {title}\n\n大石セレクション：{selection(v)}\n\n{v["summary"]}\n\n[公式YouTubeで見る]({v["youtube_url"]})\n\n'
        md += f'- 動画タイトル：{v["source_title"]}\n- ジャンル：{v["genre"]}\n- 公開元：[{v["channel_name"]}]({v["channel_url"]})\n'
        if v['duration']: md += f'- 再生時間：{v["duration"]}\n'
        md += f'\n## {name}のほかのネタ\n\n' + '\n'.join(f'- [{x["title"]}]({x["article_url"]})' for x in related) + f'\n\n[{name}の動画一覧](/performers/{slug}/)\n'
        write(f'articles-md/{v["id"]}.md', md)
        cards = ''.join(f'<li><a class="netalink" href="{x["article_url"]}"><img src="{x["thumbnail_url"]}" alt="" width="96" height="64" loading="lazy"><span><strong>{esc(x["title"])}</strong><small>{esc(x["genre"])} ・ {esc(x["duration"])}</small><small>大石セレクション：{selection(x)}</small></span></a></li>' for x in related)
        body = f'''<nav class="guide-crumb" aria-label="パンくず"><a href="/guides/four-performers/">4組の公式ネタ</a> ／ <a href="/performers/{slug}/">{name}</a></nav>
<header class="article-header guide-head"><p class="eyebrow">{name} ／ {esc(v['genre'])}</p><h1>{esc(v['title'])}</h1><p class="lead">{esc(v['summary'])}</p>{pill(v)}</header>
<div class="guide-detail"><div><a class="guide-still" href="{v['youtube_url']}" data-youtube-link data-video-title="{esc(title)}" aria-label="{esc(title)}をYouTubeで見る"><img src="{v['thumbnail_url']}" width="480" height="360" alt="{esc(title)}の公式動画サムネイル"></a><p><a class="button primary" href="{v['youtube_url']}" data-youtube-link data-video-title="{esc(title)}">公式YouTubeで見る</a></p></div>
<section><h2>動画情報</h2><dl class="guide-data"><dt>動画タイトル</dt><dd>{esc(v['source_title'])}</dd><dt>出演</dt><dd>{name}</dd><dt>公開チャンネル</dt><dd><a href="{esc(v['channel_url'])}">{esc(v['channel_name'])}</a></dd>{f'<dt>再生時間</dt><dd>{v["duration"]}</dd>' if v['duration'] else ''}</dl></section></div>
<section class="guide-group"><h2>{name}のほかのネタ</h2><ul class="neta-grid">{cards}</ul><p><a href="/performers/{slug}/">{name}の動画一覧を見る</a></p></section>'''
        write(v['article_url'].lstrip('/'), page(title + '｜公式動画', v['summary'], v['article_url'], body, image=v['thumbnail_url']))
    description = f'{name}の公式ネタ動画{len(entries):,}本。ネタ名で検索し、公式YouTubeから視聴できます。'
    body = f'''<nav class="guide-crumb"><a href="/guides/four-performers/">4組の公式ネタ</a></nav><section class="page-section"><h1>{name}の公式ネタ</h1><p class="lead">{description}</p><p><a href="{esc(entries[0]['channel_url'])}">{esc(entries[0]['channel_name'])}</a></p></section>
<section aria-labelledby="article-list-title"><div class="section-head"><h2 id="article-list-title">{name}の動画一覧</h2><span data-video-count>{len(entries)}件</span></div><div class="controls" data-video-controls><input type="search" data-search placeholder="ネタ名で検索" aria-label="検索"><select data-sort aria-label="並び替え"><option value="random">ランダム</option><option value="title">ネタ名順</option><option value="created-desc">新着順</option></select><button class="button ghost" data-reset-filters>解除</button></div><div class="video-grid" data-video-list data-performer="{name}" data-initial-count="20" data-page-size="20"></div><nav class="pagination" data-pagination aria-label="動画ページ"></nav></section>'''
    write(f'performers/{slug}/index.html', page(name + 'の公式ネタ', description, f'/performers/{slug}/', body, script=True))

hub = '<h1>ジャルジャル・ハナコ・ミルクボーイ・陣内智則の公式ネタ</h1><p class="lead">4組の公式チャンネルから、通常のネタ動画を芸人別にまとめました。</p>'
hub += '<p>重複・短縮版・総集編、ゲームやトークなどの企画動画を除き、各演目の公式動画へ案内します。</p>'
hub += '<div class="guide-jump">' + ''.join(f'<a href="/performers/{slug}/">{CONFIG[slug][0]} <span>{len(entries):,}本</span></a>' for slug, entries in groups.items()) + '</div>'
write('guides/four-performers/index.html', page('4組の公式ネタ動画', 'ジャルジャル・ハナコ・ミルクボーイ・陣内智則の公式ネタ動画を芸人別に探せます。', '/guides/four-performers/', hub))

# Preserve all prior ratings and prose. Add only the missing selection label.
by_url = {v['article_url']: v for v in videos}
for v in videos:
    article = v['article_url'].lstrip('/')
    if article and (ROOT / article).is_file():
        text = read(article)
        if '大石セレクション：' not in text:
            pattern = r'(<header class="article-header[^>]*>.*?)(</header>)'
            text, count = re.subn(pattern, lambda m: m[1] + pill(v) + m[2], text, count=1, flags=re.S)
            if count != 1: raise RuntimeError('Missing article header: ' + article)
            write(article, text)
    mdpath = f'articles-md/{v["id"]}.md'
    if (ROOT / mdpath).exists():
        text = read(mdpath)
        if '大石セレクション：' not in text:
            first, rest = text.split('\n', 1)
            write(mdpath, first + '\n\n大石セレクション：' + selection(v) + '\n' + rest)

# Static related-video and guide lists also get a label on every video link.
for folder in ('articles', 'guides', 'performers'):
    for file in (ROOT / folder).rglob('*.html'):
        text = file.read_text(encoding='utf-8')
        def enrich(m):
            block = m[0]
            href = re.search(r'href="([^"]+)"', block)
            v = by_url.get(href[1]) if href else None
            if v and '大石セレクション：' not in block:
                return block.replace('</span>', '<small>大石セレクション：' + selection(v) + '</small></span>', 1)
            return block
        updated = re.sub(r'<a class="netalink"[^>]*>.*?</a>', enrich, text, flags=re.S)
        if updated != text: file.write_text(updated, encoding='utf-8')

save('data/videos.json', videos)
search = load('data/search-index.json')
search_ids = {x['id'] for x in search}
for slug, entries in groups.items():
    for v in entries:
        if v['id'] not in search_ids:
            x = {k: v[k] for k in ('id', 'title', 'performer', 'genre', 'article_url', 'youtube_url', 'created_at', 'featured_order', 'mood_tags', 'theme_tags', 'summary', 'selection')}
            x['kana'] = [CONFIG[slug][1]]
            search.append(x)
for x in search:
    v = by_url.get(x.get('article_url'))
    if v and v.get('selection'): x['selection'] = v['selection']
save('data/search-index.json', search)
performers = load('data/performers.json')
for slug, (name, kana, kind) in CONFIG.items():
    if not any(x['id'] == slug for x in performers): performers.append({'id': slug, 'name': name, 'kana': kana, 'type': kind})
save('data/performers.json', performers)
sitemap = read('sitemap.xml')
urls = [v['article_url'] for entries in groups.values() for v in entries] + [f'/performers/{slug}/' for slug in CONFIG] + ['/guides/four-performers/']
nodes = ''.join(f'  <url><loc>https://atawicomedy.link{u}</loc><lastmod>{DATE}</lastmod></url>\n' for u in urls if f'<loc>https://atawicomedy.link{u}</loc>' not in sitemap)
write('sitemap.xml', sitemap.replace('</urlset>', nodes + '</urlset>'))
for p in ('index.html', 'articles/index.html', 'playlist/index.html'):
    text = re.sub(r'/assets/js/main.js\?v=[^"\s]+', '/assets/js/main.js?v=20261127c', read(p))
    if p != 'playlist/index.html' and '/guides/four-performers/' not in text:
        text = text.replace('<a class="button secondary" href="/guides/konto-manzai/">', '<a class="button secondary" href="/guides/four-performers/">ジャルジャル・ハナコ・ミルクボーイ・陣内智則の公式ネタ</a>\n<a class="button secondary" href="/guides/konto-manzai/">')
    write(p, text)
print(json.dumps({'added_catalog': len(source), 'by_performer': dict(counter), 'published': sum(v['status'] == 'published' for v in videos)}, ensure_ascii=False))

import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context = vm.createContext({
  document: { addEventListener() {}, querySelector() { return null; } },
  window: { addEventListener() {}, location: { search: '', href: 'https://atawicomedy.link/articles/' }, history: { pushState() {} } },
  URL, URLSearchParams, console
});
vm.runInContext(fs.readFileSync('assets/js/main.js', 'utf8'), context);
const videos = JSON.parse(fs.readFileSync('data/videos.json', 'utf8'));
for (const video of videos) {
  context.video = video;
  const card = vm.runInContext('renderCard(video)', context);
  assert(card.includes('大石セレクション：'), video.id);
  assert.equal(card.includes('rating-grid'), ['ma', 'world', 'word'].every(key => Number.isFinite(video.rating?.[key])), video.id);
}
context.total = videos.filter(v => v.status === 'published' && v.official_status === 'verified').length;
vm.runInContext('listSettings = { initialCount: 10, pageSize: 20 }', context);
assert.equal(vm.runInContext('getPageBounds(getTotalPages(total), total).end', context), context.total);
console.log(`verify-selections: ok (${videos.length} cards; selection labels, existing ratings, final page boundary)`);

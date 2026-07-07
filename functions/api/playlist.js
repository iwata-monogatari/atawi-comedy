const PLAYLIST_KEY = "playlist";

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

async function readPlaylist(env) {
  if (!env.ATAWI_COMEDY_PLAYLIST) return [];
  const stored = await env.ATAWI_COMEDY_PLAYLIST.get(PLAYLIST_KEY, "json");
  return Array.isArray(stored) ? stored : [];
}

export async function onRequestGet({ env }) {
  const playlist = await readPlaylist(env);
  return json(playlist);
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const suppliedToken = bearer || url.searchParams.get("atawi_owner_key") || url.searchParams.get("owner_token");

  if (!env.OWNER_TOKEN || suppliedToken !== env.OWNER_TOKEN) {
    return json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!env.ATAWI_COMEDY_PLAYLIST) {
    return json({ ok: false, error: "ATAWI_COMEDY_PLAYLIST binding is missing" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.title || !body.youtube_url) {
    return json({ ok: false, error: "title and youtube_url are required" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const playlist = await readPlaylist(env);
  let day = playlist.find((entry) => entry.date === today);
  if (!day) {
    day = { date: today, items: [] };
    playlist.unshift(day);
  }

  day.items.unshift({
    video_id: body.video_id || "",
    title: body.title,
    performer: body.performer || "",
    youtube_url: body.youtube_url,
    article_url: body.article_url || "",
    recorded_at: new Date().toISOString()
  });

  await env.ATAWI_COMEDY_PLAYLIST.put(PLAYLIST_KEY, JSON.stringify(playlist.slice(0, 120)));
  return json({ ok: true, date: today, total_days: playlist.length });
}


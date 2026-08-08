// Serves the game (already uploaded to the puppy-academy-game R2 bucket)
// under puppysacademy.com/play/* instead of the r2.dev cross-origin URL.
//
// Why this exists: the game was embedded via an iframe pointing at a
// separate r2.dev origin. iOS Safari's storage partitioning (Intelligent
// Tracking Prevention) blocks/purges IndexedDB for that kind of
// cross-origin iframe content, which is what Godot's web export uses for
// user:// save persistence -- so progress silently failed to save on
// iPhone. Serving the exact same files from the SAME domain as the site
// (via this Worker, bound directly to the R2 bucket) makes it same-origin,
// which sidesteps the whole problem instead of relying on the browser
// granting requestStorageAccess().
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let key = url.pathname.replace(/^\/play\/?/, "");
    if (key === "" || key.endsWith("/")) key += "index.html";

    const object = await env.GAME_BUCKET.get(key);
    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(object.body, { headers });
  },
};

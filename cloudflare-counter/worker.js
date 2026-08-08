// Puppy Academy — total-players counter
// Deploy this as a Cloudflare Worker, with a KV namespace bound to it
// named PLAYER_COUNTER (see the setup instructions).

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS -- the website calls this from a different origin than the
    // worker's own address, so the browser needs these headers on every
    // response (including the OPTIONS preflight) or it blocks the request.
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Called once per new visitor (the website only calls this the very
    // first time a browser loads the page, tracked via localStorage) --
    // increments the stored count by one and returns the new total.
    if (url.pathname === "/increment" && request.method === "POST") {
      let count = parseInt((await env.PLAYER_COUNTER.get("total_players")) || "0", 10);
      count += 1;
      await env.PLAYER_COUNTER.put("total_players", String(count));
      return new Response(JSON.stringify({ count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Called on every repeat visit -- just reads the current total without
    // incrementing it again.
    if (url.pathname === "/count" && request.method === "GET") {
      const count = parseInt((await env.PLAYER_COUNTER.get("total_players")) || "0", 10);
      return new Response(JSON.stringify({ count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};

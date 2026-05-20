export default {
  async fetch(request, env) {
    // 1. Handle CORS so your GitHub Pages site can talk to this backend safely
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("name");

    if (!searchTerm) {
      return new Response(JSON.stringify({ success: false, error: "Missing name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      // 2. Normalize input to lowercase to make the prefix search case-insensitive
      const normalizedSearch = searchTerm.toLowerCase().trim();

      // 3. Scan the KV store for any keys starting with this prefix (limit to top 10 matches)
      const kvList = await env.WEDDING_DATA.list({ 
        prefix: normalizedSearch,
        limit: 10 
      });

      if (kvList.keys.length === 0) {
        return new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 4. Fetch the full objects for all matching keys in parallel
      const matches = await Promise.all(
        kvList.keys.map(async (keyObj) => {
          const rawData = await env.WEDDING_DATA.get(keyObj.name);
          return JSON.parse(rawData);
        })
      );

      return new Response(JSON.stringify({ success: true, data: matches }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
export default {
  async fetch(request, env) {
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
      const normalizedSearch = searchTerm.toLowerCase().trim();

      // 1. Pull ALL keys from the KV store (handles up to 1000 items instantly)
      const kvList = await env.WEDDING_DATA.list();

      // 2. Filter keys where the guest name INCLUDES the typed text anywhere
      const matchingKeys = kvList.keys.filter(keyObj => 
        keyObj.name.includes(normalizedSearch)
      ).slice(0, 10); // Limit to top 10 UI matches for performance

      if (matchingKeys.length === 0) {
        return new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3. Fetch full data payloads for the matched subset in parallel
      const matches = await Promise.all(
        matchingKeys.map(async (keyObj) => {
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
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

      // 1. Fetch all guest keys from the KV store
      const kvList = await env.WEDDING_DATA.list();

      // 2. Smart word-boundary filter
      const matchingKeys = kvList.keys.filter(keyObj => {
        const fullName = keyObj.name; // This is already lowercase in your database
        
        // Split the full name into individual names (e.g., ["eva", "gonzales", "layoso"])
        const nameWords = fullName.split(/\s+/);
        
        // Check if ANY of those individual names start with the search term
        return nameWords.some(word => word.startsWith(normalizedSearch));
      }).slice(0, 10); // Keep UI clean with top 10 results

      if (matchingKeys.length === 0) {
        return new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3. Resolve the full data payloads in parallel
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
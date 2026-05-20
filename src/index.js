export default {
  async fetch(request, env) {
    // Set up standard cross-origin headers so your frontend can read the response safely
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight options request from the browser
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);
    
    // Look for incoming requests to /api/search?name=Someone
    if (url.pathname === "/api/search") {
      const nameParam = url.searchParams.get("name")?.trim().toLowerCase();

      if (!nameParam) {
        return new Response(JSON.stringify({ error: "Missing name parameter" }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }

      // Check your ultra-fast global edge cache storage
      const guestData = await env.WEDDING_DATA.get(nameParam);

      if (!guestData) {
        return new Response(JSON.stringify({ error: "Guest not found" }), {
          status: 404,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }

      // Return the guest details (table number, seating group, etc.)
      return new Response(guestData, {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
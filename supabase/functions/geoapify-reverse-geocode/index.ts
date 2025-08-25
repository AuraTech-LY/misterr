const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const GEOAPIFY_API_KEY = Deno.env.get("GEO_API");

    if (!GEOAPIFY_API_KEY) {
      console.error("Geoapify API key not configured");
      return new Response(
        JSON.stringify({ error: "Geoapify API key not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const geoapifyUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&lang=ar&apiKey=${GEOAPIFY_API_KEY}`;

    console.log(`Making request to Geoapify: ${geoapifyUrl}`);

    const response = await fetch(geoapifyUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error("Geoapify API error:", data);
      return new Response(
        JSON.stringify({ 
          error: data.message || "Error from Geoapify API",
          details: data 
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Geoapify response:", JSON.stringify(data, null, 2));

    // Extract neighborhood name with fallback options
    const feature = data.features?.[0];
    if (!feature) {
      return new Response(
        JSON.stringify({ error: "No location data found for these coordinates" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const properties = feature.properties;
    
    // Try different property names for neighborhood/area in order of preference
    const neighborhood = 
      properties.suburb ||
      properties.city_district ||
      properties.neighbourhood ||
      properties.quarter ||
      properties.district ||
      properties.city ||
      properties.town ||
      properties.village ||
      properties.state_district ||
      properties.county ||
      properties.formatted;

    if (neighborhood) {
      return new Response(
        JSON.stringify({ 
          neighborhood: neighborhood.trim(),
          fullAddress: properties.formatted || '',
          confidence: feature.properties.confidence || 0
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else {
      console.log("Available properties:", Object.keys(properties));
      return new Response(
        JSON.stringify({ 
          error: "Neighborhood not found for these coordinates",
          availableData: properties.formatted || 'No formatted address available'
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
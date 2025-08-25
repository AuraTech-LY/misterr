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

    // Use the direct fetch approach with the API key
    const geoapifyUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&lang=ar&apiKey=c17596bb6ccf4016a35575463bdebee8`;

    console.log(`Making request to Geoapify: ${geoapifyUrl}`);

    const requestOptions = {
      method: 'GET',
    };

    const response = await fetch(geoapifyUrl, requestOptions);
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

    // Extract neighborhood name from the results array (similar to your JSON example structure)
    const result = data.results?.[0];
    if (!result) {
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

    // Try different property names for neighborhood/area in order of preference
    const neighborhood = 
      result.suburb ||
      result.city_district ||
      result.neighbourhood ||
      result.quarter ||
      result.district ||
      result.city ||
      result.town ||
      result.village ||
      result.state_district ||
      result.county ||
      result.formatted;

    if (neighborhood) {
      return new Response(
        JSON.stringify({ 
          neighborhood: neighborhood.trim(),
          fullAddress: result.formatted || '',
          confidence: result.rank?.confidence || 0
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
      console.log("Available properties:", Object.keys(result));
      return new Response(
        JSON.stringify({ 
          error: "Neighborhood not found for these coordinates",
          availableData: result.formatted || 'No formatted address available'
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
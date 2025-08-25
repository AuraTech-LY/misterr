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

    console.log(`Reverse geocoding for coordinates: ${latitude}, ${longitude}`);

    // Use the exact fetch pattern you provided
    const requestOptions = {
      method: 'GET',
    };

    const geoapifyUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&lang=ar&apiKey=c17596bb6ccf4016a35575463bdebee8`;
    
    console.log(`Making request to: ${geoapifyUrl}`);

    const response = await fetch(geoapifyUrl, requestOptions);
    const result = await response.json();

    console.log('Geoapify response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("Geoapify API error:", result);
      return new Response(
        JSON.stringify({ 
          error: result.message || "Error from Geoapify API",
          details: result 
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

    // Parse the results array like in your example
    const locationResult = result.results?.[0];
    if (!locationResult) {
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

    // Extract neighborhood/area from the result using the structure from your example
    const neighborhood = 
      locationResult.suburb ||
      locationResult.city_district ||
      locationResult.neighbourhood ||
      locationResult.quarter ||
      locationResult.district ||
      locationResult.city ||
      locationResult.town ||
      locationResult.village ||
      locationResult.state_district ||
      locationResult.county ||
      'منطقة غير محددة';

    console.log(`Extracted neighborhood: ${neighborhood}`);

    return new Response(
      JSON.stringify({ 
        neighborhood: neighborhood.trim(),
        fullAddress: locationResult.formatted || '',
        confidence: locationResult.rank?.confidence || 0,
        success: true
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message,
        success: false
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
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  try {
    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Only allow POST method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ 
          error: "Method not allowed",
          message: "Only POST method is supported"
        }),
        {
          status: 405,
          headers: corsHeaders,
        }
      );
    }

    // Get API key from environment variable
    const apiKey = Deno.env.get("GEO_API");
    if (!apiKey) {
      console.error("GEO_API environment variable is not set");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error",
          message: "Routing service is not properly configured"
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON",
          message: "Request body must be valid JSON"
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { origin_lat, origin_lon, destination_lat, destination_lon } = requestBody;

    // Validate input parameters
    if (origin_lat === null || origin_lat === undefined || 
        origin_lon === null || origin_lon === undefined ||
        destination_lat === null || destination_lat === undefined ||
        destination_lon === null || destination_lon === undefined) {
      return new Response(
        JSON.stringify({ 
          error: "Missing coordinates",
          message: "All coordinates (origin_lat, origin_lon, destination_lat, destination_lon) are required"
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate that coordinates are numbers
    const originLat = parseFloat(origin_lat);
    const originLon = parseFloat(origin_lon);
    const destLat = parseFloat(destination_lat);
    const destLon = parseFloat(destination_lon);
    
    if (isNaN(originLat) || isNaN(originLon) || isNaN(destLat) || isNaN(destLon)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid coordinates",
          message: "All coordinates must be valid numbers"
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate coordinate ranges
    if (originLat < -90 || originLat > 90 || originLon < -180 || originLon > 180 ||
        destLat < -90 || destLat > 90 || destLon < -180 || destLon > 180) {
      return new Response(
        JSON.stringify({ 
          error: "Coordinates out of range",
          message: "Latitude must be between -90 and 90, longitude must be between -180 and 180"
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    console.log(`Calculating route from ${originLat},${originLon} to ${destLat},${destLon}`);

    // Build Geoapify Routing API URL
    const waypoints = `${originLat}%2C${originLon}%7C${destLat}%2C${destLon}`;
    const routingUrl = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=drive&apiKey=${apiKey}`;
    
    console.log(`Making request to Geoapify Routing API`);

    // Make request to Geoapify API
    let response;
    try {
      response = await fetch(routingUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
    } catch (fetchError) {
      console.error("Network error when calling Geoapify:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: "Network error",
          message: "Unable to connect to routing service"
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Check if API request was successful
    if (!response.ok) {
      console.error(`Geoapify API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: "Routing service error",
          message: `API returned status ${response.status}`
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Parse API response
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error("Error parsing Geoapify response:", jsonError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid API response",
          message: "Routing service returned invalid data"
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    console.log('Geoapify routing response structure:', JSON.stringify(result, null, 2));

    // Extract distance from routing response
    if (!result.features || !Array.isArray(result.features) || result.features.length === 0) {
      console.log('No route found in API response');
      return new Response(
        JSON.stringify({ 
          error: "No route found",
          message: "No route could be calculated between these locations"
        }),
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    const route = result.features[0];
    if (!route.properties || typeof route.properties.distance !== 'number') {
      console.log('No distance information found in route');
      return new Response(
        JSON.stringify({ 
          error: "No distance data",
          message: "Route found but no distance information available"
        }),
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    const distanceInMeters = route.properties.distance;
    const timeInSeconds = route.properties.time || 0;

    console.log(`Successfully calculated route: ${distanceInMeters}m, ${timeInSeconds}s`);

    // Return successful response with distance and time
    return new Response(
      JSON.stringify({ 
        distance: distanceInMeters,
        time: timeInSeconds,
        distance_km: Math.round(distanceInMeters / 1000 * 100) / 100, // Convert to km with 2 decimal places
        time_minutes: Math.round(timeInSeconds / 60) // Convert to minutes
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );

  } catch (error) {
    console.error("Unexpected error in Edge Function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: "An unexpected error occurred while calculating the route"
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
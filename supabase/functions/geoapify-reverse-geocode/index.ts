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
          message: "Geocoding service is not properly configured"
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

    const { latitude, longitude } = requestBody;

    // Validate input parameters
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return new Response(
        JSON.stringify({ 
          error: "Missing coordinates",
          message: "Both latitude and longitude are required"
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate that coordinates are numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid coordinates",
          message: "Latitude and longitude must be valid numbers"
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
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

    console.log(`Reverse geocoding for coordinates: ${lat}, ${lon}`);

    // Build Geoapify API URL
    const geoapifyUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apiKey}`;
    
    console.log(`Making request to Geoapify API`);

    // Make request to Geoapify API
    let response;
    try {
      response = await fetch(geoapifyUrl, {
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
          message: "Unable to connect to geocoding service"
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
          error: "Geocoding service error",
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
          message: "Geocoding service returned invalid data"
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    console.log('Geoapify response structure:', JSON.stringify(result, null, 2));

    // Handle both possible response formats from Geoapify
    let locationData = null;

    // Try features array first (GeoJSON format)
    if (result.features && Array.isArray(result.features) && result.features.length > 0) {
      locationData = result.features[0].properties;
      console.log('Using features[0].properties format');
    }
    // Fallback to results array (alternative format)
    else if (result.results && Array.isArray(result.results) && result.results.length > 0) {
      locationData = result.results[0];
      console.log('Using results[0] format');
    }

    // Check if we found any location data
    if (!locationData) {
      console.log('No location data found in API response');
      return new Response(
        JSON.stringify({ 
          error: "No location data found",
          message: "No address information available for these coordinates"
        }),
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // Extract neighborhood/area information with priority order
    const neighborhood = 
      locationData.suburb ||
      locationData.city_district ||
      locationData.neighbourhood ||
      locationData.quarter ||
      locationData.district ||
      locationData.city ||
      locationData.town ||
      locationData.village ||
      locationData.state_district ||
      locationData.county ||
      null;

    // Check if we could extract a meaningful neighborhood
    if (!neighborhood || neighborhood.trim() === '') {
      console.log('No neighborhood information found in location data');
      return new Response(
        JSON.stringify({ 
          error: "No area information found",
          message: "No specific area or neighborhood information available for these coordinates"
        }),
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    console.log(`Successfully extracted neighborhood: ${neighborhood}`);

    // Return successful response with only neighborhood
    return new Response(
      JSON.stringify({ 
        neighborhood: neighborhood.trim()
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
        message: "An unexpected error occurred while processing your request"
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
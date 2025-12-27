import { NextRequest, NextResponse } from "next/server";

interface DistanceResult {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  origin: string;
  destination: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Call Google Distance Matrix API
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.append("origins", origin);
    url.searchParams.append("destinations", destination);
    url.searchParams.append("units", "imperial");
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Distance Matrix API error:", data);
      return NextResponse.json(
        { error: data.error_message || "Failed to calculate distance" },
        { status: 400 }
      );
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== "OK") {
      return NextResponse.json(
        { error: "Could not calculate distance between these locations" },
        { status: 400 }
      );
    }

    const result: DistanceResult = {
      distance: {
        text: element.distance.text,
        value: element.distance.value,
      },
      duration: {
        text: element.duration.text,
        value: element.duration.value,
      },
      origin: data.origin_addresses[0],
      destination: data.destination_addresses[0],
    };

    // Calculate miles and hours for the cost sheet
    const miles = element.distance.value / 1609.34; // Convert meters to miles
    const hours = element.duration.value / 3600; // Convert seconds to hours

    return NextResponse.json({
      ...result,
      miles: Math.round(miles * 10) / 10, // Round to 1 decimal
      hours: Math.round(hours * 100) / 100, // Round to 2 decimals
      roundTripMiles: Math.round(miles * 2 * 10) / 10,
      roundTripHours: Math.round(hours * 2 * 100) / 100,
    });
  } catch (error) {
    console.error("Error calculating distance:", error);
    return NextResponse.json(
      { error: "Failed to calculate distance" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

// GET /api/distance - Calculate distance between two addresses using Google Maps
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Both origin and destination addresses are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Call Google Maps Distance Matrix API
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', origin);
    url.searchParams.set('destinations', destination);
    url.searchParams.set('units', 'imperial'); // Use miles
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Maps API error:', data);
      return NextResponse.json(
        { error: `Google Maps API error: ${data.status}` },
        { status: 500 }
      );
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      return NextResponse.json(
        { error: 'Could not calculate distance between addresses' },
        { status: 400 }
      );
    }

    // Extract distance and duration
    const distanceInMeters = element.distance.value;
    const durationInSeconds = element.duration.value;

    // Convert to miles and hours
    const distanceInMiles = distanceInMeters / 1609.34;
    const durationInHours = durationInSeconds / 3600;

    // Round trip values
    const roundTripMiles = distanceInMiles * 2;
    const roundTripHours = durationInHours * 2;

    return NextResponse.json({
      origin: data.origin_addresses?.[0] || origin,
      destination: data.destination_addresses?.[0] || destination,
      distance: {
        text: element.distance.text,
        miles: parseFloat(distanceInMiles.toFixed(1)),
        roundTripMiles: parseFloat(roundTripMiles.toFixed(1)),
      },
      duration: {
        text: element.duration.text,
        hours: parseFloat(durationInHours.toFixed(2)),
        roundTripHours: parseFloat(roundTripHours.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error calculating distance:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distance' },
      { status: 500 }
    );
  }
}

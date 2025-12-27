import { NextRequest, NextResponse } from 'next/server';

// HubSpot API integration for contact and deal search
// Requires a Private App access token from HubSpot

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    company?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    job_site_address?: string;
    description?: string;
  };
  associations?: {
    contacts?: { results: { id: string }[] };
    companies?: { results: { id: string }[] };
  };
}

// GET /api/hubspot - Search contacts or deals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = request.headers.get('x-hubspot-token');
    const searchType = searchParams.get('type') || 'contacts'; // contacts or deals
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'HubSpot access token required' },
        { status: 401 }
      );
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    if (searchType === 'contacts') {
      // Search contacts
      const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit,
          properties: ['firstname', 'lastname', 'email', 'company', 'phone', 'address', 'city', 'state', 'zip'],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('HubSpot API error:', error);
        return NextResponse.json(
          { error: error.message || 'HubSpot API error' },
          { status: response.status }
        );
      }

      const data = await response.json();
      const contacts = (data.results || []).map((contact: HubSpotContact) => ({
        id: contact.id,
        name: [contact.properties.firstname, contact.properties.lastname].filter(Boolean).join(' ') || contact.properties.email || 'Unknown',
        email: contact.properties.email,
        company: contact.properties.company,
        phone: contact.properties.phone,
        address: [
          contact.properties.address,
          contact.properties.city,
          contact.properties.state,
          contact.properties.zip
        ].filter(Boolean).join(', '),
      }));

      return NextResponse.json({ results: contacts });
    } else if (searchType === 'deals') {
      // Search deals
      const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit,
          properties: ['dealname', 'amount', 'dealstage', 'closedate', 'job_site_address', 'description'],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('HubSpot API error:', error);
        return NextResponse.json(
          { error: error.message || 'HubSpot API error' },
          { status: response.status }
        );
      }

      const data = await response.json();
      const deals = (data.results || []).map((deal: HubSpotDeal) => ({
        id: deal.id,
        name: deal.properties.dealname || 'Untitled Deal',
        amount: deal.properties.amount,
        stage: deal.properties.dealstage,
        closeDate: deal.properties.closedate,
        jobSiteAddress: deal.properties.job_site_address,
        description: deal.properties.description,
      }));

      return NextResponse.json({ results: deals });
    }

    return NextResponse.json({ results: [] });
  } catch (error) {
    console.error('HubSpot API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from HubSpot' },
      { status: 500 }
    );
  }
}

// POST /api/hubspot/test - Test HubSpot connection
export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      );
    }

    // Test the connection by fetching account info
    const response = await fetch(`${HUBSPOT_API_BASE}/account-info/v3/details`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, error: error.message || 'Invalid access token' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      portalId: data.portalId,
      accountType: data.accountType,
      uiDomain: data.uiDomain,
    });
  } catch (error) {
    console.error('HubSpot connection test error:', error);
    return NextResponse.json(
      { success: false, error: 'Connection failed' },
      { status: 500 }
    );
  }
}

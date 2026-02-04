// app/api/oscar/[...path]/route.ts

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const OSCAR_API_BASE = process.env.OSCAR_API_URL || 'https://orthodoxbookshop.asia/api';

async function proxyToOscar(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('oscar-session-id')?.value;
  
  // Build the target URL
  const path = pathSegments.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${OSCAR_API_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`;

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (sessionId) {
    headers['Session-Id'] = sessionId;
  }

  // Forward auth header if present (for logged-in users)
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Prepare request options
  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Include body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
    } catch {
      // No body or invalid JSON — that's fine for some requests
    }
  }

  // Make the request to Django
  const oscarResponse = await fetch(targetUrl, fetchOptions);
  
  // Parse response
  let data;
  const contentType = oscarResponse.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await oscarResponse.json();
  } else {
    data = await oscarResponse.text();
  }

  // Build Next.js response
  const response = typeof data === 'string' 
    ? new NextResponse(data, { status: oscarResponse.status })
    : NextResponse.json(data, { status: oscarResponse.status });

  // Capture and forward Session-Id as httpOnly cookie
  const newSessionId = oscarResponse.headers.get('Session-Id');
  if (newSessionId) {
    response.cookies.set('oscar-session-id', newSessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      // secure: true, // Enable in production with HTTPS
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

// Handle all HTTP methods
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToOscar(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToOscar(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToOscar(request, path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToOscar(request, path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToOscar(request, path, 'DELETE');
}

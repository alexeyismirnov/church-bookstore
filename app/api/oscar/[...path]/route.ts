// app/api/oscar/[...path]/route.ts

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const OSCAR_API_BASE = process.env.OSCAR_API_URL || 'https://orthodoxbookshop.asia/api';

function setSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set('oscar-session-id', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

async function proxyToOscar(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const cookieStore = await cookies();

  // Read our stored Django session key from the proxy's own cookie.
  const sessionCookie = cookieStore.get('oscar-session-id')?.value;

  // Get language from cookie (set by Django's set_language)
  const languageCookie = cookieStore.get('django_language')?.value;

  // Build the target URL
  const path = pathSegments.join('/');
  const searchParams = request.nextUrl.searchParams.toString();

  // Ensure trailing slash for Django compatibility
  const targetUrl = `${OSCAR_API_BASE}/${path}/${searchParams ? `?${searchParams}` : ''}`;

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Forward the Django session as a Cookie header so that Django's standard
  // SessionMiddleware can read it. We do NOT use the oscarapi Session-Id
  // header because:
  //  1. oscarapi's HeaderSessionMiddleware hashes the Session-Id value with
  //     SECRET_KEY to derive a Django session key.
  //  2. When no session with that key exists, get_session() calls
  //     SessionStore.save(must_create=True) which generates its OWN key.
  //  3. process_response() then asserts that the session key equals the
  //     derived hash — this fails because Django generated a different key.
  // Instead, we let the standard cookie-based SessionMiddleware handle
  // sessions. The proxy acts as a browser: it sends/receives the sessionid
  // cookie and stores it in its own oscar-session-id cookie for the client.
  const cookieParts: string[] = [];
  if (sessionCookie) {
    cookieParts.push(`sessionid=${sessionCookie}`);
  }
  if (languageCookie) {
    cookieParts.push(`django_language=${languageCookie}`);
  }
  if (cookieParts.length > 0) {
    headers['Cookie'] = cookieParts.join('; ');
  }

  // Forward the language preference to Django API
  const acceptLanguageHeader = request.headers.get('Accept-Language');
  const languageToUse = acceptLanguageHeader || languageCookie;

  if (languageToUse) {
    headers['Accept-Language'] = languageToUse;
  }

  // Forward the currency preference to Django API
  const currencyHeader = request.headers.get('X-Currency');
  if (currencyHeader) {
    headers['X-Currency'] = currencyHeader;
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

  // Include body for POST/PUT/PATCH/DELETE
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
    } catch {
      // No body or invalid JSON — that's fine for some requests
    }
  }

  // Make the request to Django
  const oscarResponse = await fetch(targetUrl, fetchOptions);

  // Extract sessionid from Django's Set-Cookie header so we can store it
  // in our own cookie. We do this regardless of response status.
  let newSessionId: string | null = null;
  const setCookies = oscarResponse.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    const match = cookie.match(/\bsessionid=([^;]+)/);
    if (match) {
      newSessionId = match[1];
      break;
    }
  }

  // Handle no-content responses (204, 205, 304) - these cannot have a body
  const noContentStatus = oscarResponse.status === 204
    || oscarResponse.status === 205
    || oscarResponse.status === 304;

  if (noContentStatus) {
    const response = new NextResponse(null, { status: oscarResponse.status });

    // Store the Django session key in our proxy cookie
    if (newSessionId) {
      setSessionCookie(response, newSessionId);
    }

    return response;
  }

  // Parse response for normal responses
  let data;
  const contentType = oscarResponse.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await oscarResponse.json();
  } else {
    data = await oscarResponse.text();
  }

  // Build Next.js response
  const response = typeof data === 'string' && data
    ? new NextResponse(data, { status: oscarResponse.status })
    : NextResponse.json(data ?? null, { status: oscarResponse.status });

  // Store the Django session key in our proxy cookie
  if (newSessionId) {
    setSessionCookie(response, newSessionId);
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

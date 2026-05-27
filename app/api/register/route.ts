import { NextRequest, NextResponse } from 'next/server';

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY;
const OSCAR_API_URL = process.env.OSCAR_API_URL || 'https://orthodoxbookshop.asia/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hcaptcha_token, ...registrationData } = body;

    // 1. Validate captcha token
    if (!hcaptcha_token) {
      return NextResponse.json(
        { error: 'Captcha verification is required' },
        { status: 400 }
      );
    }

    // 2. Verify hCaptcha
    if (!HCAPTCHA_SECRET) {
      console.error('HCAPTCHA_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const captchaResponse = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${HCAPTCHA_SECRET}&response=${hcaptcha_token}`,
    });
    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return NextResponse.json(
        { error: 'Captcha verification failed' },
        { status: 400 }
      );
    }

    // 3. Forward to Django backend WITHOUT the captcha token
    // Build headers, forwarding language and currency preferences
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const acceptLanguage = request.headers.get('Accept-Language');
    if (acceptLanguage) {
      headers['Accept-Language'] = acceptLanguage;
    }

    const currency = request.headers.get('X-Currency');
    if (currency) {
      headers['X-Currency'] = currency;
    }

    const oscarResponse = await fetch(`${OSCAR_API_URL}/register/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(registrationData),
    });

    const data = await oscarResponse.json();
    return NextResponse.json(data, { status: oscarResponse.status });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

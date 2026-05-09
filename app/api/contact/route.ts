import { NextRequest, NextResponse } from 'next/server';

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY;
const OSCAR_API_URL = process.env.OSCAR_API_URL || 'https://orthodoxbookshop.asia/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, hcaptchaToken } = body;

    // 1. Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'name, email, and message are required' },
        { status: 400 }
      );
    }

    if (!hcaptchaToken) {
      return NextResponse.json(
        { error: 'Captcha verification is required' },
        { status: 400 }
      );
    }

    // 2. Verify hCaptcha server-side
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
      body: `secret=${HCAPTCHA_SECRET}&response=${hcaptchaToken}`,
    });
    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return NextResponse.json(
        { error: 'Captcha verification failed' },
        { status: 400 }
      );
    }

    // 3. Forward to Django backend
    const oscarResponse = await fetch(`${OSCAR_API_URL}/contact/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    });

    if (!oscarResponse.ok) {
      let errorData;
      try {
        errorData = await oscarResponse.json();
      } catch {
        errorData = { error: 'Failed to send message' };
      }
      return NextResponse.json(errorData, { status: oscarResponse.status });
    }

    const data = await oscarResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

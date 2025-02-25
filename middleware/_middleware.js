// pages/_middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
    const response = NextResponse.next();
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
}

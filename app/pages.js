import { NextResponse } from 'next/server';

// Redirect to dashboard by default
export async function GET() {
  return NextResponse.redirect(new URL('/focus-planner', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
} 
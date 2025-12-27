import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  await clearSession();
}
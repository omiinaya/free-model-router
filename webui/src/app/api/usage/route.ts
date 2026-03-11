import { NextResponse } from 'next/server';
import { loadTokenUsageByProviderModel } from '@/lib/token-usage-server';

export async function GET() {
  try {
    const usageByModel = loadTokenUsageByProviderModel();
    return NextResponse.json({ usageByModel });
  } catch (error) {
    console.error('Failed to load token usage:', error);
    return NextResponse.json({ error: 'Failed to load usage' }, { status: 500 });
  }
}

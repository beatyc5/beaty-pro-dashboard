import { NextResponse } from 'next/server';
import { dashboardService } from '@/lib/dashboardService';

export async function GET() {
  try {
    const dashboardData = await dashboardService.getDashboardData();
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

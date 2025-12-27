import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/activity-logs?costSheetId=xxx - Get activity logs for a cost sheet
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const costSheetId = searchParams.get('costSheetId');

    if (!costSheetId) {
      return NextResponse.json(
        { error: 'costSheetId is required' },
        { status: 400 }
      );
    }

    const logs = await prisma.activityLog.findMany({
      where: { costSheetId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/analytics - Get pricing analytics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) {
      where.category = category;
    }

    // Get all cost sheets (or filtered by category)
    const costSheets = await prisma.costSheet.findMany({
      where,
      select: {
        id: true,
        category: true,
        outcome: true,
        pricePerSqFtPreDelivery: true,
        pricePerLinFtPreDelivery: true,
        canopySqFt: true,
        awningLinFt: true,
      },
    });

    // Calculate averages by category
    const categoryStats: Record<string, any> = {};

    for (const sheet of costSheets) {
      if (!categoryStats[sheet.category]) {
        categoryStats[sheet.category] = {
          category: sheet.category,
          count: 0,
          wonCount: 0,
          lostCount: 0,
          unknownCount: 0,
          avgPricePerSqFt: 0,
          avgPricePerLinFt: 0,
          wonAvgPricePerSqFt: 0,
          wonAvgPricePerLinFt: 0,
          totalSqFtPrice: 0,
          totalLinFtPrice: 0,
          wonTotalSqFtPrice: 0,
          wonTotalLinFtPrice: 0,
          sqFtCount: 0,
          linFtCount: 0,
          wonSqFtCount: 0,
          wonLinFtCount: 0,
        };
      }

      const stats = categoryStats[sheet.category];
      stats.count++;

      if (sheet.outcome === 'Won') {
        stats.wonCount++;
      } else if (sheet.outcome === 'Lost') {
        stats.lostCount++;
      } else {
        stats.unknownCount++;
      }

      // Add to running totals for averaging
      if (sheet.pricePerSqFtPreDelivery) {
        stats.totalSqFtPrice += sheet.pricePerSqFtPreDelivery;
        stats.sqFtCount++;

        if (sheet.outcome === 'Won') {
          // Weight won jobs more heavily (3x weight)
          stats.wonTotalSqFtPrice += sheet.pricePerSqFtPreDelivery * 3;
          stats.wonSqFtCount += 3;
        } else {
          stats.wonTotalSqFtPrice += sheet.pricePerSqFtPreDelivery;
          stats.wonSqFtCount++;
        }
      }

      if (sheet.pricePerLinFtPreDelivery) {
        stats.totalLinFtPrice += sheet.pricePerLinFtPreDelivery;
        stats.linFtCount++;

        if (sheet.outcome === 'Won') {
          // Weight won jobs more heavily (3x weight)
          stats.wonTotalLinFtPrice += sheet.pricePerLinFtPreDelivery * 3;
          stats.wonLinFtCount += 3;
        } else {
          stats.wonTotalLinFtPrice += sheet.pricePerLinFtPreDelivery;
          stats.wonLinFtCount++;
        }
      }
    }

    // Calculate final averages
    Object.values(categoryStats).forEach((stats: any) => {
      if (stats.sqFtCount > 0) {
        stats.avgPricePerSqFt = stats.totalSqFtPrice / stats.sqFtCount;
      }
      if (stats.linFtCount > 0) {
        stats.avgPricePerLinFt = stats.totalLinFtPrice / stats.linFtCount;
      }
      if (stats.wonSqFtCount > 0) {
        stats.wonAvgPricePerSqFt = stats.wonTotalSqFtPrice / stats.wonSqFtCount;
      }
      if (stats.wonLinFtCount > 0) {
        stats.wonAvgPricePerLinFt = stats.wonTotalLinFtPrice / stats.wonLinFtCount;
      }

      // Clean up intermediate values
      delete stats.totalSqFtPrice;
      delete stats.totalLinFtPrice;
      delete stats.wonTotalSqFtPrice;
      delete stats.wonTotalLinFtPrice;
      delete stats.sqFtCount;
      delete stats.linFtCount;
      delete stats.wonSqFtCount;
      delete stats.wonLinFtCount;
    });

    return NextResponse.json({
      byCategory: Object.values(categoryStats),
      totalSheets: costSheets.length,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

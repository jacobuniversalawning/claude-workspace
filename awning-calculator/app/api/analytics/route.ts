import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/analytics - Get pricing analytics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, string> = {};
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
        competitorPrice: true,
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
          // Competitor pricing tracking
          competitorPriceCount: 0,
          competitorTotalSqFtPrice: 0,
          competitorTotalLinFtPrice: 0,
          competitorSqFtCount: 0,
          competitorLinFtCount: 0,
          avgCompetitorPricePerSqFt: 0,
          avgCompetitorPricePerLinFt: 0,
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

      // Track competitor pricing (separate from our own metrics)
      if (sheet.competitorPrice && sheet.competitorPrice > 0) {
        stats.competitorPriceCount++;

        // Calculate competitor $/sqft if we have sqft data
        if (sheet.canopySqFt && sheet.canopySqFt > 0) {
          const compSqFtPrice = sheet.competitorPrice / sheet.canopySqFt;
          stats.competitorTotalSqFtPrice += compSqFtPrice;
          stats.competitorSqFtCount++;
        }

        // Calculate competitor $/linft if we have linft data
        if (sheet.awningLinFt && sheet.awningLinFt > 0) {
          const compLinFtPrice = sheet.competitorPrice / sheet.awningLinFt;
          stats.competitorTotalLinFtPrice += compLinFtPrice;
          stats.competitorLinFtCount++;
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

      // Competitor averages
      if (stats.competitorSqFtCount > 0) {
        stats.avgCompetitorPricePerSqFt = stats.competitorTotalSqFtPrice / stats.competitorSqFtCount;
      }
      if (stats.competitorLinFtCount > 0) {
        stats.avgCompetitorPricePerLinFt = stats.competitorTotalLinFtPrice / stats.competitorLinFtCount;
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
      delete stats.competitorTotalSqFtPrice;
      delete stats.competitorTotalLinFtPrice;
      delete stats.competitorSqFtCount;
      delete stats.competitorLinFtCount;
    });

    return NextResponse.json({
      byCategory: Object.values(categoryStats),
      totalSheets: costSheets.length,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    // Return empty analytics on error so the app still loads
    return NextResponse.json({
      byCategory: [],
      totalSheets: 0,
    });
  }
}

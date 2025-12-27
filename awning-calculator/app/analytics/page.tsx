'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculations';

interface CostSheet {
  id: string;
  category: string;
  customer?: string;
  project?: string;
  inquiryDate: string;
  totalPriceToClient: number;
  totalWithMarkup: number;
  subtotalBeforeMarkup: number;
  pricePerSqFtPreDelivery?: number;
  pricePerLinFtPreDelivery?: number;
  outcome: string;
  createdAt: string;
  estimator?: string;
  salesRep?: string;
  canopySqFt?: number;
  awningLinFt?: number;
  totalMaterials?: number;
  totalFabric?: number;
  totalLabor?: number;
  markup?: number;
}

type TabType = 'overview' | 'categories' | 'trends' | 'winloss' | 'salesreps' | 'charts' | 'search';

// Simple bar chart component
function BarChart({
  data,
  maxValue,
  color = 'blue'
}: {
  data: { label: string; value: number; secondaryValue?: number }[];
  maxValue: number;
  color?: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500 dark:bg-blue-400',
    green: 'bg-green-500 dark:bg-green-400',
    red: 'bg-red-500 dark:bg-red-400',
    purple: 'bg-purple-500 dark:bg-purple-400'
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="w-32 text-sm text-gray-600 dark:text-gray-300 truncate" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
            <div
              className={`h-full ${colorClasses[color]} transition-all duration-500`}
              style={{ width: `${Math.min((item.value / maxValue) * 100, 100)}%` }}
            />
          </div>
          <span className="w-24 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Simple horizontal percentage bar
function WinRateBar({ winRate }: { winRate: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-green-500"
          style={{ width: `${winRate}%` }}
          title={`Won: ${winRate.toFixed(1)}%`}
        />
        <div
          className="h-full bg-red-500"
          style={{ width: `${100 - winRate}%` }}
          title={`Lost/Unknown: ${(100 - winRate).toFixed(1)}%`}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-16 text-right">
        {winRate.toFixed(1)}%
      </span>
    </div>
  );
}

// Donut Chart Component
function DonutChart({
  data,
  centerLabel,
  centerValue
}: {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativePercent = 0;

  const segments = data.map(d => {
    const percent = total > 0 ? (d.value / total) * 100 : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return {
      ...d,
      percent,
      startPercent,
      endPercent: cumulativePercent
    };
  });

  return (
    <div className="relative">
      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg, idx) => {
            const radius = 40;
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((seg.startPercent / 100) * circumference);

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                strokeWidth="15"
                stroke={seg.color}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{centerValue}</span>
            <span className="text-sm text-gray-500">{centerLabel}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {seg.label} ({seg.percent.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bubble Chart Component for job distribution visualization
function BubbleChart({
  data
}: {
  data: { label: string; value: number; revenue: number; color: string }[];
}) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="relative h-80 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-hidden">
      <div className="absolute inset-4 flex flex-wrap items-center justify-center gap-2">
        {data.map((item, idx) => {
          // Size based on revenue, position based on value
          const size = Math.max(30, Math.min(120, (item.revenue / maxRevenue) * 100 + 30));
          const opacity = Math.max(0.4, item.value / maxValue);

          return (
            <div
              key={idx}
              className="relative group cursor-pointer transition-transform hover:scale-110"
              style={{
                width: size,
                height: size,
              }}
            >
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center text-white font-medium text-xs text-center p-1"
                style={{
                  backgroundColor: item.color,
                  opacity
                }}
              >
                <span className="truncate max-w-full">
                  {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
                </span>
              </div>
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {item.label}: {item.value} jobs, {formatCurrency(item.revenue)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Scatter Plot Component
function ScatterPlot({
  data
}: {
  data: { x: number; y: number; label: string; outcome: string }[];
}) {
  const maxX = Math.max(...data.map(d => d.x), 1);
  const maxY = Math.max(...data.map(d => d.y), 1);

  return (
    <div className="relative h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300 dark:bg-gray-600" />
      <div className="absolute top-0 bottom-0 left-0 w-px bg-gray-300 dark:bg-gray-600" />
      <div className="absolute bottom-2 right-4 text-xs text-gray-400">Price →</div>
      <div className="absolute top-4 left-2 text-xs text-gray-400 transform -rotate-90">Size →</div>

      {data.map((point, idx) => {
        const xPos = (point.x / maxX) * 90 + 5;
        const yPos = 95 - ((point.y / maxY) * 85 + 5);

        return (
          <div
            key={idx}
            className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${xPos}%`,
              top: `${yPos}%`,
              backgroundColor: point.outcome === 'Won' ? '#22c55e' : point.outcome === 'Lost' ? '#ef4444' : '#9ca3af'
            }}
            title={`${point.label}: ${formatCurrency(point.x)} price, ${point.y.toFixed(0)} sq ft`}
          >
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {point.label}: {formatCurrency(point.x)}, {point.y.toFixed(0)} sq ft
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-4 right-4 flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-500">Won</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-500">Lost</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-gray-500">Unknown</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [costSheets, setCostSheets] = useState<CostSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '30' | '90' | '365'>('all');

  useEffect(() => {
    fetchCostSheets();
  }, []);

  const fetchCostSheets = async () => {
    try {
      const response = await fetch('/api/costsheets');
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCostSheets(data);
      } else {
        const localData = localStorage.getItem('costSheets');
        if (localData) {
          setCostSheets(JSON.parse(localData));
        }
      }
    } catch {
      try {
        const localData = localStorage.getItem('costSheets');
        if (localData) {
          setCostSheets(JSON.parse(localData));
        }
      } catch {
        console.error('LocalStorage error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter data by date range
  const filteredSheets = useMemo(() => {
    if (dateRange === 'all') return costSheets;

    const now = new Date();
    const days = parseInt(dateRange);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return costSheets.filter(sheet => new Date(sheet.inquiryDate) >= cutoff);
  }, [costSheets, dateRange]);

  // Calculate overview metrics
  const overviewMetrics = useMemo(() => {
    const totalJobs = filteredSheets.length;
    const wonJobs = filteredSheets.filter(s => s.outcome === 'Won');
    const lostJobs = filteredSheets.filter(s => s.outcome === 'Lost');

    const totalRevenue = wonJobs.reduce((sum, s) => sum + (s.totalPriceToClient || 0), 0);
    const potentialRevenue = filteredSheets.reduce((sum, s) => sum + (s.totalPriceToClient || 0), 0);
    const lostRevenue = lostJobs.reduce((sum, s) => sum + (s.totalPriceToClient || 0), 0);

    const winRate = totalJobs > 0 ? (wonJobs.length / totalJobs) * 100 : 0;
    const avgDealSize = wonJobs.length > 0 ? totalRevenue / wonJobs.length : 0;

    // Calculate average markup from won jobs
    const avgMarkup = wonJobs.length > 0
      ? wonJobs.reduce((sum, s) => sum + (s.markup || 0.8), 0) / wonJobs.length * 100
      : 80;

    // Calculate average prices
    const sqFtPrices = wonJobs.filter(s => s.pricePerSqFtPreDelivery).map(s => s.pricePerSqFtPreDelivery!);
    const linFtPrices = wonJobs.filter(s => s.pricePerLinFtPreDelivery).map(s => s.pricePerLinFtPreDelivery!);
    const avgSqFtPrice = sqFtPrices.length > 0 ? sqFtPrices.reduce((a, b) => a + b, 0) / sqFtPrices.length : 0;
    const avgLinFtPrice = linFtPrices.length > 0 ? linFtPrices.reduce((a, b) => a + b, 0) / linFtPrices.length : 0;

    return {
      totalJobs,
      wonCount: wonJobs.length,
      lostCount: lostJobs.length,
      unknownCount: totalJobs - wonJobs.length - lostJobs.length,
      totalRevenue,
      potentialRevenue,
      lostRevenue,
      winRate,
      avgDealSize,
      avgMarkup,
      avgSqFtPrice,
      avgLinFtPrice
    };
  }, [filteredSheets]);

  // Category breakdown
  const categoryMetrics = useMemo(() => {
    const categories: Record<string, {
      count: number;
      wonCount: number;
      revenue: number;
      avgPrice: number;
      avgSqFt: number;
      avgLinFt: number;
    }> = {};

    filteredSheets.forEach(sheet => {
      const cat = sheet.category || 'Other';
      if (!categories[cat]) {
        categories[cat] = { count: 0, wonCount: 0, revenue: 0, avgPrice: 0, avgSqFt: 0, avgLinFt: 0 };
      }
      categories[cat].count++;
      if (sheet.outcome === 'Won') {
        categories[cat].wonCount++;
        categories[cat].revenue += sheet.totalPriceToClient || 0;
      }
    });

    // Calculate averages
    Object.keys(categories).forEach(cat => {
      const catSheets = filteredSheets.filter(s => s.category === cat && s.outcome === 'Won');
      if (catSheets.length > 0) {
        categories[cat].avgPrice = categories[cat].revenue / catSheets.length;
        const sqFtPrices = catSheets.filter(s => s.pricePerSqFtPreDelivery).map(s => s.pricePerSqFtPreDelivery!);
        const linFtPrices = catSheets.filter(s => s.pricePerLinFtPreDelivery).map(s => s.pricePerLinFtPreDelivery!);
        categories[cat].avgSqFt = sqFtPrices.length > 0 ? sqFtPrices.reduce((a, b) => a + b, 0) / sqFtPrices.length : 0;
        categories[cat].avgLinFt = linFtPrices.length > 0 ? linFtPrices.reduce((a, b) => a + b, 0) / linFtPrices.length : 0;
      }
    });

    return Object.entries(categories)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSheets]);

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const months: Record<string, { revenue: number; count: number; wonCount: number }> = {};

    filteredSheets.forEach(sheet => {
      const date = new Date(sheet.inquiryDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[monthKey]) {
        months[monthKey] = { revenue: 0, count: 0, wonCount: 0 };
      }
      months[monthKey].count++;
      if (sheet.outcome === 'Won') {
        months[monthKey].revenue += sheet.totalPriceToClient || 0;
        months[monthKey].wonCount++;
      }
    });

    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [filteredSheets]);

  // Win/Loss analysis by price range
  const priceRangeAnalysis = useMemo(() => {
    const ranges = [
      { label: '$0 - $5K', min: 0, max: 5000 },
      { label: '$5K - $15K', min: 5000, max: 15000 },
      { label: '$15K - $30K', min: 15000, max: 30000 },
      { label: '$30K - $50K', min: 30000, max: 50000 },
      { label: '$50K - $100K', min: 50000, max: 100000 },
      { label: '$100K+', min: 100000, max: Infinity }
    ];

    return ranges.map(range => {
      const inRange = filteredSheets.filter(s => {
        const price = s.totalPriceToClient || 0;
        return price >= range.min && price < range.max;
      });
      const won = inRange.filter(s => s.outcome === 'Won');
      const lost = inRange.filter(s => s.outcome === 'Lost');

      return {
        label: range.label,
        total: inRange.length,
        won: won.length,
        lost: lost.length,
        winRate: inRange.length > 0 ? (won.length / inRange.length) * 100 : 0
      };
    }).filter(r => r.total > 0);
  }, [filteredSheets]);

  // Sales rep performance
  const salesRepMetrics = useMemo(() => {
    const reps: Record<string, {
      count: number;
      wonCount: number;
      revenue: number;
      avgDealSize: number;
    }> = {};

    filteredSheets.forEach(sheet => {
      const rep = sheet.estimator || sheet.salesRep || 'Unassigned';
      if (!reps[rep]) {
        reps[rep] = { count: 0, wonCount: 0, revenue: 0, avgDealSize: 0 };
      }
      reps[rep].count++;
      if (sheet.outcome === 'Won') {
        reps[rep].wonCount++;
        reps[rep].revenue += sheet.totalPriceToClient || 0;
      }
    });

    // Calculate average deal size
    Object.keys(reps).forEach(rep => {
      if (reps[rep].wonCount > 0) {
        reps[rep].avgDealSize = reps[rep].revenue / reps[rep].wonCount;
      }
    });

    return Object.entries(reps)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSheets]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    return filteredSheets.filter(sheet =>
      sheet.customer?.toLowerCase().includes(term) ||
      sheet.project?.toLowerCase().includes(term) ||
      sheet.category?.toLowerCase().includes(term) ||
      sheet.estimator?.toLowerCase().includes(term)
    ).slice(0, 20);
  }, [filteredSheets, searchTerm]);

  const inputClass = "border border-gray-300 dark:border-transparent rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-brand-mint bg-white dark:bg-brand-surface-grey-dark text-gray-900 dark:text-brand-text-primary";

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'categories', label: 'Categories', icon: 'M4 6h16M4 12h16M4 18h16' },
    { id: 'trends', label: 'Trends', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'winloss', label: 'Win/Loss', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'salesreps', label: 'Sales Reps', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'charts', label: 'Charts', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
    { id: 'search', label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-brand-surface-black border-b border-gray-200 dark:border-brand-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-h1 text-gray-900 dark:text-brand-text-primary">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-brand-text-secondary mt-1">
                  Insights and performance metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className={inputClass}
              >
                <option value="all">All Time</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-48 flex-shrink-0">
            <nav className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brand-surface-grey-dark border-l-4 border-transparent'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue (Won)</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {formatCurrency(overviewMetrics.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{overviewMetrics.wonCount} jobs</div>
                  </div>
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {overviewMetrics.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{overviewMetrics.wonCount} of {overviewMetrics.totalJobs}</div>
                  </div>
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Avg Deal Size</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                      {formatCurrency(overviewMetrics.avgDealSize)}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">on won jobs</div>
                  </div>
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Lost Revenue</div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                      {formatCurrency(overviewMetrics.lostRevenue)}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{overviewMetrics.lostCount} jobs</div>
                  </div>
                </div>

                {/* Pricing Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Avg $/sq ft (Won)</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {overviewMetrics.avgSqFtPrice > 0 ? formatCurrency(overviewMetrics.avgSqFtPrice) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Avg $/lin ft (Won)</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {overviewMetrics.avgLinFtPrice > 0 ? formatCurrency(overviewMetrics.avgLinFtPrice) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Avg Markup</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {overviewMetrics.avgMarkup.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Job Outcome Breakdown */}
                <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Job Outcomes</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <WinRateBar winRate={overviewMetrics.winRate} />
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{overviewMetrics.wonCount}</div>
                        <div className="text-xs text-gray-500">Won</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{overviewMetrics.lostCount}</div>
                        <div className="text-xs text-gray-500">Lost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">{overviewMetrics.unknownCount}</div>
                        <div className="text-xs text-gray-500">Unknown</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Categories by Revenue</h3>
                  <BarChart
                    data={categoryMetrics.slice(0, 6).map(c => ({
                      label: c.name,
                      value: c.revenue
                    }))}
                    maxValue={Math.max(...categoryMetrics.map(c => c.revenue), 1)}
                    color="blue"
                  />
                </div>
              </>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-brand-border-subtle">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Category Performance</h3>
                  <p className="text-sm text-gray-500 mt-1">Detailed breakdown by product category</p>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-brand-surface-grey-dark">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jobs</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Won</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Win Rate</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg $/sq ft</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg $/lin ft</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-brand-border-subtle">
                    {categoryMetrics.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-brand-surface-grey-dark">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{cat.name}</td>
                        <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">{cat.count}</td>
                        <td className="px-5 py-3 text-sm text-green-600 dark:text-green-400 text-right">{cat.wonCount}</td>
                        <td className="px-5 py-3 text-sm text-right">
                          <span className={`font-medium ${cat.count > 0 && (cat.wonCount / cat.count) >= 0.5 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {cat.count > 0 ? ((cat.wonCount / cat.count) * 100).toFixed(0) : 0}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                          {formatCurrency(cat.revenue)}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                          {cat.avgSqFt > 0 ? formatCurrency(cat.avgSqFt) : '-'}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                          {cat.avgLinFt > 0 ? formatCurrency(cat.avgLinFt) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {categoryMetrics.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No data available</div>
                )}
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Revenue Trend</h3>
                  {monthlyTrends.length > 0 ? (
                    <div className="space-y-3">
                      {monthlyTrends.map((month, idx) => {
                        const maxRevenue = Math.max(...monthlyTrends.map(m => m.revenue), 1);
                        const [year, m] = month.month.split('-');
                        const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="w-24 text-sm text-gray-600 dark:text-gray-300">{monthName}</span>
                            <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden relative">
                              <div
                                className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                                style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 dark:text-gray-300">
                                {month.wonCount} won
                              </span>
                            </div>
                            <span className="w-28 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                              {formatCurrency(month.revenue)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">No data available</div>
                  )}
                </div>

                <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Job Volume</h3>
                  {monthlyTrends.length > 0 ? (
                    <div className="space-y-3">
                      {monthlyTrends.map((month, idx) => {
                        const maxCount = Math.max(...monthlyTrends.map(m => m.count), 1);
                        const [year, m] = month.month.split('-');
                        const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        const winRate = month.count > 0 ? (month.wonCount / month.count) * 100 : 0;

                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="w-24 text-sm text-gray-600 dark:text-gray-300">{monthName}</span>
                            <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${(month.wonCount / maxCount) * 100}%` }}
                                title={`Won: ${month.wonCount}`}
                              />
                              <div
                                className="h-full bg-gray-400"
                                style={{ width: `${((month.count - month.wonCount) / maxCount) * 100}%` }}
                                title={`Other: ${month.count - month.wonCount}`}
                              />
                            </div>
                            <span className="w-20 text-sm text-gray-600 dark:text-gray-300 text-right">
                              {month.count} jobs
                            </span>
                            <span className={`w-16 text-sm font-medium text-right ${winRate >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {winRate.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">No data available</div>
                  )}
                </div>
              </div>
            )}

            {/* Win/Loss Tab */}
            {activeTab === 'winloss' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Win Rate by Price Range</h3>
                  <p className="text-sm text-gray-500 mb-6">Analyze which price points have the highest success rate</p>

                  {priceRangeAnalysis.length > 0 ? (
                    <div className="space-y-4">
                      {priceRangeAnalysis.map((range, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300">{range.label}</span>
                          <div className="flex-1">
                            <WinRateBar winRate={range.winRate} />
                          </div>
                          <div className="w-32 flex gap-4 text-sm">
                            <span className="text-green-600">{range.won} won</span>
                            <span className="text-red-600">{range.lost} lost</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">No data available</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Average Price - Won vs Lost</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Won Jobs Avg</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(overviewMetrics.avgDealSize)}
                          </span>
                        </div>
                        <div className="h-3 bg-green-500 rounded-full" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Lost Jobs Avg</span>
                          <span className="font-bold text-red-600">
                            {formatCurrency(
                              filteredSheets.filter(s => s.outcome === 'Lost').length > 0
                                ? filteredSheets.filter(s => s.outcome === 'Lost').reduce((sum, s) => sum + (s.totalPriceToClient || 0), 0) / filteredSheets.filter(s => s.outcome === 'Lost').length
                                : 0
                            )}
                          </span>
                        </div>
                        <div className="h-3 bg-red-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Insights</h3>
                    <ul className="space-y-3 text-sm">
                      {priceRangeAnalysis.length > 0 && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">&#x2713;</span>
                            <span className="text-gray-600 dark:text-gray-300">
                              Best performing range: <strong>{priceRangeAnalysis.reduce((best, current) => current.winRate > best.winRate ? current : best).label}</strong> ({priceRangeAnalysis.reduce((best, current) => current.winRate > best.winRate ? current : best).winRate.toFixed(0)}% win rate)
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">&#x2139;</span>
                            <span className="text-gray-600 dark:text-gray-300">
                              Most active range: <strong>{priceRangeAnalysis.reduce((most, current) => current.total > most.total ? current : most).label}</strong> ({priceRangeAnalysis.reduce((most, current) => current.total > most.total ? current : most).total} jobs)
                            </span>
                          </li>
                        </>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">&#x25CF;</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          Overall win rate: <strong>{overviewMetrics.winRate.toFixed(1)}%</strong>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Reps Tab */}
            {activeTab === 'salesreps' && (
              <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-brand-border-subtle">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sales Rep / Estimator Performance</h3>
                  <p className="text-sm text-gray-500 mt-1">Performance breakdown by team member</p>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-brand-surface-grey-dark">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jobs</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Won</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Win Rate</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Revenue</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Deal Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-brand-border-subtle">
                    {salesRepMetrics.map((rep, idx) => {
                      const winRate = rep.count > 0 ? (rep.wonCount / rep.count) * 100 : 0;
                      return (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-brand-surface-grey-dark">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                                  {rep.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{rep.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">{rep.count}</td>
                          <td className="px-5 py-3 text-sm text-green-600 dark:text-green-400 text-right">{rep.wonCount}</td>
                          <td className="px-5 py-3 text-sm text-right">
                            <span className={`font-medium ${winRate >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {winRate.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                            {formatCurrency(rep.revenue)}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                            {formatCurrency(rep.avgDealSize)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {salesRepMetrics.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No data available</div>
                )}
              </div>
            )}

            {/* Charts Tab */}
            {activeTab === 'charts' && (
              <div className="space-y-6">
                {/* Bubble Chart - Category Distribution */}
                <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Category Bubble Map</h3>
                  <p className="text-sm text-gray-500 mb-4">Bubble size represents revenue, opacity represents job count</p>
                  <BubbleChart
                    data={categoryMetrics.slice(0, 12).map((cat, idx) => ({
                      label: cat.name,
                      value: cat.count,
                      revenue: cat.revenue,
                      color: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
                        '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7'
                      ][idx % 12]
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Donut Chart - Outcome Distribution */}
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Job Outcomes</h3>
                    <DonutChart
                      data={[
                        { label: 'Won', value: overviewMetrics.wonCount, color: '#22c55e' },
                        { label: 'Lost', value: overviewMetrics.lostCount, color: '#ef4444' },
                        { label: 'Unknown', value: overviewMetrics.unknownCount, color: '#9ca3af' }
                      ].filter(d => d.value > 0)}
                      centerLabel="Total"
                      centerValue={overviewMetrics.totalJobs.toString()}
                    />
                  </div>

                  {/* Donut Chart - Revenue by Top Categories */}
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue by Category</h3>
                    <DonutChart
                      data={categoryMetrics.slice(0, 5).map((cat, idx) => ({
                        label: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
                        value: cat.revenue,
                        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][idx]
                      }))}
                      centerLabel="Total"
                      centerValue={formatCurrency(overviewMetrics.totalRevenue)}
                    />
                  </div>
                </div>

                {/* Scatter Plot - Price vs Size */}
                <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Price vs Size Analysis</h3>
                  <p className="text-sm text-gray-500 mb-4">Each point represents a job - X axis is price, Y axis is square footage</p>
                  <ScatterPlot
                    data={filteredSheets
                      .filter(s => s.totalPriceToClient && s.canopySqFt)
                      .slice(0, 50)
                      .map(s => ({
                        x: s.totalPriceToClient,
                        y: s.canopySqFt || 0,
                        label: s.customer || s.project || 'Unknown',
                        outcome: s.outcome
                      }))}
                  />
                </div>

                {/* Cost Breakdown Donut */}
                <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Average Cost Breakdown</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <DonutChart
                      data={(() => {
                        const wonSheets = filteredSheets.filter(s => s.outcome === 'Won');
                        const avgMaterials = wonSheets.length > 0 ? wonSheets.reduce((sum, s) => sum + (s.totalMaterials || 0), 0) / wonSheets.length : 0;
                        const avgFabric = wonSheets.length > 0 ? wonSheets.reduce((sum, s) => sum + (s.totalFabric || 0), 0) / wonSheets.length : 0;
                        const avgLabor = wonSheets.length > 0 ? wonSheets.reduce((sum, s) => sum + (s.totalLabor || 0), 0) / wonSheets.length : 0;

                        return [
                          { label: 'Materials', value: avgMaterials, color: '#3b82f6' },
                          { label: 'Fabric', value: avgFabric, color: '#10b981' },
                          { label: 'Labor', value: avgLabor, color: '#f59e0b' }
                        ].filter(d => d.value > 0);
                      })()}
                      centerLabel="Avg Cost"
                      centerValue={formatCurrency(
                        filteredSheets.filter(s => s.outcome === 'Won').length > 0
                          ? filteredSheets.filter(s => s.outcome === 'Won').reduce((sum, s) => sum + (s.subtotalBeforeMarkup || 0), 0) / filteredSheets.filter(s => s.outcome === 'Won').length
                          : 0
                      )}
                    />
                    <div className="flex flex-col justify-center space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Cost Insights</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Avg Materials</span>
                            <span className="font-medium text-blue-600">
                              {formatCurrency(
                                filteredSheets.filter(s => s.outcome === 'Won').length > 0
                                  ? filteredSheets.filter(s => s.outcome === 'Won').reduce((sum, s) => sum + (s.totalMaterials || 0), 0) / filteredSheets.filter(s => s.outcome === 'Won').length
                                  : 0
                              )}
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Avg Fabric</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(
                                filteredSheets.filter(s => s.outcome === 'Won').length > 0
                                  ? filteredSheets.filter(s => s.outcome === 'Won').reduce((sum, s) => sum + (s.totalFabric || 0), 0) / filteredSheets.filter(s => s.outcome === 'Won').length
                                  : 0
                              )}
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Avg Labor</span>
                            <span className="font-medium text-yellow-600">
                              {formatCurrency(
                                filteredSheets.filter(s => s.outcome === 'Won').length > 0
                                  ? filteredSheets.filter(s => s.outcome === 'Won').reduce((sum, s) => sum + (s.totalLabor || 0), 0) / filteredSheets.filter(s => s.outcome === 'Won').length
                                  : 0
                              )}
                            </span>
                          </li>
                          <li className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                            <span className="text-gray-600 dark:text-gray-300">Avg Markup</span>
                            <span className="font-medium text-purple-600">
                              {overviewMetrics.avgMarkup.toFixed(0)}%
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Search Projects</h3>
                  <input
                    type="text"
                    placeholder="Search by customer, project, category, or estimator..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </div>

                {searchTerm && (
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-brand-border-subtle">
                      <span className="text-sm text-gray-500">{searchResults.length} results found</span>
                    </div>
                    {searchResults.length > 0 ? (
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-brand-surface-grey-dark">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Project</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                            <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                            <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-brand-border-subtle">
                          {searchResults.map((sheet, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 dark:hover:bg-brand-surface-grey-dark cursor-pointer"
                              onClick={() => window.location.href = `/costsheet/new?edit=${sheet.id}`}
                            >
                              <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                                {new Date(sheet.inquiryDate).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3 text-sm text-gray-900 dark:text-gray-100">{sheet.customer || '-'}</td>
                              <td className="px-5 py-3 text-sm text-gray-900 dark:text-gray-100">{sheet.project || '-'}</td>
                              <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{sheet.category}</td>
                              <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                                {formatCurrency(sheet.totalPriceToClient)}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  sheet.outcome === 'Won' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  sheet.outcome === 'Lost' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                  {sheet.outcome}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-12 text-gray-500">No matching projects found</div>
                    )}
                  </div>
                )}

                {!searchTerm && (
                  <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">
                      Enter a search term to find projects, customers, or categories
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

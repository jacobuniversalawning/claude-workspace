'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculations';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

interface Analytics {
  byCategory: Array<{
    category: string;
    count: number;
    wonCount: number;
    avgPricePerSqFt: number;
    avgPricePerLinFt: number;
    wonAvgPricePerSqFt: number;
    wonAvgPricePerLinFt: number;
  }>;
  totalSheets: number;
}

export default function QuickCalcPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculator state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [width, setWidth] = useState<number>(0);
  const [projection, setProjection] = useState<number>(0);
  const [linearFeet, setLinearFeet] = useState<number>(0);
  const [calcMode, setCalcMode] = useState<'sqft' | 'linft'>('sqft');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
      if (data.byCategory?.length > 0) {
        setSelectedCategory(data.byCategory[0].category);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate estimated price
  const squareFeet = width * projection;
  const selectedCategoryData = analytics?.byCategory.find(c => c.category === selectedCategory);
  const avgSqFtPrice = selectedCategoryData?.wonAvgPricePerSqFt || 0;
  const avgLinFtPrice = selectedCategoryData?.wonAvgPricePerLinFt || 0;

  const estimatedPriceSqFt = squareFeet * avgSqFtPrice;
  const estimatedPriceLinFt = linearFeet * avgLinFtPrice;
  const estimatedPrice = calcMode === 'sqft' ? estimatedPriceSqFt : estimatedPriceLinFt;

  // Price ranges (+-15%)
  const lowEstimate = estimatedPrice * 0.85;
  const highEstimate = estimatedPrice * 1.15;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-[#666666] hover:text-[#EDEDED] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">
                  Quick Calculator
                </h1>
                <p className="text-sm text-[#666666] mt-0.5">Budget pricing based on historical data</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Calculator */}
        <section className="mb-10">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#EDEDED] tracking-tight mb-6">Budget Price Calculator</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Product Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#111111] border border-[#333333] rounded px-4 py-3 text-[#EDEDED] focus:outline-none focus:border-[#0070F3] focus:ring-1 focus:ring-[#0070F3]/20 transition-all duration-150"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Calculation Mode */}
                <div>
                  <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Calculate By</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCalcMode('sqft')}
                      className={`flex-1 px-4 py-2.5 rounded text-sm font-medium transition-all duration-150 ${
                        calcMode === 'sqft'
                          ? 'bg-[#0070F3] text-white'
                          : 'bg-[#111111] text-[#A1A1A1] border border-[#333333] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      Square Feet
                    </button>
                    <button
                      onClick={() => setCalcMode('linft')}
                      className={`flex-1 px-4 py-2.5 rounded text-sm font-medium transition-all duration-150 ${
                        calcMode === 'linft'
                          ? 'bg-[#0070F3] text-white'
                          : 'bg-[#111111] text-[#A1A1A1] border border-[#333333] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      Linear Feet
                    </button>
                  </div>
                </div>

                {/* Dimensions Input */}
                {calcMode === 'sqft' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Width (ft)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={width || ''}
                        onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-[#111111] border border-[#333333] rounded px-4 py-3 text-[#EDEDED] placeholder-[#666666] focus:outline-none focus:border-[#0070F3] focus:ring-1 focus:ring-[#0070F3]/20 transition-all duration-150"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Projection (ft)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={projection || ''}
                        onChange={(e) => setProjection(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-[#111111] border border-[#333333] rounded px-4 py-3 text-[#EDEDED] placeholder-[#666666] focus:outline-none focus:border-[#0070F3] focus:ring-1 focus:ring-[#0070F3]/20 transition-all duration-150"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Linear Feet</label>
                    <input
                      type="number"
                      step="0.1"
                      value={linearFeet || ''}
                      onChange={(e) => setLinearFeet(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-[#111111] border border-[#333333] rounded px-4 py-3 text-[#EDEDED] placeholder-[#666666] focus:outline-none focus:border-[#0070F3] focus:ring-1 focus:ring-[#0070F3]/20 transition-all duration-150"
                    />
                  </div>
                )}

                {/* Quick Size Buttons */}
                {calcMode === 'sqft' && (
                  <div>
                    <label className="block text-sm font-medium text-[#A1A1A1] mb-2">Quick Sizes</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { w: 10, p: 10, label: '10×10' },
                        { w: 12, p: 12, label: '12×12' },
                        { w: 15, p: 12, label: '15×12' },
                        { w: 20, p: 10, label: '20×10' },
                        { w: 20, p: 15, label: '20×15' },
                        { w: 30, p: 15, label: '30×15' },
                      ].map((size) => (
                        <button
                          key={size.label}
                          onClick={() => { setWidth(size.w); setProjection(size.p); }}
                          className="px-3 py-1.5 text-xs font-medium bg-[#111111] text-[#A1A1A1] border border-[#333333] rounded hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-all duration-150"
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Result Section */}
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-6">
                <h3 className="text-sm font-medium text-[#666666] uppercase tracking-wider mb-4">Estimated Budget Price</h3>

                {/* Category Info */}
                <div className="mb-6 pb-6 border-b border-[#1F1F1F]">
                  <div className="text-sm text-[#A1A1A1] mb-1">{selectedCategory}</div>
                  <div className="flex gap-6 text-xs text-[#666666]">
                    {avgSqFtPrice > 0 && (
                      <span>Avg: {formatCurrency(avgSqFtPrice)}/sq ft</span>
                    )}
                    {avgLinFtPrice > 0 && (
                      <span>Avg: {formatCurrency(avgLinFtPrice)}/lin ft</span>
                    )}
                    {selectedCategoryData && (
                      <span>{selectedCategoryData.wonCount} won jobs</span>
                    )}
                  </div>
                </div>

                {/* Size Display */}
                <div className="mb-6">
                  <div className="text-sm text-[#666666] mb-1">Size</div>
                  <div className="text-lg text-[#EDEDED]">
                    {calcMode === 'sqft' ? (
                      <>
                        {width} × {projection} ft = <span className="font-semibold">{squareFeet.toFixed(1)} sq ft</span>
                      </>
                    ) : (
                      <span className="font-semibold">{linearFeet} linear ft</span>
                    )}
                  </div>
                </div>

                {/* Price Estimate */}
                {estimatedPrice > 0 ? (
                  <>
                    <div className="mb-4">
                      <div className="text-sm text-[#666666] mb-2">Budget Range</div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm text-[#A1A1A1]">{formatCurrency(lowEstimate)}</span>
                        <span className="text-3xl font-bold text-[#0070F3]">{formatCurrency(estimatedPrice)}</span>
                        <span className="text-sm text-[#A1A1A1]">{formatCurrency(highEstimate)}</span>
                      </div>
                      <div className="text-xs text-[#666666] mt-1">Based on won jobs average ±15%</div>
                    </div>

                    {/* Visual Range */}
                    <div className="h-2 bg-[#1F1F1F] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#0070F3]/50 via-[#0070F3] to-[#0070F3]/50 w-full" />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-[#666666]">
                    <svg className="w-12 h-12 mx-auto mb-3 text-[#333333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p>Enter dimensions to see estimate</p>
                    {(calcMode === 'sqft' && avgSqFtPrice === 0) || (calcMode === 'linft' && avgLinFtPrice === 0) ? (
                      <p className="text-xs mt-2 text-[#A1A1A1]">No pricing data for this category</p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Average Pricing by Product Cards */}
        <section>
          <h2 className="text-lg font-semibold text-[#EDEDED] tracking-tight mb-4">Average Pricing by Product</h2>
          {analytics && analytics.byCategory && analytics.byCategory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.byCategory.map((cat, index) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`group text-left bg-[#0A0A0A] border rounded-lg p-5 hover:bg-[#111111] transition-all duration-200 animate-fade-in-up ${
                    selectedCategory === cat.category
                      ? 'border-[#0070F3] ring-1 ring-[#0070F3]/20'
                      : 'border-[#1F1F1F] hover:border-[#333333]'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <h3 className="font-medium text-[#EDEDED] text-sm tracking-tight">{cat.category}</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#666666]">Total Sheets</span>
                      <span className="text-[#EDEDED] font-medium tabular-nums">{cat.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666666]">Won</span>
                      <span className="text-emerald-400 font-medium tabular-nums">{cat.wonCount}</span>
                    </div>
                    {cat.wonAvgPricePerSqFt > 0 && (
                      <div className="flex justify-between pt-2 mt-2 border-t border-[#1F1F1F]">
                        <span className="text-[#666666]">Avg $/sq ft</span>
                        <span className="text-[#0070F3] font-semibold tabular-nums">
                          {formatCurrency(cat.wonAvgPricePerSqFt)}
                        </span>
                      </div>
                    )}
                    {cat.wonAvgPricePerLinFt > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Avg $/lin ft</span>
                        <span className="text-[#0070F3] font-semibold tabular-nums">
                          {formatCurrency(cat.wonAvgPricePerLinFt)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-12 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-[#333333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[#666666]">No pricing data available yet. Create some cost sheets to see averages.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

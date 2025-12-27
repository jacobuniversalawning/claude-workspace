'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/calculations';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

interface CostSheet {
  id: string;
  category: string;
  customer?: string;
  project?: string;
  inquiryDate: string;
  totalPriceToClient: number;
  pricePerSqFtPreDelivery?: number;
  pricePerLinFtPreDelivery?: number;
  outcome: string;
  createdAt: string;
  estimator?: string;
}

// Helper function to get price guardrail color
const getPriceColor = (currentPrice: number | undefined, avgPrice: number): string => {
  if (!currentPrice || avgPrice === 0) return 'text-gray-500 dark:text-gray-400';
  const diff = (currentPrice - avgPrice) / avgPrice;
  if (diff > 0.15) return 'text-red-600 dark:text-red-400 font-semibold';
  if (diff < -0.15) return 'text-blue-600 dark:text-blue-400 font-semibold';
  return 'text-green-600 dark:text-green-400 font-semibold';
};

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

export default function Home() {
  const router = useRouter();
  const [costSheets, setCostSheets] = useState<CostSheet[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storageType, setStorageType] = useState<'database' | 'local' | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCostSheets();
    fetchAnalytics();
  }, []);

  const fetchCostSheets = async () => {
    try {
      const response = await fetch('/api/costsheets');
      const data = await response.json();

      // Check if database returned data
      if (Array.isArray(data) && data.length > 0) {
        setCostSheets(data);
        setStorageType('database');
      } else {
        // Fallback to localStorage
        const localData = localStorage.getItem('costSheets');
        if (localData) {
          const parsedData = JSON.parse(localData);
          setCostSheets(parsedData);
          setStorageType('local');
        } else {
          setCostSheets([]);
          setStorageType(null);
        }
      }
    } catch (error) {
      console.error('Error fetching cost sheets:', error);
      // Fallback to localStorage
      try {
        const localData = localStorage.getItem('costSheets');
        if (localData) {
          setCostSheets(JSON.parse(localData));
          setStorageType('local');
        }
      } catch {
        console.error('LocalStorage error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Calculate local averages by category for price guardrails
  const getLocalAverages = (category: string) => {
    const categorySheets = costSheets.filter(s => s.category === category && s.outcome === 'Won');
    if (categorySheets.length === 0) {
      // If no won sheets, use all sheets for that category
      const allCategorySheets = costSheets.filter(s => s.category === category);
      if (allCategorySheets.length === 0) return { avgSqFt: 0, avgLinFt: 0 };

      const sqFtPrices = allCategorySheets.filter(s => s.pricePerSqFtPreDelivery).map(s => s.pricePerSqFtPreDelivery!);
      const linFtPrices = allCategorySheets.filter(s => s.pricePerLinFtPreDelivery).map(s => s.pricePerLinFtPreDelivery!);

      return {
        avgSqFt: sqFtPrices.length > 0 ? sqFtPrices.reduce((a, b) => a + b, 0) / sqFtPrices.length : 0,
        avgLinFt: linFtPrices.length > 0 ? linFtPrices.reduce((a, b) => a + b, 0) / linFtPrices.length : 0,
      };
    }

    const sqFtPrices = categorySheets.filter(s => s.pricePerSqFtPreDelivery).map(s => s.pricePerSqFtPreDelivery!);
    const linFtPrices = categorySheets.filter(s => s.pricePerLinFtPreDelivery).map(s => s.pricePerLinFtPreDelivery!);

    return {
      avgSqFt: sqFtPrices.length > 0 ? sqFtPrices.reduce((a, b) => a + b, 0) / sqFtPrices.length : 0,
      avgLinFt: linFtPrices.length > 0 ? linFtPrices.reduce((a, b) => a + b, 0) / linFtPrices.length : 0,
    };
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const toggleOutcome = (outcome: string) => {
    setSelectedOutcomes(prev =>
      prev.includes(outcome)
        ? prev.filter(o => o !== outcome)
        : [...prev, outcome]
    );
  };

  const filteredAndSortedCostSheets = costSheets
    .filter((sheet) => {
      const matchesSearch =
        !searchTerm ||
        sheet.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sheet.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sheet.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(sheet.category);
      const matchesOutcome = selectedOutcomes.length === 0 || selectedOutcomes.includes(sheet.outcome || 'Unknown');

      return matchesSearch && matchesCategory && matchesOutcome;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.inquiryDate).getTime() - new Date(b.inquiryDate).getTime();
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'customer':
          comparison = (a.customer || '').localeCompare(b.customer || '');
          break;
        case 'project':
          comparison = (a.project || '').localeCompare(b.project || '');
          break;
        case 'estimator':
          comparison = (a.estimator || '').localeCompare(b.estimator || '');
          break;
        case 'total':
          comparison = a.totalPriceToClient - b.totalPriceToClient;
          break;
        case 'sqft':
          comparison = (a.pricePerSqFtPreDelivery || 0) - (b.pricePerSqFtPreDelivery || 0);
          break;
        case 'linft':
          comparison = (a.pricePerLinFtPreDelivery || 0) - (b.pricePerLinFtPreDelivery || 0);
          break;
        case 'outcome':
          comparison = (a.outcome || 'Unknown').localeCompare(b.outcome || 'Unknown');
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearCategoryFilter = () => {
    setSelectedCategories([]);
  };

  const updateOutcome = async (id: string, outcome: string) => {
    // Update in localStorage if using local storage
    if (storageType === 'local') {
      const updatedSheets = costSheets.map((s) =>
        s.id === id ? { ...s, outcome } : s
      );
      setCostSheets(updatedSheets);
      localStorage.setItem('costSheets', JSON.stringify(updatedSheets));
      return;
    }

    // Otherwise try database
    try {
      const sheet = costSheets.find((s) => s.id === id);
      if (!sheet) return;

      await fetch(`/api/costsheets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sheet, outcome }),
      });

      fetchCostSheets();
      fetchAnalytics();
    } catch (error) {
      console.error('Error updating outcome:', error);
    }
  };

  const confirmDelete = (id: string) => {
    if (storageType === 'local') {
      const updatedSheets = costSheets.filter((s) => s.id !== id);
      setCostSheets(updatedSheets);
      localStorage.setItem('costSheets', JSON.stringify(updatedSheets));
    }
    setDeleteModalId(null);
  };

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.tagName === 'OPTION') {
      return;
    }
    router.push(`/costsheet/new?edit=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-brand-surface-black rounded-modal p-6 max-w-sm mx-4 shadow-xl border border-gray-200 dark:border-brand-border-subtle animate-scale-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary mb-4">Delete Cost Sheet?</h3>
            <p className="text-gray-600 dark:text-brand-text-secondary mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalId(null)}
                className="px-6 py-2.5 text-gray-700 dark:text-brand-text-primary bg-gray-100 dark:bg-brand-surface-grey-light hover:bg-gray-200 dark:hover:brightness-110 rounded-button font-medium transition-all duration-200 hover:shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteModalId)}
                className="px-6 py-2.5 bg-red-600 text-white rounded-button hover:bg-red-700 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-brand-surface-black border-b border-gray-200 dark:border-brand-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-h1 text-gray-900 dark:text-brand-text-primary">
                Universal Awning & Canopy
              </h1>
              <p className="text-h2 text-gray-600 dark:text-brand-text-secondary mt-1.5">Cost Sheet Calculator</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/analytics"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-brand-border-subtle rounded-button hover:bg-gray-50 dark:hover:bg-brand-surface-grey-light transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-brand-border-subtle rounded-button hover:bg-gray-50 dark:hover:bg-brand-surface-grey-light transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </Link>
              <Link
                href="/costsheet/new"
                className="bg-blue-600 dark:bg-brand-google-blue text-white px-6 py-2.5 rounded-button hover:bg-blue-700 dark:hover:bg-brand-google-blue-hover font-medium transition-all duration-200 hover:shadow-lg"
              >
                + New Cost Sheet
              </Link>
            </div>
          </div>
        </div>
      </header>

      {storageType === 'local' && (
        <div className="max-w-7xl mx-auto px-6 pt-5">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-card p-3.5 text-yellow-800 dark:text-yellow-200 text-sm">
            Data is stored locally in your browser. To enable cloud storage, configure a PostgreSQL database.
          </div>
        </div>
      )}

      {analytics && analytics.byCategory && analytics.byCategory.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h2 className="text-h2 mb-4 text-gray-900 dark:text-brand-text-primary">Average Pricing by Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.byCategory.slice(0, 6).map((cat) => (
              <div key={cat.category} className="bg-white dark:bg-brand-surface-black p-5 rounded-card border border-gray-200 dark:border-brand-border-subtle hover-lift hover:border-brand-border-subtle dark:hover:border-brand-text-muted transition-all duration-300">
                <h3 className="font-medium text-gray-900 dark:text-brand-text-primary">{cat.category}</h3>
                <div className="mt-2 text-sm text-gray-600 dark:text-brand-text-secondary">
                  <div className="flex justify-between">
                    <span>Total Sheets:</span>
                    <span className="font-medium text-gray-900 dark:text-brand-text-primary">{cat.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Won:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{cat.wonCount}</span>
                  </div>
                  {cat.wonAvgPricePerSqFt > 0 && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 dark:border-brand-border-subtle">
                      <span>Avg $/sq ft (Weighted):</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(cat.wonAvgPricePerSqFt)}
                      </span>
                    </div>
                  )}
                  {cat.wonAvgPricePerLinFt > 0 && (
                    <div className="flex justify-between">
                      <span>Avg $/lin ft (Weighted):</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(cat.wonAvgPricePerLinFt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        <h2 className="text-h2 mb-4 text-gray-900 dark:text-brand-text-primary">Cost Sheet History</h2>

        <div className="bg-white dark:bg-brand-surface-black p-5 rounded-card border border-gray-200 dark:border-brand-border-subtle mb-3 transition-all duration-300">
          <div className="flex flex-wrap gap-3 items-center mb-3">
            <input
              type="text"
              placeholder="Search customer, project, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 dark:border-transparent rounded-input px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-brand-mint bg-white dark:bg-brand-surface-grey-dark text-gray-900 dark:text-brand-text-primary placeholder-gray-400 dark:placeholder-brand-text-muted transition-all duration-200"
            />
            <div className="relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm border rounded-button transition-all duration-200 font-medium hover:shadow-lg ${
                  selectedCategories.length > 0
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 shadow-blue-500/10'
                    : 'bg-white dark:bg-brand-surface-grey-light border-gray-300 dark:border-brand-border-subtle text-gray-700 dark:text-brand-text-primary hover:brightness-110'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
                {selectedCategories.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
              </button>
              {showCategoryFilter && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-brand-surface-black border border-gray-300 dark:border-brand-border-subtle rounded-input shadow-lg z-50 max-h-80 overflow-y-auto animate-slide-in">
                  <div className="p-2 border-b border-gray-200 dark:border-brand-border-subtle flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-brand-text-primary">Categories</span>
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={clearCategoryFilter}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="p-2">
                    {PRODUCT_CATEGORIES.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Outcome Filter Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Filter by Outcome:</span>
            <button
              onClick={() => toggleOutcome('Won')}
              className={`px-3 py-1.5 text-xs font-medium rounded-button transition-all duration-200 ${
                selectedOutcomes.includes('Won')
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50'
              }`}
            >
              Won
            </button>
            <button
              onClick={() => toggleOutcome('Lost')}
              className={`px-3 py-1.5 text-xs font-medium rounded-button transition-all duration-200 ${
                selectedOutcomes.includes('Lost')
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50'
              }`}
            >
              Lost
            </button>
            <button
              onClick={() => toggleOutcome('Unknown')}
              className={`px-3 py-1.5 text-xs font-medium rounded-button transition-all duration-200 ${
                selectedOutcomes.includes('Unknown')
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Unknown
            </button>
            {selectedOutcomes.length > 0 && (
              <button
                onClick={() => setSelectedOutcomes([])}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-2"
              >
                Clear
              </button>
            )}
          </div>

          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-brand-border-subtle">
              {selectedCategories.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-button font-medium"
                >
                  {cat}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="hover:text-blue-900 dark:hover:text-blue-100 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-brand-border-subtle">
            <thead className="bg-gray-50 dark:bg-brand-surface-grey-dark">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">
                    Date
                    <svg className={`w-4 h-4 ${sortBy === 'date' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'date' && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    Category
                    <svg className={`w-4 h-4 ${sortBy === 'category' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'category' && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('customer')}>
                  <div className="flex items-center gap-1">
                    Customer
                    <svg className={`w-4 h-4 ${sortBy === 'customer' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'customer' && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" style={{ minWidth: '150px' }} onClick={() => handleSort('project')}>
                  <div className="flex items-center gap-1">
                    Project
                    <svg className={`w-4 h-4 ${sortBy === 'project' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'project' && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('estimator')}>
                  <div className="flex items-center gap-1">
                    Estimator
                    <svg className={`w-4 h-4 ${sortBy === 'estimator' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'estimator' && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('total')}>
                  <div className="flex items-center gap-1">
                    Total
                    <svg className={`w-4 h-4 ${sortBy === 'total' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'total' && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('sqft')}>
                  <div className="flex items-center gap-1">
                    $/sq ft
                    <svg className={`w-4 h-4 ${sortBy === 'sqft' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'sqft' && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('linft')}>
                  <div className="flex items-center gap-1">
                    $/lin ft
                    <svg className={`w-4 h-4 ${sortBy === 'linft' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'linft' && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('outcome')}>
                  <div className="flex items-center gap-1">
                    Outcome
                    <svg className={`w-4 h-4 ${sortBy === 'outcome' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'outcome' && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-3 py-3.5 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-brand-surface-black divide-y divide-gray-200 dark:divide-brand-border-subtle">
              {filteredAndSortedCostSheets.map((sheet) => {
                // Use analytics if available, otherwise calculate local averages
                const categoryStats = analytics?.byCategory.find(c => c.category === sheet.category);
                const localAvgs = getLocalAverages(sheet.category);
                const avgSqFt = categoryStats?.wonAvgPricePerSqFt || localAvgs.avgSqFt;
                const avgLinFt = categoryStats?.wonAvgPricePerLinFt || localAvgs.avgLinFt;

                return (
                  <tr
                    key={sheet.id}
                    className="hover:bg-gray-50 dark:hover:bg-brand-surface-grey-dark cursor-pointer transition-all duration-200"
                    onClick={(e) => handleRowClick(sheet.id, e)}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(sheet.inquiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-white">
                      <span className="block max-w-[120px] truncate" title={sheet.category || '-'}>{sheet.category || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-white">
                      <span className="block max-w-[100px] truncate" title={sheet.customer || '-'}>{sheet.customer || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-white">
                      <span className="block max-w-[150px] truncate" title={sheet.project || '-'}>{sheet.project || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-white">
                      <span className="block max-w-[80px] truncate" title={sheet.estimator || '-'}>{sheet.estimator || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      {formatCurrency(sheet.totalPriceToClient)}
                    </td>
                    <td className={`px-5 py-3.5 whitespace-nowrap text-sm ${getPriceColor(sheet.pricePerSqFtPreDelivery, avgSqFt)}`}>
                      {sheet.pricePerSqFtPreDelivery ? formatCurrency(sheet.pricePerSqFtPreDelivery) : '-'}
                    </td>
                    <td className={`px-5 py-3.5 whitespace-nowrap text-sm ${getPriceColor(sheet.pricePerLinFtPreDelivery, avgLinFt)}`}>
                      {sheet.pricePerLinFtPreDelivery ? formatCurrency(sheet.pricePerLinFtPreDelivery) : '-'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                      <select
                        value={sheet.outcome || 'Unknown'}
                        onChange={(e) => updateOutcome(sheet.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded-button px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                          sheet.outcome === 'Won'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : sheet.outcome === 'Lost'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <option value="Unknown">Unknown</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModalId(sheet.id);
                        }}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAndSortedCostSheets.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              No cost sheets found. Create your first one!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/calculations';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { DarkModeToggle } from '@/components/DarkModeToggle';

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
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storageType, setStorageType] = useState<'database' | 'local' | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

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

  const filteredCostSheets = costSheets.filter((sheet) => {
    const matchesSearch =
      !searchTerm ||
      sheet.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(sheet.category);

    return matchesSearch && matchesCategory;
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Cost Sheet?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalId(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteModalId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Universal Awning & Canopy
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Cost Sheet Calculator</p>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <Link
                href="/costsheet/new"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                + New Cost Sheet
              </Link>
            </div>
          </div>
        </div>
      </header>

      {storageType === 'local' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-yellow-800 dark:text-yellow-200 text-sm">
            Data is stored locally in your browser. To enable cloud storage, configure a PostgreSQL database.
          </div>
        </div>
      )}

      {analytics && analytics.byCategory && analytics.byCategory.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Average Pricing by Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.byCategory.slice(0, 6).map((cat) => (
              <div key={cat.category} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900 dark:text-white">{cat.category}</h3>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Total Sheets:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{cat.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Won:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{cat.wonCount}</span>
                  </div>
                  {cat.wonAvgPricePerSqFt > 0 && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Cost Sheet History</h2>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Search customer, project, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  selectedCategories.length > 0
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
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
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories</span>
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
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedCategories.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded"
                >
                  {cat}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase" style={{ minWidth: '150px' }}>Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estimator</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">$/sq ft</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">$/lin ft</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Outcome</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCostSheets.map((sheet) => {
                // Use analytics if available, otherwise calculate local averages
                const categoryStats = analytics?.byCategory.find(c => c.category === sheet.category);
                const localAvgs = getLocalAverages(sheet.category);
                const avgSqFt = categoryStats?.wonAvgPricePerSqFt || localAvgs.avgSqFt;
                const avgLinFt = categoryStats?.wonAvgPricePerLinFt || localAvgs.avgLinFt;

                return (
                  <tr
                    key={sheet.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={(e) => handleRowClick(sheet.id, e)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(sheet.inquiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      <span className="block max-w-[120px] truncate" title={sheet.category || '-'}>{sheet.category || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      <span className="block max-w-[100px] truncate" title={sheet.customer || '-'}>{sheet.customer || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      <span className="block max-w-[150px] truncate" title={sheet.project || '-'}>{sheet.project || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      <span className="block max-w-[80px] truncate" title={sheet.estimator || '-'}>{sheet.estimator || '-'}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(sheet.totalPriceToClient)}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm ${getPriceColor(sheet.pricePerSqFtPreDelivery, avgSqFt)}`}>
                      {sheet.pricePerSqFtPreDelivery ? formatCurrency(sheet.pricePerSqFtPreDelivery) : '-'}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm ${getPriceColor(sheet.pricePerLinFtPreDelivery, avgLinFt)}`}>
                      {sheet.pricePerLinFtPreDelivery ? formatCurrency(sheet.pricePerLinFtPreDelivery) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <select
                        value={sheet.outcome || 'Unknown'}
                        onChange={(e) => updateOutcome(sheet.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded px-2 py-1 text-xs font-medium ${
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
                    <td className="px-2 py-4 text-center">
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
          {filteredCostSheets.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No cost sheets found. Create your first one!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

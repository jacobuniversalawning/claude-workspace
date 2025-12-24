'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculations';
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
}

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
  const [costSheets, setCostSheets] = useState<CostSheet[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [storageType, setStorageType] = useState<'database' | 'local' | null>(null);

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

  const filteredCostSheets = costSheets.filter((sheet) => {
    const matchesSearch =
      !searchTerm ||
      sheet.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !filterCategory || sheet.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

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

  const deleteSheet = (id: string) => {
    if (!confirm('Are you sure you want to delete this cost sheet?')) return;

    if (storageType === 'local') {
      const updatedSheets = costSheets.filter((s) => s.id !== id);
      setCostSheets(updatedSheets);
      localStorage.setItem('costSheets', JSON.stringify(updatedSheets));
    }
  };

  // Get unique categories from local data for filter
  const localCategories = [...new Set(costSheets.map((s) => s.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search customer, project, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {(analytics?.byCategory || localCategories.map(c => ({ category: c }))).map((cat) => (
                <option key={typeof cat === 'string' ? cat : cat.category} value={typeof cat === 'string' ? cat : cat.category}>
                  {typeof cat === 'string' ? cat : cat.category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">$/sq ft</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Outcome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCostSheets.map((sheet) => (
                <tr key={sheet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(sheet.inquiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{sheet.category || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{sheet.customer || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{sheet.project || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(sheet.totalPriceToClient)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {sheet.pricePerSqFtPreDelivery ? formatCurrency(sheet.pricePerSqFtPreDelivery) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={sheet.outcome || 'Unknown'}
                      onChange={(e) => updateOutcome(sheet.id, e.target.value)}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {storageType === 'local' ? (
                      <button
                        onClick={() => deleteSheet(sheet.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    ) : (
                      <Link href={`/costsheet/${sheet.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                        View/Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
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

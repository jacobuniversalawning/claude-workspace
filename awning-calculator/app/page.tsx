'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculations';

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

  useEffect(() => {
    fetchCostSheets();
    fetchAnalytics();
  }, []);

  const fetchCostSheets = async () => {
    try {
      const response = await fetch('/api/costsheets');
      const data = await response.json();
      setCostSheets(data);
    } catch (error) {
      console.error('Error fetching cost sheets:', error);
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
      sheet.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !filterCategory || sheet.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const updateOutcome = async (id: string, outcome: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Universal Awning & Canopy
              </h1>
              <p className="text-gray-600 mt-1">Cost Sheet Calculator</p>
            </div>
            <Link
              href="/costsheet/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              + New Cost Sheet
            </Link>
          </div>
        </div>
      </header>

      {analytics && analytics.byCategory.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-semibold mb-4">Average Pricing by Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.byCategory.slice(0, 6).map((cat) => (
              <div key={cat.category} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900">{cat.category}</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Sheets:</span>
                    <span className="font-medium">{cat.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Won:</span>
                    <span className="font-medium text-green-600">{cat.wonCount}</span>
                  </div>
                  {cat.wonAvgPricePerSqFt > 0 && (
                    <div className="flex justify-between mt-2 pt-2 border-t">
                      <span>Avg $/sq ft (Weighted):</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(cat.wonAvgPricePerSqFt)}
                      </span>
                    </div>
                  )}
                  {cat.wonAvgPricePerLinFt > 0 && (
                    <div className="flex justify-between">
                      <span>Avg $/lin ft (Weighted):</span>
                      <span className="font-bold text-blue-600">
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
        <h2 className="text-xl font-semibold mb-4">Cost Sheet History</h2>

        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search customer, project, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {analytics?.byCategory.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">$/sq ft</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCostSheets.map((sheet) => (
                <tr key={sheet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sheet.inquiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sheet.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sheet.customer || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sheet.project || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(sheet.totalPriceToClient)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sheet.pricePerSqFtPreDelivery ? formatCurrency(sheet.pricePerSqFtPreDelivery) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={sheet.outcome}
                      onChange={(e) => updateOutcome(sheet.id, e.target.value)}
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        sheet.outcome === 'Won'
                          ? 'bg-green-100 text-green-800'
                          : sheet.outcome === 'Lost'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="Unknown">Unknown</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link href={`/costsheet/${sheet.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      View/Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCostSheets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No cost sheets found. Create your first one!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

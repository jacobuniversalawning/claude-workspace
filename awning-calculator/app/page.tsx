'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
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
  if (!currentPrice || avgPrice === 0) return 'text-[#666666]';
  const diff = (currentPrice - avgPrice) / avgPrice;
  if (diff > 0.15) return 'text-red-400 font-semibold';
  if (diff < -0.15) return 'text-blue-400 font-semibold';
  return 'text-emerald-400 font-semibold';
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

// Helper to check user roles
const isViewer = (role: string | undefined) => role === 'VIEWER';
const canDelete = (role: string | undefined) => {
  // VIEWER and pending users cannot delete
  return role && role !== 'VIEWER' && role !== 'pending';
};
const canCreate = (role: string | undefined) => {
  // Only SALES_REP, ESTIMATOR, ADMIN, SUPER_ADMIN can create
  return role && ['SALES_REP', 'ESTIMATOR', 'ADMIN', 'SUPER_ADMIN'].includes(role);
};

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
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

      if (Array.isArray(data) && data.length > 0) {
        setCostSheets(data);
        setStorageType('database');
      } else {
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

  const getLocalAverages = (category: string) => {
    const categorySheets = costSheets.filter(s => s.category === category && s.outcome === 'Won');
    if (categorySheets.length === 0) {
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
    if (storageType === 'local') {
      const updatedSheets = costSheets.map((s) =>
        s.id === id ? { ...s, outcome } : s
      );
      setCostSheets(updatedSheets);
      localStorage.setItem('costSheets', JSON.stringify(updatedSheets));
      return;
    }

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

  const confirmDelete = async (id: string) => {
    if (storageType === 'local') {
      const updatedSheets = costSheets.filter((s) => s.id !== id);
      setCostSheets(updatedSheets);
      localStorage.setItem('costSheets', JSON.stringify(updatedSheets));
    } else {
      // Call API for soft delete (moves to trash)
      try {
        const response = await fetch(`/api/costsheets/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          // Optimistically remove from the list
          setCostSheets(costSheets.filter((s) => s.id !== id));
        } else {
          const error = await response.json();
          console.error('Failed to delete cost sheet:', error.error);
        }
      } catch (error) {
        console.error('Error deleting cost sheet:', error);
      }
    }
    setDeleteModalId(null);
  };

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.tagName === 'OPTION') {
      return;
    }
    // VIEWER and pending users go to view page (read-only)
    // Other roles go to edit page
    if (isViewer(userRole) || userRole === 'pending') {
      router.push(`/costsheet/view?id=${id}`);
    } else {
      router.push(`/costsheet/new?edit=${id}`);
    }
  };

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
      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[#0A0A0A] rounded-xl p-6 max-w-sm mx-4 border border-[#333333] animate-scale-in">
            <h3 className="text-lg font-semibold text-[#EDEDED] tracking-tight mb-3">Delete Cost Sheet?</h3>
            <p className="text-[#A1A1A1] text-sm mb-6">This cost sheet will be moved to the recycle bin.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalId(null)}
                className="px-4 py-2 text-[#A1A1A1] bg-[#111111] border border-[#333333] rounded text-sm font-medium hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteModalId)}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-sm font-medium hover:bg-red-500/20 transition-all duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight">
                Universal Awning & Canopy
              </h1>
              <p className="text-sm text-[#666666] mt-0.5">Cost Sheet Calculator</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/quickcalc"
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#A1A1A1] border border-[#333333] rounded hover:bg-[#111111] hover:text-[#EDEDED] hover:border-[#444444] transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Quick Calc
              </Link>
              <Link
                href="/analytics"
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#A1A1A1] border border-[#333333] rounded hover:bg-[#111111] hover:text-[#EDEDED] hover:border-[#444444] transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#A1A1A1] border border-[#333333] rounded hover:bg-[#111111] hover:text-[#EDEDED] hover:border-[#444444] transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </Link>
              {/* New Cost Sheet button - only visible to users who can create */}
              {canCreate(userRole) && (
                <Link
                  href="/costsheet/new"
                  className="flex items-center gap-2 px-5 py-2 bg-white text-black rounded text-sm font-medium hover:bg-[#E5E5E5] transition-all duration-150"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Cost Sheet
                </Link>
              )}

              {/* User Menu */}
              {session?.user && (
                <div className="flex items-center gap-3 ml-3 pl-3 border-l border-[#333333]">
                  <div className="flex items-center gap-2">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-8 h-8 rounded-full ring-1 ring-[#333333]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#333333] flex items-center justify-center">
                        <span className="text-[#EDEDED] font-medium text-sm">
                          {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-[#A1A1A1] hidden sm:inline">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="p-2 text-[#666666] hover:text-[#EDEDED] hover:bg-[#111111] rounded-full transition-all duration-150"
                    title="Sign out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {storageType === 'local' && (
          <div className="mb-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-200 text-sm">
              <span className="font-medium">Local Storage Mode:</span> Data is stored locally in your browser. Configure PostgreSQL for cloud storage.
            </div>
          </div>
        )}

        {/* Cost Sheet History */}
        <section>
          <h2 className="text-lg font-semibold text-[#EDEDED] tracking-tight mb-4">Cost Sheet History</h2>

          {/* Filters */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 mb-4">
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search customer, project, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-2.5 text-sm text-[#EDEDED] placeholder-[#666666] focus:outline-none focus:border-[#0070F3] focus:ring-1 focus:ring-[#0070F3]/20 transition-all duration-150"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm border rounded-lg transition-all duration-150 font-medium ${
                    selectedCategories.length > 0
                      ? 'bg-[#0070F3]/10 border-[#0070F3]/30 text-[#0070F3]'
                      : 'bg-[#111111] border-[#333333] text-[#A1A1A1] hover:bg-[#1A1A1A] hover:text-[#EDEDED]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                  {selectedCategories.length > 0 && (
                    <span className="bg-[#0070F3] text-white text-xs px-1.5 py-0.5 rounded-full">
                      {selectedCategories.length}
                    </span>
                  )}
                </button>
                {showCategoryFilter && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0A0A0A] border border-[#333333] rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto animate-fade-in">
                    <div className="p-3 border-b border-[#1F1F1F] flex justify-between items-center">
                      <span className="text-sm font-medium text-[#EDEDED]">Categories</span>
                      {selectedCategories.length > 0 && (
                        <button
                          onClick={clearCategoryFilter}
                          className="text-xs text-[#0070F3] hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="p-2">
                      {PRODUCT_CATEGORIES.map((category) => (
                        <label
                          key={category}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-[#111111] rounded-lg cursor-pointer transition-colors duration-150"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="w-4 h-4 rounded border-[#333333] bg-[#111111] text-[#0070F3] focus:ring-[#0070F3]/20 focus:ring-offset-0"
                          />
                          <span className="text-sm text-[#A1A1A1]">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Outcome Filter Buttons */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-[#666666] font-medium">Outcome:</span>
              <button
                onClick={() => toggleOutcome('Won')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                  selectedOutcomes.includes('Won')
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                Won
              </button>
              <button
                onClick={() => toggleOutcome('Lost')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                  selectedOutcomes.includes('Lost')
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => toggleOutcome('Unknown')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                  selectedOutcomes.includes('Unknown')
                    ? 'bg-[#666666] text-white'
                    : 'bg-[#333333]/50 text-[#A1A1A1] border border-[#333333] hover:bg-[#333333]'
                }`}
              >
                Unknown
              </button>
              {selectedOutcomes.length > 0 && (
                <button
                  onClick={() => setSelectedOutcomes([])}
                  className="text-xs text-[#0070F3] hover:underline ml-2"
                >
                  Clear
                </button>
              )}
            </div>

            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1F1F1F]">
                {selectedCategories.map(cat => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0070F3]/10 text-[#0070F3] text-sm rounded-full font-medium"
                  >
                    {cat}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="hover:text-white ml-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1F1F1F]">
                    {[
                      { key: 'date', label: 'Date' },
                      { key: 'category', label: 'Category' },
                      { key: 'customer', label: 'Customer' },
                      { key: 'project', label: 'Project' },
                      { key: 'estimator', label: 'Estimator' },
                      { key: 'total', label: 'Total' },
                      { key: 'sqft', label: '$/sq ft' },
                      { key: 'linft', label: '$/lin ft' },
                      { key: 'outcome', label: 'Outcome' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider cursor-pointer hover:text-[#A1A1A1] transition-colors duration-150 bg-[#111111]"
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          <svg className={`w-3.5 h-3.5 ${sortBy === col.key ? 'text-[#EDEDED]' : 'text-[#333333]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === col.key && sortDirection === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                          </svg>
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-3 w-12 bg-[#111111]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {filteredAndSortedCostSheets.map((sheet) => {
                    const categoryStats = analytics?.byCategory.find(c => c.category === sheet.category);
                    const localAvgs = getLocalAverages(sheet.category);
                    const avgSqFt = categoryStats?.wonAvgPricePerSqFt || localAvgs.avgSqFt;
                    const avgLinFt = categoryStats?.wonAvgPricePerLinFt || localAvgs.avgLinFt;

                    return (
                      <tr
                        key={sheet.id}
                        className="hover:bg-[#111111] cursor-pointer transition-colors duration-150 group"
                        onClick={(e) => handleRowClick(sheet.id, e)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#EDEDED] tabular-nums">
                          {new Date(sheet.inquiryDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#EDEDED]">
                          <span className="block max-w-[120px] truncate" title={sheet.category || '-'}>{sheet.category || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#A1A1A1]">
                          <span className="block max-w-[100px] truncate" title={sheet.customer || '-'}>{sheet.customer || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#A1A1A1]">
                          <span className="block max-w-[150px] truncate" title={sheet.project || '-'}>{sheet.project || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#A1A1A1]">
                          <span className="block max-w-[80px] truncate" title={sheet.estimator || '-'}>{sheet.estimator || '-'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#EDEDED] font-medium tabular-nums">
                          {formatCurrency(sheet.totalPriceToClient)}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm tabular-nums ${getPriceColor(sheet.pricePerSqFtPreDelivery, avgSqFt)}`}>
                          {sheet.pricePerSqFtPreDelivery ? formatCurrency(sheet.pricePerSqFtPreDelivery) : '-'}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm tabular-nums ${getPriceColor(sheet.pricePerLinFtPreDelivery, avgLinFt)}`}>
                          {sheet.pricePerLinFtPreDelivery ? formatCurrency(sheet.pricePerLinFtPreDelivery) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <select
                            value={sheet.outcome || 'Unknown'}
                            onChange={(e) => updateOutcome(sheet.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer border-0 focus:ring-0 ${
                              sheet.outcome === 'Won'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : sheet.outcome === 'Lost'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-[#1F1F1F] text-[#666666]'
                            }`}
                          >
                            <option value="Unknown">Unknown</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/costsheet/view?id=${sheet.id}&autoPrint=true`);
                              }}
                              className="p-1.5 text-[#666666] hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-150 opacity-0 group-hover:opacity-100"
                              title="Export PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h1M9 13h6M9 17h6" />
                              </svg>
                            </button>
                            {/* Delete button - only visible to users with delete permission */}
                            {canDelete(userRole) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModalId(sheet.id);
                                }}
                                className="p-1.5 text-[#666666] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150 opacity-0 group-hover:opacity-100"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredAndSortedCostSheets.length === 0 && (
              <div className="text-center py-16 text-[#666666]">
                <svg className="w-12 h-12 mx-auto mb-4 text-[#333333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                No cost sheets found. Create your first one!
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

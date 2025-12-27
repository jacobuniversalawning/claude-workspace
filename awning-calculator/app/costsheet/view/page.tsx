'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/calculations';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import ActivityLog from '@/components/ActivityLog';
import { Suspense } from 'react';

interface ActivityLogEntry {
  id: string;
  createdAt: string;
  action: string;
  description: string | null;
  changes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface CostSheet {
  id: string;
  createdAt: string;
  inquiryDate: string;
  dueDate: string;
  category: string;
  customer: string;
  salesRep: string;
  project: string;
  jobSite: string;
  estimator: string | null;
  canopySqFt: number;
  awningLinFt: number;
  totalMaterials: number;
  totalFabric: number;
  totalFabricationLabor: number;
  totalInstallationLabor: number;
  totalLabor: number;
  subtotalBeforeMarkup: number;
  markup: number;
  totalWithMarkup: number;
  totalOtherRequirements: number;
  grandTotal: number;
  discountIncrease: number;
  totalPriceToClient: number;
  pricePerSqFtPreDelivery: number | null;
  pricePerLinFtPreDelivery: number | null;
  outcome: string;
  user?: {
    name: string | null;
    email: string | null;
  };
  activityLogs?: ActivityLogEntry[];
  products?: Array<{
    name: string;
    width: number;
    projection: number;
    height: number;
    valance: number;
    sqFt: number;
    linFt: number;
  }>;
  materials?: Array<{
    description: string;
    qty: number;
    unitPrice: number;
    freight: number;
    total: number;
  }>;
  fabricLines?: Array<{
    name: string;
    yards: number;
    pricePerYard: number;
    freight: number;
    total: number;
  }>;
  laborLines?: Array<{
    type: string;
    hours: number;
    people: number;
    rate: number;
    total: number;
    isFabrication: boolean;
  }>;
}

function CostSheetViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [costSheet, setCostSheet] = useState<CostSheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCostSheet() {
      if (id) {
        try {
          // Try fetching from API first
          const response = await fetch(`/api/costsheets/${id}`);
          if (response.ok) {
            const data = await response.json();
            setCostSheet(data);
          } else {
            // Fallback to localStorage for backwards compatibility
            const localData = localStorage.getItem('costSheets');
            if (localData) {
              const sheets = JSON.parse(localData);
              const found = sheets.find((s: CostSheet) => s.id === id);
              setCostSheet(found || null);
            }
          }
        } catch {
          // Fallback to localStorage on error
          const localData = localStorage.getItem('costSheets');
          if (localData) {
            const sheets = JSON.parse(localData);
            const found = sheets.find((s: CostSheet) => s.id === id);
            setCostSheet(found || null);
          }
        }
      }
      setLoading(false);
    }
    fetchCostSheet();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!costSheet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-xl text-gray-900 dark:text-white mb-4">Cost sheet not found</div>
          <button onClick={() => router.push('/')} className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const cardClass = "bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6";
  const labelClass = "text-sm text-gray-600 dark:text-gray-400";
  const valueClass = "font-medium text-gray-900 dark:text-white";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className={cardClass}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cost Sheet Details</h1>
              <p className="text-gray-600 dark:text-gray-400">{costSheet.category}</p>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                ← Dashboard
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className={labelClass}>Inquiry Date</div>
              <div className={valueClass}>{new Date(costSheet.inquiryDate).toLocaleDateString()}</div>
            </div>
            <div>
              <div className={labelClass}>Due Date</div>
              <div className={valueClass}>{new Date(costSheet.dueDate).toLocaleDateString()}</div>
            </div>
            <div>
              <div className={labelClass}>Customer</div>
              <div className={valueClass}>{costSheet.customer || '-'}</div>
            </div>
            <div>
              <div className={labelClass}>Sales Rep</div>
              <div className={valueClass}>{costSheet.salesRep || '-'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className={labelClass}>Project</div>
              <div className={valueClass}>{costSheet.project || '-'}</div>
            </div>
            <div>
              <div className={labelClass}>Job Site</div>
              <div className={valueClass}>{costSheet.jobSite || '-'}</div>
            </div>
          </div>
        </div>

        {/* Products */}
        {costSheet.products && costSheet.products.length > 0 && (
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Products & Dimensions</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Product</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Width</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Projection</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Height</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Valance</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Sq Ft</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Lin Ft</th>
                </tr>
              </thead>
              <tbody>
                {costSheet.products.map((p, i) => (
                  <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{p.width}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{p.projection}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{p.height}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{p.valance}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{p.sqFt?.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{p.linFt?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <td colSpan={5} className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">Totals:</td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">{costSheet.canopySqFt?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">{costSheet.awningLinFt?.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Materials */}
        {costSheet.materials && costSheet.materials.length > 0 && (
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Materials</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Description</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Qty</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Unit $</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Freight</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Total</th>
                </tr>
              </thead>
              <tbody>
                {costSheet.materials.map((m, i) => (
                  <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{m.description || '-'}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{m.qty}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{formatCurrency(m.unitPrice)}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{formatCurrency(m.freight || 0)}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(m.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30">
                  <td colSpan={4} className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">Total Materials:</td>
                  <td className="px-3 py-2 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(costSheet.totalMaterials)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Fabric */}
        {costSheet.fabricLines && costSheet.fabricLines.length > 0 && (
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fabric</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Yards</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">$/Yard</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Freight</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Total</th>
                </tr>
              </thead>
              <tbody>
                {costSheet.fabricLines.map((f, i) => (
                  <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{f.name || '-'}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{f.yards}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{formatCurrency(f.pricePerYard)}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{formatCurrency(f.freight || 0)}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(f.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30">
                  <td colSpan={4} className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">Total Fabric:</td>
                  <td className="px-3 py-2 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(costSheet.totalFabric)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Labor */}
        {costSheet.laborLines && costSheet.laborLines.length > 0 && (
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Labor</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Type</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Hours</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">People</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Rate</th>
                  <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Total</th>
                </tr>
              </thead>
              <tbody>
                {costSheet.laborLines.filter(l => l.isFabrication).map((l, i) => (
                  <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{l.type}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{l.hours}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{l.people}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{formatCurrency(l.rate)}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(l.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <td colSpan={4} className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">Fabrication Total:</td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(costSheet.totalFabricationLabor)}</td>
                </tr>
              </tfoot>
            </table>

            {costSheet.laborLines.some(l => !l.isFabrication) && (
              <>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mt-6 mb-2">Installation</h3>
                <table className="w-full text-sm">
                  <thead className="bg-orange-100 dark:bg-orange-900/30">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Type</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Hours</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">People</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Rate</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSheet.laborLines.filter(l => !l.isFabrication).map((l, i) => (
                      <tr key={i} className="border-t border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{l.type}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{l.hours}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{l.people}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{formatCurrency(l.rate)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(l.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-orange-300 dark:border-orange-600 bg-orange-100 dark:bg-orange-900/30">
                      <td colSpan={4} className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">Installation Total:</td>
                      <td className="px-3 py-2 text-right font-bold text-orange-700 dark:text-orange-300">{formatCurrency(costSheet.totalInstallationLabor)}</td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-600">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Total All Labor:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(costSheet.totalLabor)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400">Materials:</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalMaterials)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400">Fabric:</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalFabric)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400">Labor:</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalLabor)}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.subtotalBeforeMarkup)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400">Markup ({(costSheet.markup * 100).toFixed(0)}%):</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.subtotalBeforeMarkup * costSheet.markup)}</span>
            </div>
            <div className="flex justify-between py-2 bg-blue-100 dark:bg-blue-900/50 -mx-2 px-2 rounded">
              <span className="font-semibold text-blue-700 dark:text-blue-300">Pre-Delivery Total:</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(costSheet.totalWithMarkup)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 dark:text-gray-400">Other Requirements:</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalOtherRequirements)}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">Grand Total:</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(costSheet.grandTotal)}</span>
            </div>
            {costSheet.discountIncrease !== 0 && (
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-400">Discount/Increase:</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.discountIncrease)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 bg-green-100 dark:bg-green-900/50 -mx-2 px-2 rounded mt-2">
              <span className="font-bold text-green-700 dark:text-green-300">Total Price to Client:</span>
              <span className="font-bold text-xl text-green-700 dark:text-green-300">{formatCurrency(costSheet.totalPriceToClient)}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Price per Sq Ft (Pre-Delivery)</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {costSheet.pricePerSqFtPreDelivery ? formatCurrency(costSheet.pricePerSqFtPreDelivery) : '-'}
              </div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Price per Lin Ft (Pre-Delivery)</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {costSheet.pricePerLinFtPreDelivery ? formatCurrency(costSheet.pricePerLinFtPreDelivery) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        {costSheet.activityLogs && costSheet.activityLogs.length > 0 && (
          <ActivityLog logs={costSheet.activityLogs} className="mb-6" />
        )}

        {/* Created By / Estimator Info */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Sheet Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className={labelClass}>Estimator</div>
              <div className={valueClass}>{costSheet.estimator || costSheet.user?.name || '-'}</div>
            </div>
            <div>
              <div className={labelClass}>Created By</div>
              <div className={valueClass}>{costSheet.user?.name || costSheet.user?.email || '-'}</div>
            </div>
            <div>
              <div className={labelClass}>Created On</div>
              <div className={valueClass}>{new Date(costSheet.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CostSheetView() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <CostSheetViewContent />
    </Suspense>
  );
}

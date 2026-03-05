'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
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
  competitorPrice?: number;
  // Additional fields for "Other Requirements"
  permitCost?: number;
  engineeringCost?: number;
  equipmentCost?: number;
  foodCost?: number;
  driveTimeTrips?: number;
  driveTimeHours?: number;
  driveTimePeople?: number;
  driveTimeRate?: number;
  driveTimeTotal?: number;
  roundtripMiles?: number;
  roundtripTrips?: number;
  mileageRate?: number;
  mileageTotal?: number;
  hotelNights?: number;
  hotelPeople?: number;
  hotelRate?: number;
  hotelTotal?: number;
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
  const autoPrint = searchParams.get('autoPrint') === 'true';

  const [costSheet, setCostSheet] = useState<CostSheet | null>(null);
  const [loading, setLoading] = useState(true);

  // Ref for printable content
  const printContentRef = useRef<HTMLDivElement>(null);

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: costSheet ? `CostSheet-${costSheet.customer || costSheet.project || costSheet.id}` : 'CostSheet',
  });

  useEffect(() => {
    async function fetchCostSheet() {
      if (id) {
        try {
          const response = await fetch(`/api/costsheets/${id}`);
          if (response.ok) {
            const data = await response.json();
            setCostSheet(data);
          } else {
            const localData = localStorage.getItem('costSheets');
            if (localData) {
              const sheets = JSON.parse(localData);
              const found = sheets.find((s: CostSheet) => s.id === id);
              setCostSheet(found || null);
            }
          }
        } catch {
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

  // Auto-print when autoPrint param is true
  useEffect(() => {
    if (autoPrint && costSheet && !loading) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, costSheet, loading, handlePrint]);

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

  // Styles for screen view
  const cardClass = "bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 print:hidden";
  const labelClass = "text-sm text-gray-600 dark:text-gray-400";
  const valueClass = "font-medium text-gray-900 dark:text-white";

  // Compact table cell styles for print
  const printTh = "px-1 py-0.5 text-left text-[9px] font-semibold border border-gray-300 bg-gray-100";
  const printTd = "px-1 py-0.5 text-[9px] border border-gray-300";
  const printTdRight = "px-1 py-0.5 text-[9px] border border-gray-300 text-right";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 transition-colors print:bg-white print:py-0">
      <div className="max-w-5xl mx-auto px-4 print:max-w-none print:px-0">
        {/* Printable Content Wrapper */}
        <div ref={printContentRef} className="print:p-4">

          {/* ========== PRINT-ONLY COMPACT LAYOUT ========== */}
          <div className="hidden print:block text-[8px] leading-tight">
            {/* Print Header with Pricing Overview */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-1.5 mb-2">
              <div>
                <h1 className="text-sm font-bold tracking-tight">Universal Awning & Canopy</h1>
                <div className="text-[7px] text-gray-500 mt-0.5">Cost Sheet — {costSheet.category} — ID: {costSheet.id.slice(0, 8)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatCurrency(costSheet.totalPriceToClient)}</div>
                <div className="text-[7px] text-gray-500">Total to Client</div>
              </div>
            </div>

            {/* Two-column layout for entire page */}
            <div className="grid grid-cols-2 gap-2">

              {/* ===== LEFT COLUMN ===== */}
              <div className="space-y-1.5">

                {/* Project Info */}
                <div>
                  <div className="bg-gray-700 text-white px-1.5 py-0.5 font-bold text-[8px] mb-0.5">PROJECT INFORMATION</div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-gray-50 w-1/4">Customer</td>
                        <td className="px-1 py-0.5 border border-gray-300">{costSheet.customer || '-'}</td>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-gray-50 w-1/4">Sales Rep</td>
                        <td className="px-1 py-0.5 border border-gray-300">{costSheet.salesRep || '-'}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-gray-50">Project</td>
                        <td className="px-1 py-0.5 border border-gray-300">{costSheet.project || '-'}</td>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-gray-50">Estimator</td>
                        <td className="px-1 py-0.5 border border-gray-300">{costSheet.estimator || '-'}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-gray-50">Job Site</td>
                        <td className="px-1 py-0.5 border border-gray-300">{costSheet.jobSite || '-'}</td>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-gray-50">Outcome</td>
                        <td className="px-1 py-0.5 border border-gray-300">{costSheet.outcome || 'Unknown'}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-gray-50">Inquiry</td>
                        <td className="px-1 py-0.5 border border-gray-300">{new Date(costSheet.inquiryDate).toLocaleDateString()}</td>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-gray-50">Due Date</td>
                        <td className="px-1 py-0.5 border border-gray-300">{new Date(costSheet.dueDate).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Products & Dimensions */}
                <div>
                  <div className="bg-indigo-100 text-indigo-900 px-1.5 py-0.5 font-bold text-[8px] mb-0.5 border border-indigo-200">PRODUCTS & DIMENSIONS — {costSheet.canopySqFt?.toFixed(1)} sq ft / {costSheet.awningLinFt?.toFixed(1)} lin ft</div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-indigo-50">
                        <th className="px-1 py-0.5 text-left border border-gray-300 font-semibold">Product</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">W</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Proj</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">H</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Sq Ft</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Lin Ft</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costSheet.products && costSheet.products.length > 0 ? costSheet.products.map((p, i) => (
                        <tr key={i}>
                          <td className="px-1 py-0.5 border border-gray-300">{p.name}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{p.width}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{p.projection}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{p.height}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{p.sqFt?.toFixed(1)}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{p.linFt?.toFixed(1)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="px-1 py-0.5 border border-gray-300 text-center italic">No products</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Materials */}
                <div>
                  <div className="bg-amber-100 text-amber-900 px-1.5 py-0.5 font-bold text-[8px] mb-0.5 border border-amber-200">MATERIALS — {formatCurrency(costSheet.totalMaterials)} {costSheet.grandTotal > 0 && <span className="font-normal">({((costSheet.totalMaterials / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-amber-50">
                        <th className="px-1 py-0.5 text-left border border-gray-300 font-semibold">Description</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Qty</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Unit $</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costSheet.materials && costSheet.materials.length > 0 ? costSheet.materials.map((m, i) => (
                        <tr key={i}>
                          <td className="px-1 py-0.5 border border-gray-300">{m.description || '-'}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{m.qty}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(m.unitPrice)}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(m.total)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-1 py-0.5 border border-gray-300 text-center italic">No materials</td></tr>
                      )}
                      <tr className="bg-amber-100 font-semibold">
                        <td colSpan={3} className="px-1 py-0.5 border border-gray-300 text-right">Total Materials:</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalMaterials)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Fabric */}
                <div>
                  <div className="bg-purple-100 text-purple-900 px-1.5 py-0.5 font-bold text-[8px] mb-0.5 border border-purple-200">FABRIC — {formatCurrency(costSheet.totalFabric)} {costSheet.grandTotal > 0 && <span className="font-normal">({((costSheet.totalFabric / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-purple-50">
                        <th className="px-1 py-0.5 text-left border border-gray-300 font-semibold">Name</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Yards</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">$/Yd</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costSheet.fabricLines && costSheet.fabricLines.length > 0 ? costSheet.fabricLines.map((f, i) => (
                        <tr key={i}>
                          <td className="px-1 py-0.5 border border-gray-300">{f.name || '-'}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{f.yards}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(f.pricePerYard)}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(f.total)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-1 py-0.5 border border-gray-300 text-center italic">No fabric</td></tr>
                      )}
                      <tr className="bg-purple-100 font-semibold">
                        <td colSpan={3} className="px-1 py-0.5 border border-gray-300 text-right">Total Fabric:</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalFabric)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ===== RIGHT COLUMN ===== */}
              <div className="space-y-1.5">

                {/* Pricing Overview Box */}
                <div>
                  <div className="bg-emerald-700 text-white px-1.5 py-0.5 font-bold text-[8px] mb-0.5">PRICING SUMMARY</div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="bg-emerald-50">
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold">Materials</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalMaterials)}</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right text-gray-500">{costSheet.grandTotal > 0 ? ((costSheet.totalMaterials / costSheet.grandTotal) * 100).toFixed(1) + '%' : '-'}</td>
                      </tr>
                      <tr className="bg-emerald-50">
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold">Fabric</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalFabric)}</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right text-gray-500">{costSheet.grandTotal > 0 ? ((costSheet.totalFabric / costSheet.grandTotal) * 100).toFixed(1) + '%' : '-'}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold">Fabrication Labor</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalFabricationLabor)}</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right text-gray-500">{costSheet.grandTotal > 0 ? ((costSheet.totalFabricationLabor / costSheet.grandTotal) * 100).toFixed(1) + '%' : '-'}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold">Installation Labor</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalInstallationLabor)}</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right text-gray-500">{costSheet.grandTotal > 0 ? ((costSheet.totalInstallationLabor / costSheet.grandTotal) * 100).toFixed(1) + '%' : '-'}</td>
                      </tr>
                      <tr className="border-t-2 border-gray-500">
                        <td className="px-1 py-0.5 border border-gray-300 font-bold">Subtotal</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right font-bold">{formatCurrency(costSheet.subtotalBeforeMarkup)}</td>
                        <td className="px-1 py-0.5 border border-gray-300"></td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300">Profit ({((1 - costSheet.markup) * 100).toFixed(0)}% margin)</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalWithMarkup - costSheet.subtotalBeforeMarkup)}</td>
                        <td className="px-1 py-0.5 border border-gray-300"></td>
                      </tr>
                      <tr className="bg-blue-100 font-bold">
                        <td className="px-1 py-0.5 border border-gray-300">Pre-Delivery</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalWithMarkup)}</td>
                        <td className="px-1 py-0.5 border border-gray-300"></td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300">Other Requirements</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalOtherRequirements)}</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right text-gray-500">{costSheet.grandTotal > 0 ? ((costSheet.totalOtherRequirements / costSheet.grandTotal) * 100).toFixed(1) + '%' : '-'}</td>
                      </tr>
                      <tr className="font-bold">
                        <td className="px-1 py-0.5 border border-gray-300">Grand Total</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.grandTotal)}</td>
                        <td className="px-1 py-0.5 border border-gray-300"></td>
                      </tr>
                      {costSheet.discountIncrease !== 0 && (
                        <tr>
                          <td className="px-1 py-0.5 border border-gray-300">Discount/Increase</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.discountIncrease)}</td>
                          <td className="px-1 py-0.5 border border-gray-300"></td>
                        </tr>
                      )}
                      <tr className="bg-emerald-200 font-bold text-[9px]">
                        <td className="px-1 py-1 border border-gray-300">TOTAL TO CLIENT</td>
                        <td className="px-1 py-1 border border-gray-300 text-right">{formatCurrency(costSheet.totalPriceToClient)}</td>
                        <td className="px-1 py-1 border border-gray-300"></td>
                      </tr>
                    </tbody>
                  </table>
                  {/* Per-unit pricing */}
                  <div className="flex gap-3 mt-0.5 text-[7px] text-gray-600 px-1">
                    <span>$/sq ft (pre-del): <strong>{costSheet.pricePerSqFtPreDelivery ? formatCurrency(costSheet.pricePerSqFtPreDelivery) : '-'}</strong></span>
                    <span>$/lin ft (pre-del): <strong>{costSheet.pricePerLinFtPreDelivery ? formatCurrency(costSheet.pricePerLinFtPreDelivery) : '-'}</strong></span>
                    <span>$/sq ft (final): <strong>{costSheet.canopySqFt > 0 ? formatCurrency(costSheet.totalPriceToClient / costSheet.canopySqFt) : '-'}</strong></span>
                    <span>$/lin ft (final): <strong>{costSheet.awningLinFt > 0 ? formatCurrency(costSheet.totalPriceToClient / costSheet.awningLinFt) : '-'}</strong></span>
                  </div>
                </div>

                {/* Fabrication Labor */}
                <div>
                  <div className="bg-sky-100 text-sky-900 px-1.5 py-0.5 font-bold text-[8px] mb-0.5 border border-sky-200">FABRICATION LABOR — {formatCurrency(costSheet.totalFabricationLabor)} {costSheet.grandTotal > 0 && <span className="font-normal">({((costSheet.totalFabricationLabor / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-sky-50">
                        <th className="px-1 py-0.5 text-left border border-gray-300 font-semibold">Type</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Hrs</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Ppl</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Rate</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costSheet.laborLines && costSheet.laborLines.filter(l => l.isFabrication).length > 0 ? costSheet.laborLines.filter(l => l.isFabrication).map((l, i) => (
                        <tr key={i}>
                          <td className="px-1 py-0.5 border border-gray-300">{l.type}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{l.hours}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{l.people}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(l.rate)}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(l.total)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="px-1 py-0.5 border border-gray-300 text-center italic">No fabrication labor</td></tr>
                      )}
                      <tr className="bg-sky-100 font-semibold">
                        <td colSpan={4} className="px-1 py-0.5 border border-gray-300 text-right">Fabrication Total:</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalFabricationLabor)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Installation Labor */}
                <div>
                  <div className="bg-orange-100 text-orange-900 px-1.5 py-0.5 font-bold text-[8px] mb-0.5 border border-orange-200">INSTALLATION LABOR — {formatCurrency(costSheet.totalInstallationLabor)} {costSheet.grandTotal > 0 && <span className="font-normal">({((costSheet.totalInstallationLabor / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-orange-50">
                        <th className="px-1 py-0.5 text-left border border-gray-300 font-semibold">Type</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Hrs</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Ppl</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Rate</th>
                        <th className="px-1 py-0.5 text-right border border-gray-300 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costSheet.laborLines && costSheet.laborLines.filter(l => !l.isFabrication).length > 0 ? costSheet.laborLines.filter(l => !l.isFabrication).map((l, i) => (
                        <tr key={i}>
                          <td className="px-1 py-0.5 border border-gray-300">{l.type}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{l.hours}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{l.people}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(l.rate)}</td>
                          <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(l.total)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="px-1 py-0.5 border border-gray-300 text-center italic">No installation labor</td></tr>
                      )}
                      <tr className="bg-orange-100 font-semibold">
                        <td colSpan={4} className="px-1 py-0.5 border border-gray-300 text-right">Installation Total:</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalInstallationLabor)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Other Requirements */}
                <div>
                  <div className="bg-rose-100 text-rose-900 px-1.5 py-0.5 font-bold text-[8px] mb-0.5 border border-rose-200">OTHER REQUIREMENTS — {formatCurrency(costSheet.totalOtherRequirements)} {costSheet.grandTotal > 0 && <span className="font-normal">({((costSheet.totalOtherRequirements / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-rose-50">Permit</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.permitCost || 0)}</td>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-rose-50">Engineering</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.engineeringCost || 0)}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-rose-50">Equipment</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.equipmentCost || 0)}</td>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-rose-50">Food</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.foodCost || 0)}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-rose-50">Drive Time</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.driveTimeTotal || 0)}</td>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-rose-50">Mileage</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.mileageTotal || 0)}</td>
                      </tr>
                      <tr>
                        <td className="px-1 py-0.5 border border-gray-300 font-semibold bg-rose-50">Hotel</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.hotelTotal || 0)}</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right" colSpan={2}></td>
                      </tr>
                      <tr className="bg-rose-100 font-semibold">
                        <td colSpan={3} className="px-1 py-0.5 border border-gray-300 text-right">Total Other Requirements:</td>
                        <td className="px-1 py-0.5 border border-gray-300 text-right">{formatCurrency(costSheet.totalOtherRequirements)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Competitor Pricing if available */}
                {costSheet.competitorPrice && costSheet.competitorPrice > 0 && (
                  <div className="text-[7px] bg-gray-50 border border-gray-300 px-1.5 py-0.5">
                    <span className="font-bold">Competitor:</span> {formatCurrency(costSheet.competitorPrice)}
                    {costSheet.canopySqFt > 0 && <span className="ml-2">({formatCurrency(costSheet.competitorPrice / costSheet.canopySqFt)}/sq ft)</span>}
                    {costSheet.awningLinFt > 0 && <span className="ml-2">({formatCurrency(costSheet.competitorPrice / costSheet.awningLinFt)}/lin ft)</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-1.5 pt-1 border-t border-gray-400 text-[7px] text-gray-400 flex justify-between">
              <span>Universal Awning & Canopy — {costSheet.customer} — {costSheet.project}</span>
              <span>Created: {new Date(costSheet.createdAt).toLocaleDateString()} | Printed: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* ========== SCREEN-ONLY REGULAR LAYOUT ========== */}
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
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Materials</h2>
                {costSheet.grandTotal > 0 && <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">({((costSheet.totalMaterials / costSheet.grandTotal) * 100).toFixed(1)}% of total)</span>}
              </div>
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
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fabric</h2>
                {costSheet.grandTotal > 0 && <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">({((costSheet.totalFabric / costSheet.grandTotal) * 100).toFixed(1)}% of total)</span>}
              </div>
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
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Labor</h2>
                {costSheet.grandTotal > 0 && <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">({((costSheet.totalLabor / costSheet.grandTotal) * 100).toFixed(1)}% of total)</span>}
              </div>
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
                  <div className="flex items-center gap-3 mt-6 mb-2">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">Installation</h3>
                    {costSheet.grandTotal > 0 && <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">({((costSheet.totalInstallationLabor / costSheet.grandTotal) * 100).toFixed(1)}% of total)</span>}
                  </div>
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
                <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalMaterials)} {costSheet.grandTotal > 0 && <span className="text-yellow-600 dark:text-yellow-400 text-xs">({((costSheet.totalMaterials / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-400">Fabric:</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalFabric)} {costSheet.grandTotal > 0 && <span className="text-yellow-600 dark:text-yellow-400 text-xs">({((costSheet.totalFabric / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-400">Fab. Labor:</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalFabricationLabor)} {costSheet.grandTotal > 0 && <span className="text-yellow-600 dark:text-yellow-400 text-xs">({((costSheet.totalFabricationLabor / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-400">Install Labor:</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalInstallationLabor)} {costSheet.grandTotal > 0 && <span className="text-yellow-600 dark:text-yellow-400 text-xs">({((costSheet.totalInstallationLabor / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.subtotalBeforeMarkup)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-400">Profit ({costSheet.markup.toFixed(2)} → {((1 - costSheet.markup) * 100).toFixed(0)}% margin):</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalWithMarkup - costSheet.subtotalBeforeMarkup)}</span>
              </div>
              <div className="flex justify-between py-2 bg-blue-100 dark:bg-blue-900/50 -mx-2 px-2 rounded">
                <span className="font-semibold text-blue-700 dark:text-blue-300">Pre-Delivery Total:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(costSheet.totalWithMarkup)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-400">Other Requirements:</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(costSheet.totalOtherRequirements)} {costSheet.grandTotal > 0 && <span className="text-yellow-600 dark:text-yellow-400 text-xs">({((costSheet.totalOtherRequirements / costSheet.grandTotal) * 100).toFixed(1)}%)</span>}</span>
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

            {/* Competitor Pricing */}
            {costSheet.competitorPrice && costSheet.competitorPrice > 0 && (
              <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-700/50">
                <div className="flex justify-between py-2 bg-amber-50 dark:bg-amber-900/20 -mx-2 px-2 rounded border border-amber-200 dark:border-amber-700/50">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Competitor Price:</span>
                  <span className="font-bold text-lg text-amber-700 dark:text-amber-400">{formatCurrency(costSheet.competitorPrice)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {costSheet.canopySqFt && costSheet.canopySqFt > 0 && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200/50 dark:border-amber-700/30">
                      <div className="text-xs text-amber-600 dark:text-amber-400/60">Comp. $/sq ft</div>
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(costSheet.competitorPrice / costSheet.canopySqFt)}
                      </div>
                    </div>
                  )}
                  {costSheet.awningLinFt && costSheet.awningLinFt > 0 && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200/50 dark:border-amber-700/30">
                      <div className="text-xs text-amber-600 dark:text-amber-400/60">Comp. $/lin ft</div>
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(costSheet.competitorPrice / costSheet.awningLinFt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activity Log - Screen View */}
          <ActivityLog logs={costSheet.activityLogs || []} className="mb-6 print:hidden" />

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

          {/* Actions - Screen Only */}
          <div className="flex justify-center gap-4 mt-6 print:hidden">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={() => handlePrint()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / PDF
            </button>
          </div>
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

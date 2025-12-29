'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency } from '@/lib/calculations';
import { DarkModeToggle } from '@/components/DarkModeToggle';
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
          <div className="hidden print:block">
            {/* Print Header */}
            <div className="border-b-2 border-black pb-2 mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-bold">Universal Awning & Canopy - Cost Sheet</h1>
                  <p className="text-[10px] text-gray-600">{costSheet.category} | ID: {costSheet.id}</p>
                </div>
                <div className="text-right text-[9px]">
                  <div>Created: {new Date(costSheet.createdAt).toLocaleDateString()}</div>
                  <div>Printed: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Print Project Info - Compact Grid */}
            <div className="grid grid-cols-4 gap-2 mb-3 text-[9px]">
              <div><span className="font-semibold">Inquiry:</span> {new Date(costSheet.inquiryDate).toLocaleDateString()}</div>
              <div><span className="font-semibold">Due:</span> {new Date(costSheet.dueDate).toLocaleDateString()}</div>
              <div><span className="font-semibold">Customer:</span> {costSheet.customer || '-'}</div>
              <div><span className="font-semibold">Sales Rep:</span> {costSheet.salesRep || '-'}</div>
              <div className="col-span-2"><span className="font-semibold">Project:</span> {costSheet.project || '-'}</div>
              <div className="col-span-2"><span className="font-semibold">Job Site:</span> {costSheet.jobSite || '-'}</div>
              <div><span className="font-semibold">Estimator:</span> {costSheet.estimator || '-'}</div>
              <div><span className="font-semibold">Created By:</span> {costSheet.user?.name || '-'}</div>
              <div><span className="font-semibold">Outcome:</span> {costSheet.outcome || 'Unknown'}</div>
            </div>

            {/* Print Products Table */}
            <div className="mb-2">
              <h2 className="text-[10px] font-bold mb-1 bg-gray-200 px-1">PRODUCTS & DIMENSIONS</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={printTh}>Product</th>
                    <th className={printTh + " text-right"}>Width</th>
                    <th className={printTh + " text-right"}>Projection</th>
                    <th className={printTh + " text-right"}>Height</th>
                    <th className={printTh + " text-right"}>Valance</th>
                    <th className={printTh + " text-right"}>Sq Ft</th>
                    <th className={printTh + " text-right"}>Lin Ft</th>
                  </tr>
                </thead>
                <tbody>
                  {costSheet.products && costSheet.products.length > 0 ? (
                    costSheet.products.map((p, i) => (
                      <tr key={i}>
                        <td className={printTd}>{p.name}</td>
                        <td className={printTdRight}>{p.width}</td>
                        <td className={printTdRight}>{p.projection}</td>
                        <td className={printTdRight}>{p.height}</td>
                        <td className={printTdRight}>{p.valance}</td>
                        <td className={printTdRight}>{p.sqFt?.toFixed(2)}</td>
                        <td className={printTdRight}>{p.linFt?.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className={printTd + " text-center italic"}>No products</td></tr>
                  )}
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={5} className={printTd + " text-right"}>Totals:</td>
                    <td className={printTdRight}>{costSheet.canopySqFt?.toFixed(2)}</td>
                    <td className={printTdRight}>{costSheet.awningLinFt?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Print Materials & Fabric Side by Side */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Materials */}
              <div>
                <h2 className="text-[10px] font-bold mb-1 bg-gray-200 px-1">MATERIALS</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={printTh}>Description</th>
                      <th className={printTh + " text-right"}>Qty</th>
                      <th className={printTh + " text-right"}>Unit $</th>
                      <th className={printTh + " text-right"}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSheet.materials && costSheet.materials.length > 0 ? (
                      costSheet.materials.map((m, i) => (
                        <tr key={i}>
                          <td className={printTd}>{m.description || '-'}</td>
                          <td className={printTdRight}>{m.qty}</td>
                          <td className={printTdRight}>{formatCurrency(m.unitPrice)}</td>
                          <td className={printTdRight}>{formatCurrency(m.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className={printTd + " text-center italic"}>No materials</td></tr>
                    )}
                    <tr className="bg-blue-50 font-semibold">
                      <td colSpan={3} className={printTd + " text-right"}>Total Materials:</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalMaterials)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Fabric */}
              <div>
                <h2 className="text-[10px] font-bold mb-1 bg-gray-200 px-1">FABRIC</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={printTh}>Name</th>
                      <th className={printTh + " text-right"}>Yards</th>
                      <th className={printTh + " text-right"}>$/Yd</th>
                      <th className={printTh + " text-right"}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSheet.fabricLines && costSheet.fabricLines.length > 0 ? (
                      costSheet.fabricLines.map((f, i) => (
                        <tr key={i}>
                          <td className={printTd}>{f.name || '-'}</td>
                          <td className={printTdRight}>{f.yards}</td>
                          <td className={printTdRight}>{formatCurrency(f.pricePerYard)}</td>
                          <td className={printTdRight}>{formatCurrency(f.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className={printTd + " text-center italic"}>No fabric</td></tr>
                    )}
                    <tr className="bg-blue-50 font-semibold">
                      <td colSpan={3} className={printTd + " text-right"}>Total Fabric:</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalFabric)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Labor Tables Side by Side */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Fabrication Labor */}
              <div>
                <h2 className="text-[10px] font-bold mb-1 bg-gray-200 px-1">FABRICATION LABOR</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={printTh}>Type</th>
                      <th className={printTh + " text-right"}>Hrs</th>
                      <th className={printTh + " text-right"}>Ppl</th>
                      <th className={printTh + " text-right"}>Rate</th>
                      <th className={printTh + " text-right"}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSheet.laborLines && costSheet.laborLines.filter(l => l.isFabrication).length > 0 ? (
                      costSheet.laborLines.filter(l => l.isFabrication).map((l, i) => (
                        <tr key={i}>
                          <td className={printTd}>{l.type}</td>
                          <td className={printTdRight}>{l.hours}</td>
                          <td className={printTdRight}>{l.people}</td>
                          <td className={printTdRight}>{formatCurrency(l.rate)}</td>
                          <td className={printTdRight}>{formatCurrency(l.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className={printTd + " text-center italic"}>No fab labor</td></tr>
                    )}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={4} className={printTd + " text-right"}>Fabrication Total:</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalFabricationLabor)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Installation Labor */}
              <div>
                <h2 className="text-[10px] font-bold mb-1 bg-orange-100 px-1">INSTALLATION LABOR</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={printTh}>Type</th>
                      <th className={printTh + " text-right"}>Hrs</th>
                      <th className={printTh + " text-right"}>Ppl</th>
                      <th className={printTh + " text-right"}>Rate</th>
                      <th className={printTh + " text-right"}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSheet.laborLines && costSheet.laborLines.filter(l => !l.isFabrication).length > 0 ? (
                      costSheet.laborLines.filter(l => !l.isFabrication).map((l, i) => (
                        <tr key={i}>
                          <td className={printTd}>{l.type}</td>
                          <td className={printTdRight}>{l.hours}</td>
                          <td className={printTdRight}>{l.people}</td>
                          <td className={printTdRight}>{formatCurrency(l.rate)}</td>
                          <td className={printTdRight}>{formatCurrency(l.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className={printTd + " text-center italic"}>No install labor</td></tr>
                    )}
                    <tr className="bg-orange-100 font-semibold">
                      <td colSpan={4} className={printTd + " text-right"}>Installation Total:</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalInstallationLabor)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Other Requirements & Summary Side by Side */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Other Requirements */}
              <div>
                <h2 className="text-[10px] font-bold mb-1 bg-gray-200 px-1">OTHER REQUIREMENTS</h2>
                <table className="w-full border-collapse text-[9px]">
                  <tbody>
                    <tr>
                      <td className={printTd}>Permit</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.permitCost || 0)}</td>
                      <td className={printTd}>Engineering</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.engineeringCost || 0)}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>Equipment</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.equipmentCost || 0)}</td>
                      <td className={printTd}>Food</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.foodCost || 0)}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>Drive Time</td>
                      <td className={printTdRight}>{costSheet.driveTimeTrips || 0} trips × {costSheet.driveTimeHours || 0}hrs × {costSheet.driveTimePeople || 0}ppl</td>
                      <td className={printTd}>Drive $</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.driveTimeTotal || 0)}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>Mileage</td>
                      <td className={printTdRight}>{costSheet.roundtripMiles || 0}mi × {costSheet.roundtripTrips || 0}trips</td>
                      <td className={printTd}>Mileage $</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.mileageTotal || 0)}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>Hotel</td>
                      <td className={printTdRight}>{costSheet.hotelNights || 0}nights × {costSheet.hotelPeople || 0}ppl</td>
                      <td className={printTd}>Hotel $</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.hotelTotal || 0)}</td>
                    </tr>
                    <tr className="bg-orange-100 font-semibold">
                      <td colSpan={3} className={printTd + " text-right"}>Total Other Requirements:</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalOtherRequirements)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div>
                <h2 className="text-[10px] font-bold mb-1 bg-green-100 px-1">PRICING SUMMARY</h2>
                <table className="w-full border-collapse text-[9px]">
                  <tbody>
                    <tr>
                      <td className={printTd}>Materials</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalMaterials)}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>Fabric</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalFabric)}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>Total Labor</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalLabor)}</td>
                    </tr>
                    <tr className="border-t-2 border-gray-400">
                      <td className={printTd + " font-semibold"}>Subtotal</td>
                      <td className={printTdRight + " font-semibold"}>{formatCurrency(costSheet.subtotalBeforeMarkup)}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>Markup ({(costSheet.markup * 100).toFixed(0)}%)</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.subtotalBeforeMarkup * costSheet.markup)}</td>
                    </tr>
                    <tr className="bg-blue-100 font-semibold">
                      <td className={printTd}>Pre-Delivery Total</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalWithMarkup)}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>Other Requirements</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalOtherRequirements)}</td>
                    </tr>
                    <tr className="font-semibold">
                      <td className={printTd}>Grand Total</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.grandTotal)}</td>
                    </tr>
                    {costSheet.discountIncrease !== 0 && (
                      <tr>
                        <td className={printTd}>Discount/Increase</td>
                        <td className={printTdRight}>{formatCurrency(costSheet.discountIncrease)}</td>
                      </tr>
                    )}
                    <tr className="bg-green-200 font-bold text-[10px]">
                      <td className={printTd}>TOTAL TO CLIENT</td>
                      <td className={printTdRight}>{formatCurrency(costSheet.totalPriceToClient)}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>$/Sq Ft (Pre-Del)</td>
                      <td className={printTdRight}>{costSheet.pricePerSqFtPreDelivery ? formatCurrency(costSheet.pricePerSqFtPreDelivery) : '-'}</td>
                    </tr>
                    <tr>
                      <td className={printTd}>$/Lin Ft (Pre-Del)</td>
                      <td className={printTdRight}>{costSheet.pricePerLinFtPreDelivery ? formatCurrency(costSheet.pricePerLinFtPreDelivery) : '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Activity Log */}
            {costSheet.activityLogs && costSheet.activityLogs.length > 0 && (
              <div className="mt-2">
                <h2 className="text-[10px] font-bold mb-1 bg-gray-200 px-1">ACTIVITY LOG</h2>
                <table className="w-full border-collapse text-[8px]">
                  <thead>
                    <tr>
                      <th className={printTh}>Date</th>
                      <th className={printTh}>User</th>
                      <th className={printTh}>Action</th>
                      <th className={printTh}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSheet.activityLogs.slice(0, 10).map((log, i) => (
                      <tr key={i}>
                        <td className={printTd}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td className={printTd}>{log.user?.name || log.user?.email || '-'}</td>
                        <td className={printTd}>{log.action}</td>
                        <td className={printTd}>{log.description || '-'}</td>
                      </tr>
                    ))}
                    {costSheet.activityLogs.length > 10 && (
                      <tr>
                        <td colSpan={4} className={printTd + " text-center italic"}>
                          ...and {costSheet.activityLogs.length - 10} more entries
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Print Footer */}
            <div className="mt-3 pt-2 border-t border-gray-300 text-[8px] text-gray-500 flex justify-between">
              <span>Universal Awning & Canopy Cost Sheet System</span>
              <span>Page 1 of 1</span>
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

          {/* Activity Log - Screen View */}
          {costSheet.activityLogs && costSheet.activityLogs.length > 0 && (
            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Log</h2>
              <div className="space-y-3">
                {costSheet.activityLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {(log.user?.name || log.user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{log.user?.name || log.user?.email || 'Unknown'}</span>
                        <span className="text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-gray-500 dark:text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">{log.action}</div>
                      {log.description && <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">{log.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

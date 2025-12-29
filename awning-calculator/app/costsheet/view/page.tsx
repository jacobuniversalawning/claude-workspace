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

          {/* ========== PRINT-ONLY EXCEL-STYLE LAYOUT ========== */}
          <div className="hidden print:block text-[9px]">
            {/* Define standard labor types that should always be shown */}
            {(() => {
              const TAX_RATE = 0.0975; // 9.75% sales tax
              const DEFAULT_LABOR_RATE = 95.00;

              // Standard fabrication labor types (always show these)
              const fabricationLaborTypes = [
                'Survey',
                'Shop Drawings',
                'Sewing',
                'Graphics',
                'Assembly',
                'Welding',
                'Paint Labor',
              ];

              // Standard installation labor types
              const installationLaborTypes = [
                'Installation',
                'Site Prep',
                'Removal',
              ];

              // Get labor line by type, or return defaults
              const getLaborLine = (type: string, isFabrication: boolean) => {
                const found = costSheet.laborLines?.find(
                  l => l.type.toLowerCase() === type.toLowerCase() && l.isFabrication === isFabrication
                );
                return found || { type, hours: 0, people: 0, rate: DEFAULT_LABOR_RATE, total: 0, isFabrication };
              };

              // Calculate totals for displayed fab labor
              const fabLaborLines = fabricationLaborTypes.map(t => getLaborLine(t, true));
              const installLaborLines = installationLaborTypes.map(t => getLaborLine(t, false));

              // Also include any custom labor types that aren't in the standard list
              const customFabLabor = costSheet.laborLines?.filter(
                l => l.isFabrication && !fabricationLaborTypes.some(t => t.toLowerCase() === l.type.toLowerCase())
              ) || [];
              const customInstallLabor = costSheet.laborLines?.filter(
                l => !l.isFabrication && !installationLaborTypes.some(t => t.toLowerCase() === l.type.toLowerCase())
              ) || [];

              const allFabLabor = [...fabLaborLines, ...customFabLabor];
              const allInstallLabor = [...installLaborLines, ...customInstallLabor];

              return (
                <>
                  {/* Print Header - Excel Style */}
                  <div className="border-2 border-black mb-2">
                    <div className="bg-gray-800 text-white px-2 py-1 text-center">
                      <h1 className="text-sm font-bold">UNIVERSAL AWNING & CANOPY - COST SHEET</h1>
                    </div>
                    <div className="grid grid-cols-6 border-t border-black text-[8px]">
                      <div className="border-r border-black px-1 py-0.5">
                        <span className="font-semibold">Inquiry Date:</span><br/>
                        {new Date(costSheet.inquiryDate).toLocaleDateString()}
                      </div>
                      <div className="border-r border-black px-1 py-0.5">
                        <span className="font-semibold">Due Date:</span><br/>
                        {new Date(costSheet.dueDate).toLocaleDateString()}
                      </div>
                      <div className="border-r border-black px-1 py-0.5 col-span-2">
                        <span className="font-semibold">Customer:</span><br/>
                        {costSheet.customer || '-'}
                      </div>
                      <div className="border-r border-black px-1 py-0.5">
                        <span className="font-semibold">Category:</span><br/>
                        {costSheet.category}
                      </div>
                      <div className="px-1 py-0.5">
                        <span className="font-semibold">Sales Rep:</span><br/>
                        {costSheet.salesRep || '-'}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 border-t border-black text-[8px]">
                      <div className="border-r border-black px-1 py-0.5 col-span-2">
                        <span className="font-semibold">Project:</span> {costSheet.project || '-'}
                      </div>
                      <div className="border-r border-black px-1 py-0.5">
                        <span className="font-semibold">Estimator:</span> {costSheet.estimator || costSheet.user?.name || '-'}
                      </div>
                      <div className="px-1 py-0.5">
                        <span className="font-semibold">Job Site:</span> {costSheet.jobSite || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Dimensions Row - Excel Style */}
                  <div className="border-2 border-black mb-2">
                    <div className="bg-blue-100 px-1 py-0.5 font-bold border-b border-black text-[8px]">DIMENSIONS</div>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 px-1 py-0.5 text-center">Width</th>
                          <th className="border border-gray-400 px-1 py-0.5 text-center">Projection</th>
                          <th className="border border-gray-400 px-1 py-0.5 text-center">Height</th>
                          <th className="border border-gray-400 px-1 py-0.5 text-center">Valance</th>
                          <th className="border border-gray-400 px-1 py-0.5 text-center bg-yellow-100">Canopy Sq Ft</th>
                          <th className="border border-gray-400 px-1 py-0.5 text-center bg-yellow-100">Awning Lin Ft</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costSheet.products && costSheet.products.length > 0 ? (
                          costSheet.products.map((p, i) => (
                            <tr key={i}>
                              <td className="border border-gray-400 px-1 py-0.5 text-center">{p.width || 0}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-center">{p.projection || 0}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-center">{p.height || 0}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-center">{p.valance || 0}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-center bg-yellow-50">{(p.sqFt || 0).toFixed(2)}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-center bg-yellow-50">{(p.linFt || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 text-center">0</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-center">0</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-center">0</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-center">0</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-center bg-yellow-50">0.00</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-center bg-yellow-50">0.00</td>
                          </tr>
                        )}
                        <tr className="bg-gray-200 font-semibold">
                          <td colSpan={4} className="border border-gray-400 px-1 py-0.5 text-right">TOTALS:</td>
                          <td className="border border-gray-400 px-1 py-0.5 text-center bg-yellow-200">{(costSheet.canopySqFt || 0).toFixed(2)}</td>
                          <td className="border border-gray-400 px-1 py-0.5 text-center bg-yellow-200">{(costSheet.awningLinFt || 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Materials & Fabric Side by Side - Excel Style with Tax */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Materials */}
                    <div className="border-2 border-black">
                      <div className="bg-blue-100 px-1 py-0.5 font-bold border-b border-black text-[8px]">MATERIALS</div>
                      <table className="w-full border-collapse text-[8px]">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-400 px-1 py-0.5 text-left">Description</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-12">Qty</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-16">Unit $</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-16">Tax (9.75%)</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-12">Freight</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-16">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {costSheet.materials && costSheet.materials.length > 0 ? (
                            costSheet.materials.map((m, i) => {
                              const subtotal = m.qty * m.unitPrice;
                              const tax = subtotal * TAX_RATE;
                              return (
                                <tr key={i}>
                                  <td className="border border-gray-400 px-1 py-0.5">{m.description || '-'}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right">{m.qty}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(m.unitPrice)}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(tax)}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(m.freight || 0)}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right font-medium">{formatCurrency(m.total)}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="border border-gray-400 px-1 py-0.5 text-center italic">No materials entered</td>
                            </tr>
                          )}
                          <tr className="bg-blue-200 font-bold">
                            <td colSpan={5} className="border border-gray-400 px-1 py-0.5 text-right">TOTAL MATERIALS:</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalMaterials)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Fabric */}
                    <div className="border-2 border-black">
                      <div className="bg-purple-100 px-1 py-0.5 font-bold border-b border-black text-[8px]">FABRIC</div>
                      <table className="w-full border-collapse text-[8px]">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-400 px-1 py-0.5 text-left">Name</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-12">Yards</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-14">$/Yard</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-14">Tax (9.75%)</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-12">Freight</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-16">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {costSheet.fabricLines && costSheet.fabricLines.length > 0 ? (
                            costSheet.fabricLines.map((f, i) => {
                              const subtotal = f.yards * f.pricePerYard;
                              const tax = subtotal * TAX_RATE;
                              return (
                                <tr key={i}>
                                  <td className="border border-gray-400 px-1 py-0.5">{f.name || '-'}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right">{f.yards}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(f.pricePerYard)}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(tax)}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(f.freight || 0)}</td>
                                  <td className="border border-gray-400 px-1 py-0.5 text-right font-medium">{formatCurrency(f.total)}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="border border-gray-400 px-1 py-0.5 text-center italic">No fabric entered</td>
                            </tr>
                          )}
                          <tr className="bg-purple-200 font-bold">
                            <td colSpan={5} className="border border-gray-400 px-1 py-0.5 text-right">TOTAL FABRIC:</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalFabric)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Labor Tables - Show ALL types even if zeroed */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Fabrication Labor - ALL TYPES */}
                    <div className="border-2 border-black">
                      <div className="bg-gray-300 px-1 py-0.5 font-bold border-b border-black text-[8px]">FABRICATION LABOR HOURS</div>
                      <table className="w-full border-collapse text-[8px]">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-400 px-1 py-0.5 text-left">Type</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-12">Hours</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-12">People</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-16">Rate</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-16">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allFabLabor.map((l, i) => (
                            <tr key={i} className={l.hours === 0 ? 'text-gray-500' : ''}>
                              <td className="border border-gray-400 px-1 py-0.5">{l.type}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-right">{l.hours}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-right">{l.people}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(l.rate)}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(l.total)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-300 font-bold">
                            <td colSpan={4} className="border border-gray-400 px-1 py-0.5 text-right">FABRICATION TOTAL:</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalFabricationLabor)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Installation Labor - ALL TYPES */}
                    <div className="border-2 border-black">
                      <div className="bg-orange-200 px-1 py-0.5 font-bold border-b border-black text-[8px]">INSTALLATION LABOR HOURS</div>
                      <table className="w-full border-collapse text-[8px]">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-400 px-1 py-0.5 text-left">Type</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-12">Hours</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-12">People</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-16">Rate</th>
                            <th className="border border-gray-400 px-1 py-0.5 text-right w-16">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allInstallLabor.map((l, i) => (
                            <tr key={i} className={l.hours === 0 ? 'text-gray-500' : ''}>
                              <td className="border border-gray-400 px-1 py-0.5">{l.type}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-right">{l.hours}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-right">{l.people}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(l.rate)}</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(l.total)}</td>
                            </tr>
                          ))}
                          <tr className="bg-orange-300 font-bold">
                            <td colSpan={4} className="border border-gray-400 px-1 py-0.5 text-right">INSTALLATION TOTAL:</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalInstallationLabor)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Other Requirements & Pricing Summary Side by Side */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Other Requirements */}
                    <div className="border-2 border-black">
                      <div className="bg-orange-100 px-1 py-0.5 font-bold border-b border-black text-[8px]">OTHER REQUIREMENTS</div>
                      <table className="w-full border-collapse text-[8px]">
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Permit</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.permitCost || 0)}</td>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Engineering</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.engineeringCost || 0)}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Equipment</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.equipmentCost || 0)}</td>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Food</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.foodCost || 0)}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Drive Time</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right text-[7px]">{costSheet.driveTimeTrips || 0}×{costSheet.driveTimeHours || 0}hrs×{costSheet.driveTimePeople || 0}</td>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Drive Total</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.driveTimeTotal || 0)}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Mileage</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right text-[7px]">{costSheet.roundtripMiles || 0}mi×{costSheet.roundtripTrips || 0}</td>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Mileage Total</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.mileageTotal || 0)}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Hotel</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right text-[7px]">{costSheet.hotelNights || 0}n×{costSheet.hotelPeople || 0}ppl</td>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100 font-medium">Hotel Total</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.hotelTotal || 0)}</td>
                          </tr>
                          <tr className="bg-orange-200 font-bold">
                            <td colSpan={3} className="border border-gray-400 px-1 py-0.5 text-right">TOTAL OTHER:</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalOtherRequirements)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Pricing Summary - Excel Style with Markup Multiplier */}
                    <div className="border-2 border-black">
                      <div className="bg-green-200 px-1 py-0.5 font-bold border-b border-black text-[8px]">PRICING SUMMARY</div>
                      <table className="w-full border-collapse text-[8px]">
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-blue-50">Materials</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalMaterials)}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-purple-50">Fabric</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalFabric)}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-gray-100">Fabrication Labor</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalFabricationLabor)}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-orange-50">Installation Labor</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalInstallationLabor)}</td>
                          </tr>
                          <tr className="bg-gray-200 font-semibold">
                            <td className="border border-gray-400 px-1 py-0.5">Before Markup</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.subtotalBeforeMarkup)}</td>
                          </tr>
                          <tr className="bg-yellow-100">
                            <td className="border border-gray-400 px-1 py-0.5">Markup ({costSheet.markup.toFixed(2)})</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.subtotalBeforeMarkup * costSheet.markup)}</td>
                          </tr>
                          <tr className="bg-blue-200 font-bold">
                            <td className="border border-gray-400 px-1 py-0.5">Including Markup</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalWithMarkup)}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 bg-orange-50">Other Requirements</td>
                            <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.totalOtherRequirements)}</td>
                          </tr>
                          {costSheet.discountIncrease !== 0 && (
                            <tr>
                              <td className="border border-gray-400 px-1 py-0.5">Discount/Increase</td>
                              <td className="border border-gray-400 px-1 py-0.5 text-right">{formatCurrency(costSheet.discountIncrease)}</td>
                            </tr>
                          )}
                          <tr className="bg-green-400 font-bold text-[10px]">
                            <td className="border-2 border-black px-1 py-1">GRAND TOTAL</td>
                            <td className="border-2 border-black px-1 py-1 text-right">{formatCurrency(costSheet.totalPriceToClient)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="grid grid-cols-2 gap-0 text-[7px] mt-1">
                        <div className="border border-gray-400 px-1 py-0.5 text-center">
                          $/Sq Ft: {costSheet.pricePerSqFtPreDelivery ? formatCurrency(costSheet.pricePerSqFtPreDelivery) : '-'}
                        </div>
                        <div className="border border-gray-400 px-1 py-0.5 text-center">
                          $/Lin Ft: {costSheet.pricePerLinFtPreDelivery ? formatCurrency(costSheet.pricePerLinFtPreDelivery) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity/Audit Log - Always show section */}
                  <div className="border-2 border-black mb-2">
                    <div className="bg-gray-200 px-1 py-0.5 font-bold border-b border-black text-[8px]">AUDIT / ACTIVITY LOG</div>
                    <table className="w-full border-collapse text-[7px]">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 px-1 py-0.5 text-left w-24">Date/Time</th>
                          <th className="border border-gray-400 px-1 py-0.5 text-left w-20">User</th>
                          <th className="border border-gray-400 px-1 py-0.5 text-left w-20">Action</th>
                          <th className="border border-gray-400 px-1 py-0.5 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costSheet.activityLogs && costSheet.activityLogs.length > 0 ? (
                          costSheet.activityLogs.slice(0, 15).map((log, i) => (
                            <tr key={i}>
                              <td className="border border-gray-400 px-1 py-0.5">{new Date(log.createdAt).toLocaleString()}</td>
                              <td className="border border-gray-400 px-1 py-0.5">{log.user?.name || log.user?.email || '-'}</td>
                              <td className="border border-gray-400 px-1 py-0.5">{log.action}</td>
                              <td className="border border-gray-400 px-1 py-0.5">{log.description || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="border border-gray-400 px-1 py-0.5 text-center italic">No activity logged yet</td>
                          </tr>
                        )}
                        {costSheet.activityLogs && costSheet.activityLogs.length > 15 && (
                          <tr className="bg-gray-100">
                            <td colSpan={4} className="border border-gray-400 px-1 py-0.5 text-center font-medium">
                              + {costSheet.activityLogs.length - 15} more entries (see full log in app)
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Print Footer */}
                  <div className="border-t-2 border-black pt-1 text-[7px] text-gray-600 flex justify-between">
                    <span>Universal Awning & Canopy | Cost Sheet ID: {costSheet.id}</span>
                    <span>Created: {new Date(costSheet.createdAt).toLocaleDateString()} | Printed: {new Date().toLocaleDateString()}</span>
                  </div>
                </>
              );
            })()}
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

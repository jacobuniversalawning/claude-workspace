'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCT_CATEGORIES, LABOR_RATES, DEFAULTS } from '@/lib/constants';
import { formatCurrency } from '@/lib/calculations';

interface MaterialLine {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  salesTax: number;
  freight: number;
  total: number;
}

interface FabricLine {
  id: string;
  name: string;
  yards: number;
  pricePerYard: number;
  salesTax: number;
  freight: number;
  total: number;
}

interface LaborLine {
  id: string;
  type: string;
  hours: number;
  people: number;
  rate: number;
  total: number;
  isFabrication: boolean;
}

interface RecapLine {
  id: string;
  name: string;
  width: number;
  length: number;
  fabricYard: number;
  linearFt: number;
  sqFt: number;
}

interface FormData {
  inquiryDate: string;
  dueDate: string;
  category: string;
  customer: string;
  salesRep: string;
  project: string;
  jobSite: string;
}

interface Analytics {
  byCategory: Array<{
    category: string;
    wonAvgPricePerSqFt: number;
    wonAvgPricePerLinFt: number;
  }>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const LABOR_TYPES = [
  { type: 'Survey', isFabrication: true },
  { type: 'Shop Drawings', isFabrication: true },
  { type: 'Sewing', isFabrication: true },
  { type: 'Graphics', isFabrication: true },
  { type: 'Assembly', isFabrication: true },
  { type: 'Welding', isFabrication: true },
  { type: 'Paint Labor', isFabrication: true },
  { type: 'Installation 1', isFabrication: false },
  { type: 'Installation 2', isFabrication: false },
];

export default function NewCostSheet() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Header Information
  const [formData, setFormData] = useState<FormData>({
    inquiryDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    category: PRODUCT_CATEGORIES[0],
    customer: '',
    salesRep: '',
    project: '',
    jobSite: '',
  });

  // Dimensions
  const [dimensions, setDimensions] = useState({
    width: '',
    projection: '',
    height: '',
    valance: '',
    canopySqFt: '',
    awningLinFt: '',
  });

  // Materials
  const [materials, setMaterials] = useState<MaterialLine[]>([
    { id: generateId(), description: '', qty: 0, unitPrice: 0, salesTax: DEFAULTS.SALES_TAX, freight: 0, total: 0 },
    { id: generateId(), description: '', qty: 0, unitPrice: 0, salesTax: DEFAULTS.SALES_TAX, freight: 0, total: 0 },
    { id: generateId(), description: '', qty: 0, unitPrice: 0, salesTax: DEFAULTS.SALES_TAX, freight: 0, total: 0 },
    { id: generateId(), description: '', qty: 0, unitPrice: 0, salesTax: DEFAULTS.SALES_TAX, freight: 0, total: 0 },
  ]);
  const [miscQty, setMiscQty] = useState(1);
  const [miscPrice, setMiscPrice] = useState(200);

  // Fabric
  const [fabricLines, setFabricLines] = useState<FabricLine[]>([
    { id: generateId(), name: 'Fabric 1', yards: 0, pricePerYard: 0, salesTax: DEFAULTS.SALES_TAX, freight: 0, total: 0 },
    { id: generateId(), name: 'Fabric 2', yards: 0, pricePerYard: 0, salesTax: DEFAULTS.SALES_TAX, freight: 0, total: 0 },
    { id: generateId(), name: 'Graphics', yards: 0, pricePerYard: 0, salesTax: DEFAULTS.SALES_TAX, freight: 0, total: 0 },
  ]);

  // Labor
  const [laborRate, setLaborRate] = useState<number>(LABOR_RATES.REGULAR);
  const [laborLines, setLaborLines] = useState<LaborLine[]>(
    LABOR_TYPES.map((lt) => ({
      id: generateId(),
      type: lt.type,
      hours: 0,
      people: 1,
      rate: LABOR_RATES.REGULAR,
      total: 0,
      isFabrication: lt.isFabrication,
    }))
  );

  // Markup
  const [markup, setMarkup] = useState<number>(DEFAULTS.MARKUP);

  // Other Requirements
  const [otherReqs, setOtherReqs] = useState<{
    permitCost: number;
    engineeringCost: number;
    equipmentCost: number;
    driveTimeTrips: number;
    driveTimeHours: number;
    driveTimePeople: number;
    driveTimeRate: number;
    roundtripMiles: number;
    mileageRate: number;
    hotelNights: number;
    hotelPeople: number;
    hotelRate: number;
    foodCost: number;
  }>({
    permitCost: 0,
    engineeringCost: 0,
    equipmentCost: 0,
    driveTimeTrips: 0,
    driveTimeHours: 0,
    driveTimePeople: 0,
    driveTimeRate: DEFAULTS.DRIVE_TIME_RATE,
    roundtripMiles: 0,
    mileageRate: DEFAULTS.MILEAGE_RATE,
    hotelNights: 0,
    hotelPeople: 0,
    hotelRate: 150,
    foodCost: 0,
  });

  // Discount/Increase
  const [discountIncrease, setDiscountIncrease] = useState(0);

  // Recap
  const [recapLines, setRecapLines] = useState<RecapLine[]>(
    Array.from({ length: 5 }, (_, i) => ({
      id: generateId(),
      name: `Awning/Canopy ${i + 1}`,
      width: 0,
      length: 0,
      fabricYard: 0,
      linearFt: 0,
      sqFt: 0,
    }))
  );

  // Fetch analytics for guardrails
  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(console.error);
  }, []);

  // Update labor rates when global rate changes
  useEffect(() => {
    setLaborLines((prev) =>
      prev.map((line) => ({
        ...line,
        rate: laborRate,
        total: line.hours * line.people * laborRate,
      }))
    );
  }, [laborRate]);

  // CALCULATIONS
  // Materials total
  const calculateMaterialTotal = (m: MaterialLine) => {
    const subtotal = m.qty * m.unitPrice;
    return subtotal + subtotal * m.salesTax + m.freight;
  };

  const materialsSubtotal = materials.reduce((sum, m) => {
    const subtotal = m.qty * m.unitPrice;
    return sum + subtotal + subtotal * m.salesTax + m.freight;
  }, 0);

  const miscSubtotal = miscQty * miscPrice;
  const miscTax = miscSubtotal * DEFAULTS.SALES_TAX;
  const miscTotal = miscSubtotal + miscTax;
  const totalMaterials = materialsSubtotal + miscTotal;

  // Fabric total
  const calculateFabricTotal = (f: FabricLine) => {
    const subtotal = f.yards * f.pricePerYard;
    return subtotal + subtotal * f.salesTax + f.freight;
  };

  const totalFabric = fabricLines.reduce((sum, f) => {
    const subtotal = f.yards * f.pricePerYard;
    return sum + subtotal + subtotal * f.salesTax + f.freight;
  }, 0);

  // Labor totals
  const calculateLaborTotal = (l: LaborLine) => l.hours * l.people * l.rate;

  const totalFabricationLabor = laborLines
    .filter((l) => l.isFabrication)
    .reduce((sum, l) => sum + l.hours * l.people * l.rate, 0);

  const totalInstallationLabor = laborLines
    .filter((l) => !l.isFabrication)
    .reduce((sum, l) => sum + l.hours * l.people * l.rate, 0);

  const totalLabor = totalFabricationLabor + totalInstallationLabor;
  const totalLaborHours = laborLines.reduce((sum, l) => sum + l.hours * l.people, 0);

  // Subtotal before markup
  const subtotalBeforeMarkup = totalMaterials + totalFabric + totalLabor;
  const markupAmount = subtotalBeforeMarkup * markup;
  const totalWithMarkup = subtotalBeforeMarkup + markupAmount;

  // Other Requirements
  const driveTimeTotal =
    otherReqs.driveTimeTrips * otherReqs.driveTimeHours * otherReqs.driveTimePeople * otherReqs.driveTimeRate;
  const mileageTotal = otherReqs.roundtripMiles * otherReqs.driveTimeTrips * otherReqs.mileageRate;
  const hotelTotal = otherReqs.hotelNights * otherReqs.hotelPeople * otherReqs.hotelRate;
  const totalOtherRequirements =
    otherReqs.permitCost +
    otherReqs.engineeringCost +
    otherReqs.equipmentCost +
    driveTimeTotal +
    mileageTotal +
    hotelTotal +
    otherReqs.foodCost;

  // Final totals
  const totalWithOtherReqs = totalWithMarkup + totalOtherRequirements;
  const grandTotal = totalWithOtherReqs;
  const totalPriceToClient = grandTotal + discountIncrease;

  // Pricing metrics (PRE-DELIVERY - excludes Other Requirements)
  const canopySqFt = parseFloat(dimensions.canopySqFt) || 0;
  const awningLinFt = parseFloat(dimensions.awningLinFt) || 0;
  const pricePerSqFtPreDelivery = canopySqFt > 0 ? totalWithMarkup / canopySqFt : null;
  const pricePerLinFtPreDelivery = awningLinFt > 0 ? totalWithMarkup / awningLinFt : null;

  // POST-DELIVERY (includes Other Requirements)
  const pricePerSqFtPostDelivery = canopySqFt > 0 ? totalPriceToClient / canopySqFt : null;
  const pricePerLinFtPostDelivery = awningLinFt > 0 ? totalPriceToClient / awningLinFt : null;

  // Guardrails - compare to weighted averages
  const categoryAnalytics = analytics?.byCategory.find((c) => c.category === formData.category);
  const avgSqFtPrice = categoryAnalytics?.wonAvgPricePerSqFt || 0;
  const avgLinFtPrice = categoryAnalytics?.wonAvgPricePerLinFt || 0;

  const getGuardrailColor = (currentPrice: number | null, avgPrice: number): string => {
    if (!currentPrice || avgPrice === 0) return 'bg-gray-100';
    const diff = (currentPrice - avgPrice) / avgPrice;
    if (diff > 0.15) return 'bg-red-100 border-red-400'; // Too high (>15% above avg)
    if (diff < -0.15) return 'bg-blue-100 border-blue-400'; // Too low (<15% below avg)
    return 'bg-green-100 border-green-400'; // In the green zone
  };

  const getGuardrailText = (currentPrice: number | null, avgPrice: number): string => {
    if (!currentPrice || avgPrice === 0) return 'No data';
    const diff = ((currentPrice - avgPrice) / avgPrice) * 100;
    if (diff > 15) return `${diff.toFixed(0)}% above avg - HIGH`;
    if (diff < -15) return `${Math.abs(diff).toFixed(0)}% below avg - LOW`;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}% - GOOD`;
  };

  // Handlers
  const updateMaterial = (id: string, field: keyof MaterialLine, value: any) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const addMaterialLine = () => {
    setMaterials((prev) => [
      ...prev,
      { id: generateId(), description: '', qty: 0, unitPrice: 0, salesTax: DEFAULTS.SALES_TAX, freight: 0, total: 0 },
    ]);
  };

  const updateFabric = (id: string, field: keyof FabricLine, value: any) => {
    setFabricLines((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const updateLabor = (id: string, field: keyof LaborLine, value: any) => {
    setLaborLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const updateRecap = (id: string, field: keyof RecapLine, value: any) => {
    setRecapLines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        inquiryDate: formData.inquiryDate,
        dueDate: formData.dueDate,
        category: formData.category,
        customer: formData.customer,
        salesRep: formData.salesRep,
        project: formData.project,
        jobSite: formData.jobSite,
        width: parseFloat(dimensions.width) || null,
        projection: parseFloat(dimensions.projection) || null,
        height: parseFloat(dimensions.height) || null,
        valance: parseFloat(dimensions.valance) || null,
        canopySqFt: canopySqFt || null,
        awningLinFt: awningLinFt || null,
        miscQty,
        miscPrice,
        salesTax: DEFAULTS.SALES_TAX,
        laborRate,
        totalMaterials,
        totalFabric,
        totalFabricationLabor,
        totalInstallationLabor,
        totalLabor,
        subtotalBeforeMarkup,
        markup,
        totalWithMarkup,
        permitCost: otherReqs.permitCost || null,
        engineeringCost: otherReqs.engineeringCost || null,
        equipmentCost: otherReqs.equipmentCost || null,
        driveTimeTrips: otherReqs.driveTimeTrips || null,
        driveTimeHours: otherReqs.driveTimeHours || null,
        driveTimePeople: otherReqs.driveTimePeople || null,
        driveTimeRate: otherReqs.driveTimeRate,
        driveTimeTotal,
        roundtripMiles: otherReqs.roundtripMiles || null,
        roundtripTrips: otherReqs.driveTimeTrips || null,
        mileageRate: otherReqs.mileageRate,
        mileageTotal,
        hotelNights: otherReqs.hotelNights || null,
        hotelPeople: otherReqs.hotelPeople || null,
        hotelRate: otherReqs.hotelRate || null,
        hotelTotal,
        foodCost: otherReqs.foodCost || null,
        totalOtherRequirements,
        totalWithOtherReqs,
        grandTotal,
        discountIncrease,
        totalPriceToClient,
        pricePerSqFt: pricePerSqFtPostDelivery,
        pricePerLinFt: pricePerLinFtPostDelivery,
        pricePerSqFtPreDelivery,
        pricePerLinFtPreDelivery,
        materials: materials
          .filter((m) => m.qty > 0 || m.description)
          .map((m) => ({
            description: m.description,
            qty: m.qty,
            unitPrice: m.unitPrice,
            salesTax: m.salesTax,
            freight: m.freight,
            total: calculateMaterialTotal(m),
          })),
        fabricLines: fabricLines
          .filter((f) => f.yards > 0)
          .map((f) => ({
            name: f.name,
            yards: f.yards,
            pricePerYard: f.pricePerYard,
            salesTax: f.salesTax,
            freight: f.freight,
            total: calculateFabricTotal(f),
          })),
        laborLines: laborLines
          .filter((l) => l.hours > 0)
          .map((l) => ({
            type: l.type,
            hours: l.hours,
            people: l.people,
            rate: l.rate,
            total: calculateLaborTotal(l),
            isFabrication: l.isFabrication,
          })),
        recapLines: recapLines
          .filter((r) => r.sqFt > 0 || r.linearFt > 0)
          .map((r) => ({
            name: r.name,
            width: r.width || null,
            length: r.length || null,
            fabricYard: r.fabricYard || null,
            linearFt: r.linearFt || null,
            sqFt: r.sqFt || null,
          })),
      };

      const response = await fetch('/api/costsheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/');
      } else {
        alert('Error saving cost sheet');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving cost sheet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Form - Left Side (3 columns) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Universal Awning & Canopy</h1>
                    <p className="text-gray-600">Cost Sheet</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Back to Dashboard
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Date</label>
                    <input
                      type="date"
                      value={formData.inquiryDate}
                      onChange={(e) => setFormData({ ...formData, inquiryDate: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      required
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                    <input
                      type="text"
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rep</label>
                    <input
                      type="text"
                      value={formData.salesRep}
                      onChange={(e) => setFormData({ ...formData, salesRep: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <input
                      type="text"
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Site</label>
                    <input
                      type="text"
                      value={formData.jobSite}
                      onChange={(e) => setFormData({ ...formData, jobSite: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Dimensions</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Projection</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.projection}
                      onChange={(e) => setDimensions({ ...dimensions, projection: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.valance}
                      onChange={(e) => setDimensions({ ...dimensions, valance: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Canopy Sq Ft</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.canopySqFt}
                      onChange={(e) => setDimensions({ ...dimensions, canopySqFt: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-yellow-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Awning Lin Ft</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.awningLinFt}
                      onChange={(e) => setDimensions({ ...dimensions, awningLinFt: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-yellow-50"
                    />
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Materials</h2>
                  <button
                    type="button"
                    onClick={addMaterialLine}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Row
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-600">Description</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Qty</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-24">Unit Price</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Tax (9.75%)</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Freight</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => (
                        <tr key={m.id} className="border-t">
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={m.description}
                              onChange={(e) => updateMaterial(m.id, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1"
                              placeholder="Material description"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={m.qty || ''}
                              onChange={(e) => updateMaterial(m.id, 'qty', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={m.unitPrice || ''}
                              onChange={(e) => updateMaterial(m.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600">
                            {formatCurrency(m.qty * m.unitPrice * DEFAULTS.SALES_TAX)}
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={m.freight || ''}
                              onChange={(e) => updateMaterial(m.id, 'freight', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1 text-right font-medium">
                            {formatCurrency(calculateMaterialTotal(m))}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-gray-50">
                        <td className="px-2 py-1 font-medium">Misc</td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            step="1"
                            value={miscQty}
                            onChange={(e) => setMiscQty(parseInt(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            step="0.01"
                            value={miscPrice}
                            onChange={(e) => setMiscPrice(parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                          />
                        </td>
                        <td className="px-2 py-1 text-right text-gray-600">
                          {formatCurrency(miscTax)}
                        </td>
                        <td className="px-2 py-1 text-right">-</td>
                        <td className="px-2 py-1 text-right font-medium">{formatCurrency(miscTotal)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-blue-50">
                        <td colSpan={5} className="px-2 py-2 text-right font-semibold">
                          Total Materials:
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-blue-700">
                          {formatCurrency(totalMaterials)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Fabric */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Fabric</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-600">Name</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Yards</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-24">Price/Yard</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Tax (9.75%)</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Freight</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fabricLines.map((f) => (
                        <tr key={f.id} className="border-t">
                          <td className="px-2 py-1 font-medium">{f.name}</td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={f.yards || ''}
                              onChange={(e) => updateFabric(f.id, 'yards', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={f.pricePerYard || ''}
                              onChange={(e) => updateFabric(f.id, 'pricePerYard', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600">
                            {formatCurrency(f.yards * f.pricePerYard * DEFAULTS.SALES_TAX)}
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={f.freight || ''}
                              onChange={(e) => updateFabric(f.id, 'freight', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1 text-right font-medium">
                            {formatCurrency(calculateFabricTotal(f))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-blue-50">
                        <td colSpan={5} className="px-2 py-2 text-right font-semibold">
                          Total Fabric:
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-blue-700">
                          {formatCurrency(totalFabric)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Labor */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Labor Hours</h2>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Rate:</label>
                    <select
                      value={laborRate}
                      onChange={(e) => setLaborRate(parseFloat(e.target.value))}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      <option value={LABOR_RATES.AGGRESSIVE}>Aggressive (${LABOR_RATES.AGGRESSIVE}/hr)</option>
                      <option value={LABOR_RATES.REGULAR}>Regular (${LABOR_RATES.REGULAR}/hr)</option>
                      <option value={LABOR_RATES.PREVAILING_WAGE}>Prevailing Wage (${LABOR_RATES.PREVAILING_WAGE}/hr)</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-600">Type</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Hours</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">People</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-24">Rate</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laborLines.filter((l) => l.isFabrication).map((l) => (
                        <tr key={l.id} className="border-t">
                          <td className="px-2 py-1 font-medium">{l.type}</td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.5"
                              value={l.hours || ''}
                              onChange={(e) => updateLabor(l.id, 'hours', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="1"
                              value={l.people || ''}
                              onChange={(e) => updateLabor(l.id, 'people', parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600">${laborRate.toFixed(2)}</td>
                          <td className="px-2 py-1 text-right font-medium">
                            {formatCurrency(l.hours * l.people * laborRate)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 bg-gray-100">
                        <td colSpan={4} className="px-2 py-2 text-right font-semibold">
                          Total Fabrication Labor:
                        </td>
                        <td className="px-2 py-2 text-right font-bold">
                          {formatCurrency(totalFabricationLabor)}
                        </td>
                      </tr>
                      {laborLines.filter((l) => !l.isFabrication).map((l) => (
                        <tr key={l.id} className="border-t bg-orange-50">
                          <td className="px-2 py-1 font-medium">{l.type}</td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.5"
                              value={l.hours || ''}
                              onChange={(e) => updateLabor(l.id, 'hours', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="1"
                              value={l.people || ''}
                              onChange={(e) => updateLabor(l.id, 'people', parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600">${laborRate.toFixed(2)}</td>
                          <td className="px-2 py-1 text-right font-medium">
                            {formatCurrency(l.hours * l.people * laborRate)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 bg-orange-100">
                        <td colSpan={4} className="px-2 py-2 text-right font-semibold">
                          Total Installation Labor:
                        </td>
                        <td className="px-2 py-2 text-right font-bold">
                          {formatCurrency(totalInstallationLabor)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-blue-50">
                        <td colSpan={3} className="px-2 py-2 text-right font-semibold">
                          Total Labor:
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          {totalLaborHours.toFixed(1)} hrs
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-blue-700">
                          {formatCurrency(totalLabor)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Markup Section */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Subtotal & Markup</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Total Materials, Fabric & Labor
                    </label>
                    <div className="text-xl font-bold">{formatCurrency(subtotalBeforeMarkup)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Markup (0.8 = 80%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={markup}
                      onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="bg-blue-50 p-4 rounded border-2 border-blue-200">
                    <label className="block text-sm font-medium text-blue-600 mb-1">
                      Total with Markup
                    </label>
                    <div className="text-xl font-bold text-blue-700">{formatCurrency(totalWithMarkup)}</div>
                  </div>
                </div>
              </div>

              {/* Other Requirements */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">Other Requirements</h2>
                <p className="text-sm text-gray-500 mb-4">Site-specific costs (excluded from pre-delivery pricing averages)</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">O/S Permit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherReqs.permitCost || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, permitCost: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Engineering</label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherReqs.engineeringCost || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, engineeringCost: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherReqs.equipmentCost || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, equipmentCost: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Food</label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherReqs.foodCost || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, foodCost: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded">
                  <div className="col-span-2 md:col-span-5">
                    <span className="text-sm font-semibold text-gray-700">Drive Time</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Trips</label>
                    <input
                      type="number"
                      value={otherReqs.driveTimeTrips || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, driveTimeTrips: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hours/Trip</label>
                    <input
                      type="number"
                      step="0.5"
                      value={otherReqs.driveTimeHours || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, driveTimeHours: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">People</label>
                    <input
                      type="number"
                      value={otherReqs.driveTimePeople || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, driveTimePeople: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Rate/hr</label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherReqs.driveTimeRate}
                      onChange={(e) => setOtherReqs({ ...otherReqs, driveTimeRate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Total</label>
                    <div className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-medium">
                      {formatCurrency(driveTimeTotal)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
                  <div className="col-span-2 md:col-span-4">
                    <span className="text-sm font-semibold text-gray-700">Mileage</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Roundtrip Miles</label>
                    <input
                      type="number"
                      step="0.1"
                      value={otherReqs.roundtripMiles || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, roundtripMiles: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Rate/Mile</label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherReqs.mileageRate}
                      onChange={(e) => setOtherReqs({ ...otherReqs, mileageRate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Total Mileage</label>
                    <div className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-medium">
                      {formatCurrency(mileageTotal)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
                  <div className="col-span-2 md:col-span-4">
                    <span className="text-sm font-semibold text-gray-700">Hotel</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nights</label>
                    <input
                      type="number"
                      value={otherReqs.hotelNights || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, hotelNights: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">People</label>
                    <input
                      type="number"
                      value={otherReqs.hotelPeople || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, hotelPeople: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Rate/Night</label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherReqs.hotelRate || ''}
                      onChange={(e) => setOtherReqs({ ...otherReqs, hotelRate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Total Hotel</label>
                    <div className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-medium">
                      {formatCurrency(hotelTotal)}
                    </div>
                  </div>
                </div>

                <div className="text-right bg-orange-50 p-4 rounded">
                  <span className="text-lg font-semibold text-gray-700 mr-4">Total Other Requirements:</span>
                  <span className="text-xl font-bold text-orange-600">{formatCurrency(totalOtherRequirements)}</span>
                </div>
              </div>

              {/* Recap */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Recap</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-600">Name</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Width</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Length</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-24">Fabric Yds</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Linear Ft</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 w-20">Sq Ft</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recapLines.map((r, idx) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={r.name}
                              onChange={(e) => updateRecap(r.id, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={r.width || ''}
                              onChange={(e) => updateRecap(r.id, 'width', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={r.length || ''}
                              onChange={(e) => updateRecap(r.id, 'length', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={r.fabricYard || ''}
                              onChange={(e) => updateRecap(r.id, 'fabricYard', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={r.linearFt || ''}
                              onChange={(e) => updateRecap(r.id, 'linearFt', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              step="0.01"
                              value={r.sqFt || ''}
                              onChange={(e) => updateRecap(r.id, 'sqFt', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-gray-50">
                        <td className="px-2 py-2 font-semibold">Totals</td>
                        <td className="px-2 py-2 text-right font-medium">
                          {recapLines.reduce((s, r) => s + (r.width || 0), 0).toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          {recapLines.reduce((s, r) => s + (r.length || 0), 0).toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          {recapLines.reduce((s, r) => s + (r.fabricYard || 0), 0).toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          {recapLines.reduce((s, r) => s + (r.linearFt || 0), 0).toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          {recapLines.reduce((s, r) => s + (r.sqFt || 0), 0).toFixed(1)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {saving ? 'Saving...' : 'Save Cost Sheet'}
                </button>
              </div>
            </div>

            {/* Right Sidebar - Pricing Summary & Guardrails */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* Pre-Delivery Pricing */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Pre-Delivery Pricing
                  </h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded border-2 ${getGuardrailColor(pricePerSqFtPreDelivery, avgSqFtPrice)}`}>
                      <div className="text-xs text-gray-600 mb-1">Price per Sq Ft</div>
                      <div className="text-2xl font-bold">
                        {pricePerSqFtPreDelivery ? formatCurrency(pricePerSqFtPreDelivery) : '-'}
                      </div>
                      {avgSqFtPrice > 0 && (
                        <div className="text-xs mt-1">
                          Avg: {formatCurrency(avgSqFtPrice)} | {getGuardrailText(pricePerSqFtPreDelivery, avgSqFtPrice)}
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded border-2 ${getGuardrailColor(pricePerLinFtPreDelivery, avgLinFtPrice)}`}>
                      <div className="text-xs text-gray-600 mb-1">Price per Lin Ft</div>
                      <div className="text-2xl font-bold">
                        {pricePerLinFtPreDelivery ? formatCurrency(pricePerLinFtPreDelivery) : '-'}
                      </div>
                      {avgLinFtPrice > 0 && (
                        <div className="text-xs mt-1">
                          Avg: {formatCurrency(avgLinFtPrice)} | {getGuardrailText(pricePerLinFtPreDelivery, avgLinFtPrice)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Final Totals */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Final Totals
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Materials:</span>
                      <span className="font-medium">{formatCurrency(totalMaterials)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fabric:</span>
                      <span className="font-medium">{formatCurrency(totalFabric)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labor:</span>
                      <span className="font-medium">{formatCurrency(totalLabor)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotalBeforeMarkup)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Markup ({(markup * 100).toFixed(0)}%):</span>
                      <span className="font-medium">{formatCurrency(markupAmount)}</span>
                    </div>
                    <div className="flex justify-between bg-blue-50 p-2 rounded -mx-2">
                      <span className="font-semibold text-blue-700">With Markup:</span>
                      <span className="font-bold text-blue-700">{formatCurrency(totalWithMarkup)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Other Reqs:</span>
                      <span className="font-medium">{formatCurrency(totalOtherRequirements)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Grand Total:</span>
                      <span className="font-bold">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <label className="block text-xs text-gray-600 mb-1">Discount / Increase</label>
                    <input
                      type="number"
                      step="0.01"
                      value={discountIncrease || ''}
                      onChange={(e) => setDiscountIncrease(parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="+ or - amount"
                    />
                  </div>

                  <div className="mt-4 bg-green-50 p-3 rounded border-2 border-green-300">
                    <div className="text-xs text-green-600 mb-1">Total Price to Client</div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(totalPriceToClient)}
                    </div>
                  </div>
                </div>

                {/* Guardrails Legend */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Price Guardrails
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-400"></div>
                      <span>Good - within 15% of avg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-400"></div>
                      <span>High - over 15% above avg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400"></div>
                      <span>Low - over 15% below avg</span>
                    </div>
                    <p className="text-gray-500 mt-2">
                      Averages are weighted 3x towards won jobs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

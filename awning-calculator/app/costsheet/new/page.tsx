'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCT_CATEGORIES, LABOR_RATES, DEFAULTS } from '@/lib/constants';
import { formatCurrency, calculatePricePerSqFt, calculatePricePerLinFt } from '@/lib/calculations';

export default function NewCostSheet() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    inquiryDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    category: PRODUCT_CATEGORIES[0],
    customer: '',
    salesRep: '',
    project: '',
    jobSite: '',
    width: '',
    projection: '',
    height: '',
    valance: '',
    canopySqFt: '',
    awningLinFt: '',
    miscQty: '1',
    miscPrice: '200',
    salesTax: DEFAULTS.SALES_TAX,
    laborRate: DEFAULTS.LABOR_RATE,
    surveyHours: '4',
    surveyPeople: '1',
    markup: DEFAULTS.MARKUP,
    driveTimeTrips: '',
    driveTimeHours: '',
    driveTimePeople: '',
    roundtripMiles: '',
  });

  const [saving, setSaving] = useState(false);

  // Calculate totals
  const miscQty = parseFloat(formData.miscQty) || 0;
  const miscPrice = parseFloat(formData.miscPrice) || 0;
  const miscSubtotal = miscQty * miscPrice;
  const miscTax = miscSubtotal * formData.salesTax;
  const totalMaterials = miscSubtotal + miscTax;

  const surveyHours = parseFloat(formData.surveyHours) || 0;
  const surveyPeople = parseFloat(formData.surveyPeople) || 1;
  const surveyTotal = surveyHours * surveyPeople * formData.laborRate;
  const totalLabor = surveyTotal;

  const subtotalBeforeMarkup = totalMaterials + totalLabor;
  const markupAmount = subtotalBeforeMarkup * formData.markup;
  const totalWithMarkup = subtotalBeforeMarkup + markupAmount;

  // Drive time (Other Requirements)
  const driveTimeTrips = parseFloat(formData.driveTimeTrips) || 0;
  const driveTimeHours = parseFloat(formData.driveTimeHours) || 0;
  const driveTimePeople = parseFloat(formData.driveTimePeople) || 0;
  const driveTimeTotal = driveTimeTrips * driveTimeHours * driveTimePeople * DEFAULTS.DRIVE_TIME_RATE;

  const roundtripMiles = parseFloat(formData.roundtripMiles) || 0;
  const mileageTotal = roundtripMiles * (driveTimeTrips || 0) * DEFAULTS.MILEAGE_RATE;

  const totalOtherRequirements = driveTimeTotal + mileageTotal;
  const totalWithOtherReqs = totalWithMarkup + totalOtherRequirements;

  const grandTotal = totalWithOtherReqs;
  const totalPriceToClient = grandTotal;

  // Pricing metrics
  const canopySqFt = parseFloat(formData.canopySqFt) || 0;
  const awningLinFt = parseFloat(formData.awningLinFt) || 0;
  const pricePerSqFtPreDelivery = calculatePricePerSqFt(totalWithMarkup, canopySqFt);
  const pricePerLinFtPreDelivery = calculatePricePerLinFt(totalWithMarkup, awningLinFt);

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
        width: parseFloat(formData.width) || null,
        projection: parseFloat(formData.projection) || null,
        height: parseFloat(formData.height) || null,
        valance: parseFloat(formData.valance) || null,
        canopySqFt: canopySqFt || null,
        awningLinFt: awningLinFt || null,
        miscQty: miscQty || null,
        miscPrice: miscPrice || null,
        salesTax: formData.salesTax,
        laborRate: formData.laborRate,
        totalMaterials,
        totalFabric: 0,
        totalFabricationLabor: surveyTotal,
        totalInstallationLabor: 0,
        totalLabor,
        subtotalBeforeMarkup,
        markup: formData.markup,
        totalWithMarkup,
        driveTimeTrips: driveTimeTrips || null,
        driveTimeHours: driveTimeHours || null,
        driveTimePeople: driveTimePeople || null,
        driveTimeRate: DEFAULTS.DRIVE_TIME_RATE,
        driveTimeTotal,
        roundtripMiles: roundtripMiles || null,
        roundtripTrips: driveTimeTrips || null,
        mileageRate: DEFAULTS.MILEAGE_RATE,
        mileageTotal,
        totalOtherRequirements,
        totalWithOtherReqs,
        grandTotal,
        totalPriceToClient,
        pricePerSqFtPreDelivery,
        pricePerLinFtPreDelivery,
        materials: [],
        fabricLines: [],
        laborLines: [
          {
            type: 'Survey',
            hours: surveyHours,
            people: surveyPeople,
            rate: formData.laborRate,
            total: surveyTotal,
            isFabrication: true,
          },
        ],
        recapLines: [],
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">New Cost Sheet</h1>
            <p className="text-gray-600 mt-1">Universal Awning & Canopy</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inquiry Date
                </label>
                <input
                  type="date"
                  value={formData.inquiryDate}
                  onChange={(e) => setFormData({ ...formData, inquiryDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Rep
                </label>
                <input
                  type="text"
                  value={formData.salesRep}
                  onChange={(e) => setFormData({ ...formData, salesRep: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <input
                  type="text"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Site
              </label>
              <input
                type="text"
                value={formData.jobSite}
                onChange={(e) => setFormData({ ...formData, jobSite: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            {/* Dimensions */}
            <div className="border-t pt-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Dimensions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projection
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.projection}
                    onChange={(e) => setFormData({ ...formData, projection: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canopy Sq Ft
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.canopySqFt}
                    onChange={(e) => setFormData({ ...formData, canopySqFt: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Awning Lin Ft
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.awningLinFt}
                    onChange={(e) => setFormData({ ...formData, awningLinFt: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Materials */}
            <div className="border-t pt-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Materials (Simplified)</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Misc Qty
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.miscQty}
                    onChange={(e) => setFormData({ ...formData, miscQty: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Misc Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.miscPrice}
                    onChange={(e) => setFormData({ ...formData, miscPrice: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Materials
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(totalMaterials)}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Labor */}
            <div className="border-t pt-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Labor</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Survey Hours
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.surveyHours}
                    onChange={(e) => setFormData({ ...formData, surveyHours: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    People
                  </label>
                  <input
                    type="number"
                    value={formData.surveyPeople}
                    onChange={(e) => setFormData({ ...formData, surveyPeople: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labor Rate
                  </label>
                  <select
                    value={formData.laborRate}
                    onChange={(e) =>
                      setFormData({ ...formData, laborRate: parseFloat(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value={LABOR_RATES.AGGRESSIVE}>
                      Aggressive (${LABOR_RATES.AGGRESSIVE}/hr)
                    </option>
                    <option value={LABOR_RATES.REGULAR}>
                      Regular (${LABOR_RATES.REGULAR}/hr)
                    </option>
                    <option value={LABOR_RATES.PREVAILING_WAGE}>
                      Prevailing Wage (${LABOR_RATES.PREVAILING_WAGE}/hr)
                    </option>
                  </select>
                </div>
              </div>
              <div className="text-right text-lg font-semibold">
                Total Labor: {formatCurrency(totalLabor)}
              </div>
            </div>

            {/* Markup */}
            <div className="border-t pt-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Subtotal & Markup</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtotal Before Markup
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(subtotalBeforeMarkup)}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Markup (0.8 = 80%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.markup}
                    onChange={(e) =>
                      setFormData({ ...formData, markup: parseFloat(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total with Markup
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(totalWithMarkup)}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-blue-50 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Other Requirements (Drive Time, etc.) */}
            <div className="border-t pt-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Other Requirements (Site-Specific)</h2>
              <p className="text-sm text-gray-600 mb-4">
                These costs are excluded from pricing averages
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drive Time Trips
                  </label>
                  <input
                    type="number"
                    value={formData.driveTimeTrips}
                    onChange={(e) =>
                      setFormData({ ...formData, driveTimeTrips: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours per Trip
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.driveTimeHours}
                    onChange={(e) =>
                      setFormData({ ...formData, driveTimeHours: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    People
                  </label>
                  <input
                    type="number"
                    value={formData.driveTimePeople}
                    onChange={(e) =>
                      setFormData({ ...formData, driveTimePeople: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roundtrip Miles
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.roundtripMiles}
                    onChange={(e) =>
                      setFormData({ ...formData, roundtripMiles: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <div className="mt-4 text-right text-lg font-semibold">
                Total Other Requirements: {formatCurrency(totalOtherRequirements)}
              </div>
            </div>

            {/* Final Totals */}
            <div className="border-t pt-6 mb-8 bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Final Totals</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Grand Total:</span>
                  <span className="font-bold">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per Sq Ft (Pre-Delivery):</span>
                  <span className="font-semibold text-blue-600">
                    {pricePerSqFtPreDelivery
                      ? formatCurrency(pricePerSqFtPreDelivery)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price per Lin Ft (Pre-Delivery):</span>
                  <span className="font-semibold text-blue-600">
                    {pricePerLinFtPreDelivery
                      ? formatCurrency(pricePerLinFtPreDelivery)
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Cost Sheet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

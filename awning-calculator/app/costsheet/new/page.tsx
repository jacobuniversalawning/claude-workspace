'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PRODUCT_CATEGORIES, LABOR_RATES, DEFAULTS } from '@/lib/constants';
import { formatCurrency } from '@/lib/calculations';

// Interfaces
interface ProductLine {
  id: string;
  name: string;
  width: number;
  projection: number;
  height: number;
  valance: number;
  sqFt: number;
  linFt: number;
}

interface MaterialLine {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  freight: number;
}

interface FabricLine {
  id: string;
  name: string;
  yards: number;
  pricePerYard: number;
  freight: number;
}

interface LaborLine {
  id: string;
  type: string;
  description: string;
  hours: number;
  people: number;
  rate: number;
  isFabrication: boolean;
}

interface DriveTimeLine {
  id: string;
  trips: number;
  hoursPerTrip: number;
  people: number;
  rate: number;
  description: string;
}

interface MileageLine {
  id: string;
  roundtripMiles: number;
  trips: number;
  rate: number;
  description: string;
}

interface HotelLine {
  id: string;
  nights: number;
  people: number;
  rate: number;
  description: string;
}

interface FormData {
  inquiryDate: string;
  dueDate: string;
  category: string;
  customer: string;
  salesRep: string;
  project: string;
  jobSite: string;
  estimator: string;
}

interface Analytics {
  byCategory: Array<{
    category: string;
    wonAvgPricePerSqFt: number;
    wonAvgPricePerLinFt: number;
  }>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to calculate days from hours (8 hours per day)
const calculateDays = (hours: number): string => {
  if (!hours) return '';
  const days = hours / 8;
  if (days === Math.floor(days)) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  return `${days.toFixed(1)} days`;
};

const DEFAULT_LABOR_TYPES = [
  { type: 'Survey', isFabrication: true },
  { type: 'Shop Drawings', isFabrication: true },
  { type: 'Sewing', isFabrication: true },
  { type: 'Graphics', isFabrication: true },
  { type: 'Assembly', isFabrication: true },
  { type: 'Welding', isFabrication: true },
  { type: 'Paint Labor', isFabrication: true },
];

function CostSheetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    estimator: '',
  });

  // Products (dimensions only, category is at top level)
  const [products, setProducts] = useState<ProductLine[]>([
    { id: generateId(), name: 'Product 1', width: 0, projection: 0, height: 0, valance: 0, sqFt: 0, linFt: 0 },
  ]);

  // Materials
  const [materials, setMaterials] = useState<MaterialLine[]>([
    { id: generateId(), description: '', qty: 0, unitPrice: 0, freight: 0 },
  ]);
  const [miscQty, setMiscQty] = useState(1);
  const [miscPrice, setMiscPrice] = useState(200);
  const [materialsTaxRate, setMaterialsTaxRate] = useState<number>(DEFAULTS.SALES_TAX);

  // Fabric
  const [fabricLines, setFabricLines] = useState<FabricLine[]>([
    { id: generateId(), name: '', yards: 0, pricePerYard: 0, freight: 0 },
  ]);
  const [fabricTaxRate, setFabricTaxRate] = useState<number>(DEFAULTS.SALES_TAX);

  // Labor
  const [laborRate, setLaborRate] = useState<number>(LABOR_RATES.REGULAR);
  const [laborLines, setLaborLines] = useState<LaborLine[]>(
    DEFAULT_LABOR_TYPES.map((lt) => ({
      id: generateId(),
      type: lt.type,
      description: '',
      hours: 0,
      people: 1,
      rate: LABOR_RATES.REGULAR,
      isFabrication: lt.isFabrication,
    }))
  );

  // Installation (separate from fabrication labor)
  const [installLines, setInstallLines] = useState<LaborLine[]>([
    { id: generateId(), type: 'Installation 1', description: '', hours: 0, people: 1, rate: LABOR_RATES.REGULAR, isFabrication: false },
  ]);

  // Markup
  const [markup, setMarkup] = useState<number>(DEFAULTS.MARKUP);

  // Other Requirements
  const [permitCost, setPermitCost] = useState(0);
  const [engineeringCost, setEngineeringCost] = useState(0);
  const [equipmentCost, setEquipmentCost] = useState(0);
  const [foodCost, setFoodCost] = useState(0);

  const [driveTimeLines, setDriveTimeLines] = useState<DriveTimeLine[]>([
    { id: generateId(), trips: 0, hoursPerTrip: 0, people: 0, rate: DEFAULTS.DRIVE_TIME_RATE, description: '' },
  ]);

  const [mileageLines, setMileageLines] = useState<MileageLine[]>([
    { id: generateId(), roundtripMiles: 0, trips: 0, rate: DEFAULTS.MILEAGE_RATE, description: '' },
  ]);

  const [hotelLines, setHotelLines] = useState<HotelLine[]>([
    { id: generateId(), nights: 0, people: 0, rate: 150, description: '' },
  ]);

  const [finalPriceOverride, setFinalPriceOverride] = useState<number | null>(null);

  // Track if drive time has been manually edited
  const [driveTimeManuallyEdited, setDriveTimeManuallyEdited] = useState(false);
  const [mileageManuallyEdited, setMileageManuallyEdited] = useState(false);

  // Prevent scroll wheel from changing number inputs - only when focused
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number' && document.activeElement === target) {
        e.preventDefault();
      }
    };

    // Add event listener with passive: false to allow preventDefault
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Fetch analytics
  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(console.error);
  }, []);

  // Load existing data when editing
  useEffect(() => {
    if (editId) {
      const data = localStorage.getItem('costSheets');
      if (data) {
        const sheets = JSON.parse(data);
        const sheet = sheets.find((s: { id: string }) => s.id === editId);
        if (sheet) {
          setIsEditing(true);

          // Load form data
          setFormData({
            inquiryDate: sheet.inquiryDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            dueDate: sheet.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            category: sheet.category || PRODUCT_CATEGORIES[0],
            customer: sheet.customer || '',
            salesRep: sheet.salesRep || '',
            project: sheet.project || '',
            jobSite: sheet.jobSite || '',
            estimator: sheet.estimator || '',
          });

          // Load products
          if (sheet.products && sheet.products.length > 0) {
            setProducts(sheet.products.map((p: ProductLine) => ({
              id: generateId(),
              name: p.name || 'Product 1',
              width: p.width || 0,
              projection: p.projection || 0,
              height: p.height || 0,
              valance: p.valance || 0,
              sqFt: p.sqFt || 0,
              linFt: p.linFt || 0,
            })));
          }

          // Load materials
          if (sheet.materials && sheet.materials.length > 0) {
            setMaterials(sheet.materials.map((m: MaterialLine) => ({
              id: generateId(),
              description: m.description || '',
              qty: m.qty || 0,
              unitPrice: m.unitPrice || 0,
              freight: m.freight || 0,
            })));
          }

          // Load misc values
          if (sheet.miscQty !== undefined) setMiscQty(sheet.miscQty);
          if (sheet.miscPrice !== undefined) setMiscPrice(sheet.miscPrice);

          // Load fabric
          if (sheet.fabricLines && sheet.fabricLines.length > 0) {
            setFabricLines(sheet.fabricLines.map((f: FabricLine) => ({
              id: generateId(),
              name: f.name || '',
              yards: f.yards || 0,
              pricePerYard: f.pricePerYard || 0,
              freight: f.freight || 0,
            })));
          }

          // Load labor rate
          if (sheet.laborRate) setLaborRate(sheet.laborRate);

          // Load labor lines (fabrication and installation)
          if (sheet.laborLines && sheet.laborLines.length > 0) {
            const fabLabor = sheet.laborLines.filter((l: LaborLine) => l.isFabrication);
            const instLabor = sheet.laborLines.filter((l: LaborLine) => !l.isFabrication);

            if (fabLabor.length > 0) {
              setLaborLines(fabLabor.map((l: LaborLine) => ({
                id: generateId(),
                type: l.type || 'Custom',
                description: l.description || '',
                hours: l.hours || 0,
                people: l.people || 1,
                rate: l.rate || LABOR_RATES.REGULAR,
                isFabrication: true,
              })));
            }

            if (instLabor.length > 0) {
              setInstallLines(instLabor.map((l: LaborLine) => ({
                id: generateId(),
                type: l.type || 'Installation 1',
                description: l.description || '',
                hours: l.hours || 0,
                people: l.people || 1,
                rate: l.rate || LABOR_RATES.REGULAR,
                isFabrication: false,
              })));
            }
          }

          // Load markup
          if (sheet.markup !== undefined) setMarkup(sheet.markup);

          // Load other requirements
          if (sheet.permitCost !== undefined) setPermitCost(sheet.permitCost);
          if (sheet.engineeringCost !== undefined) setEngineeringCost(sheet.engineeringCost);
          if (sheet.equipmentCost !== undefined) setEquipmentCost(sheet.equipmentCost);
          if (sheet.foodCost !== undefined) setFoodCost(sheet.foodCost);

          // Load drive time
          if (sheet.driveTimeTrips || sheet.driveTimeHours || sheet.driveTimePeople) {
            setDriveTimeLines([{
              id: generateId(),
              trips: sheet.driveTimeTrips || 0,
              hoursPerTrip: sheet.driveTimeHours || 0,
              people: sheet.driveTimePeople || 0,
              rate: sheet.driveTimeRate || DEFAULTS.DRIVE_TIME_RATE,
              description: '',
            }]);
          }

          // Load mileage
          if (sheet.roundtripMiles || sheet.roundtripTrips) {
            setMileageLines([{
              id: generateId(),
              roundtripMiles: sheet.roundtripMiles || 0,
              trips: sheet.roundtripTrips || 0,
              rate: sheet.mileageRate || DEFAULTS.MILEAGE_RATE,
              description: '',
            }]);
          }

          // Load hotel
          if (sheet.hotelNights || sheet.hotelPeople) {
            setHotelLines([{
              id: generateId(),
              nights: sheet.hotelNights || 0,
              people: sheet.hotelPeople || 0,
              rate: sheet.hotelRate || 150,
              description: '',
            }]);
          }

          // Load final price override (or legacy discountIncrease for backwards compatibility)
          if (sheet.finalPriceOverride !== undefined) {
            setFinalPriceOverride(sheet.finalPriceOverride);
          } else if (sheet.discountIncrease !== undefined && sheet.discountIncrease !== 0) {
            // Legacy: convert old discount/increase to final price override
            const legacyTotal = (sheet.grandTotal || 0) + sheet.discountIncrease;
            setFinalPriceOverride(legacyTotal);
          }
        }
      }
    }
  }, [editId]);

  // Update labor rates when global rate changes
  useEffect(() => {
    setLaborLines((prev) => prev.map((line) => ({ ...line, rate: laborRate })));
    setInstallLines((prev) => prev.map((line) => ({ ...line, rate: laborRate })));
  }, [laborRate]);

  // Auto-populate drive time and mileage from install labor
  useEffect(() => {
    // Calculate total install days and max people from install labor
    const totalInstallHours = installLines.reduce((sum, l) => sum + l.hours, 0);
    const installDays = Math.ceil(totalInstallHours / 8); // Round up for trips
    const maxPeople = Math.max(...installLines.map(l => l.people), 0);

    // Only auto-populate if there's install labor data and fields haven't been manually edited
    if (installDays > 0 && maxPeople > 0) {
      if (!driveTimeManuallyEdited) {
        setDriveTimeLines(prev => [{
          ...prev[0],
          trips: installDays,
          people: maxPeople,
        }]);
      }

      if (!mileageManuallyEdited) {
        setMileageLines(prev => [{
          ...prev[0],
          trips: installDays,
        }]);
      }
    }
  }, [installLines, driveTimeManuallyEdited, mileageManuallyEdited]);

  // === PRODUCT FUNCTIONS ===
  const addProduct = () => {
    const num = products.length + 1;
    setProducts([...products, { id: generateId(), name: `${formData.category} ${num}`, width: 0, projection: 0, height: 0, valance: 0, sqFt: 0, linFt: 0 }]);
  };

  // Update all product names when category changes
  useEffect(() => {
    setProducts(prevProducts =>
      prevProducts.map((product, index) => ({
        ...product,
        name: `${formData.category} ${index + 1}`
      }))
    );
  }, [formData.category]);

  const removeProduct = (id: string) => {
    if (products.length > 1) setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof ProductLine, value: string | number) => {
    setProducts(products.map((p) => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        // Recalculate sqFt and linFt when dimensions change
        if (field === 'width' || field === 'projection' || field === 'height') {
          // Sq Ft = (width × projection) + (width × height) for canopy + drop
          updated.sqFt = Number(((updated.width * updated.projection) + (updated.width * updated.height)).toFixed(2));
          updated.linFt = Number((updated.width + updated.projection * 2).toFixed(2));
        }
        return updated;
      }
      return p;
    }));
  };

  // === MATERIAL FUNCTIONS ===
  const addMaterial = () => setMaterials([...materials, { id: generateId(), description: '', qty: 0, unitPrice: 0, freight: 0 }]);
  const removeMaterial = (id: string) => { if (materials.length > 1) setMaterials(materials.filter((m) => m.id !== id)); };
  const updateMaterial = (id: string, field: keyof MaterialLine, value: string | number) => {
    setMaterials(materials.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  // === FABRIC FUNCTIONS ===
  const addFabric = () => setFabricLines([...fabricLines, { id: generateId(), name: '', yards: 0, pricePerYard: 0, freight: 0 }]);
  const removeFabric = (id: string) => { if (fabricLines.length > 1) setFabricLines(fabricLines.filter((f) => f.id !== id)); };
  const updateFabric = (id: string, field: keyof FabricLine, value: string | number) => {
    setFabricLines(fabricLines.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  // === LABOR FUNCTIONS ===
  const addLabor = () => setLaborLines([...laborLines, { id: generateId(), type: 'Custom', description: '', hours: 0, people: 1, rate: laborRate, isFabrication: true }]);
  const removeLabor = (id: string) => { if (laborLines.length > 1) setLaborLines(laborLines.filter((l) => l.id !== id)); };
  const updateLabor = (id: string, field: keyof LaborLine, value: string | number | boolean) => {
    setLaborLines(laborLines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  // === INSTALL FUNCTIONS ===
  const addInstall = () => {
    const num = installLines.length + 1;
    setInstallLines([...installLines, { id: generateId(), type: `Installation ${num}`, description: '', hours: 0, people: 1, rate: laborRate, isFabrication: false }]);
  };
  const removeInstall = (id: string) => { if (installLines.length > 1) setInstallLines(installLines.filter((l) => l.id !== id)); };
  const updateInstall = (id: string, field: keyof LaborLine, value: string | number | boolean) => {
    setInstallLines(installLines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  // === DRIVE TIME FUNCTIONS ===
  const addDriveTime = () => setDriveTimeLines([...driveTimeLines, { id: generateId(), trips: 0, hoursPerTrip: 0, people: 0, rate: DEFAULTS.DRIVE_TIME_RATE, description: '' }]);
  const removeDriveTime = (id: string) => { if (driveTimeLines.length > 1) setDriveTimeLines(driveTimeLines.filter((d) => d.id !== id)); };
  const updateDriveTime = (id: string, field: keyof DriveTimeLine, value: string | number) => {
    // Mark as manually edited when user changes trips or people
    if (field === 'trips' || field === 'people') {
      setDriveTimeManuallyEdited(true);
    }
    setDriveTimeLines(driveTimeLines.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  // === MILEAGE FUNCTIONS ===
  const addMileage = () => setMileageLines([...mileageLines, { id: generateId(), roundtripMiles: 0, trips: 0, rate: DEFAULTS.MILEAGE_RATE, description: '' }]);
  const removeMileage = (id: string) => { if (mileageLines.length > 1) setMileageLines(mileageLines.filter((m) => m.id !== id)); };
  const updateMileage = (id: string, field: keyof MileageLine, value: string | number) => {
    // Mark as manually edited when user changes trips
    if (field === 'trips') {
      setMileageManuallyEdited(true);
    }
    setMileageLines(mileageLines.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  // === HOTEL FUNCTIONS ===
  const addHotel = () => setHotelLines([...hotelLines, { id: generateId(), nights: 0, people: 0, rate: 150, description: '' }]);
  const removeHotel = (id: string) => { if (hotelLines.length > 1) setHotelLines(hotelLines.filter((h) => h.id !== id)); };
  const updateHotel = (id: string, field: keyof HotelLine, value: string | number) => {
    setHotelLines(hotelLines.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  };

  // === CALCULATIONS ===
  const totalSqFt = products.reduce((sum, p) => sum + p.sqFt, 0);
  const totalLinFt = products.reduce((sum, p) => sum + p.linFt, 0);

  const calcMaterialTotal = (m: MaterialLine) => {
    const subtotal = m.qty * m.unitPrice;
    return subtotal + subtotal * materialsTaxRate + m.freight;
  };
  const materialsSubtotal = materials.reduce((sum, m) => sum + calcMaterialTotal(m), 0);
  const miscTotal = miscQty * miscPrice * (1 + materialsTaxRate);
  const totalMaterials = materialsSubtotal + miscTotal;

  const calcFabricTotal = (f: FabricLine) => {
    const subtotal = f.yards * f.pricePerYard;
    return subtotal + subtotal * fabricTaxRate + f.freight;
  };
  const totalFabric = fabricLines.reduce((sum, f) => sum + calcFabricTotal(f), 0);

  const calcLaborTotal = (l: LaborLine) => l.hours * l.people * l.rate;
  const totalFabricationLabor = laborLines.reduce((sum, l) => sum + calcLaborTotal(l), 0);
  const totalInstallationLabor = installLines.reduce((sum, l) => sum + calcLaborTotal(l), 0);
  const totalLabor = totalFabricationLabor + totalInstallationLabor;

  const subtotalBeforeMarkup = totalMaterials + totalFabric + totalLabor;
  const markupAmount = subtotalBeforeMarkup * markup;
  const totalWithMarkup = subtotalBeforeMarkup + markupAmount;

  const calcDriveTimeTotal = (d: DriveTimeLine) => d.trips * d.hoursPerTrip * d.people * d.rate;
  const totalDriveTime = driveTimeLines.reduce((sum, d) => sum + calcDriveTimeTotal(d), 0);

  const calcMileageTotal = (m: MileageLine) => m.roundtripMiles * m.trips * m.rate;
  const totalMileage = mileageLines.reduce((sum, m) => sum + calcMileageTotal(m), 0);

  const calcHotelTotal = (h: HotelLine) => h.nights * h.people * h.rate;
  const totalHotel = hotelLines.reduce((sum, h) => sum + calcHotelTotal(h), 0);

  const totalOtherRequirements = permitCost + engineeringCost + equipmentCost + foodCost + totalDriveTime + totalMileage + totalHotel;
  const grandTotal = totalWithMarkup + totalOtherRequirements;
  const totalPriceToClient = finalPriceOverride && finalPriceOverride > 0 ? finalPriceOverride : grandTotal;

  // When final price is overridden, recalculate per-unit prices based on the override
  const pricePerSqFtPreDelivery = totalSqFt > 0 ? totalWithMarkup / totalSqFt : null;
  const pricePerLinFtPreDelivery = totalLinFt > 0 ? totalWithMarkup / totalLinFt : null;
  const pricePerSqFtFinal = totalSqFt > 0 ? totalPriceToClient / totalSqFt : null;
  const pricePerLinFtFinal = totalLinFt > 0 ? totalPriceToClient / totalLinFt : null;

  // Calculate local averages from localStorage as fallback
  const getLocalAverages = (category: string) => {
    try {
      const localData = localStorage.getItem('costSheets');
      if (!localData) return { avgSqFt: 0, avgLinFt: 0 };

      const costSheets = JSON.parse(localData);
      const categorySheets = costSheets.filter((s: any) => s.category === category && s.outcome === 'Won');

      if (categorySheets.length === 0) {
        // If no won sheets, use all sheets for that category
        const allCategorySheets = costSheets.filter((s: any) => s.category === category);
        if (allCategorySheets.length === 0) return { avgSqFt: 0, avgLinFt: 0 };

        const sqFtPrices = allCategorySheets.filter((s: any) => s.pricePerSqFtPreDelivery).map((s: any) => s.pricePerSqFtPreDelivery);
        const linFtPrices = allCategorySheets.filter((s: any) => s.pricePerLinFtPreDelivery).map((s: any) => s.pricePerLinFtPreDelivery);

        return {
          avgSqFt: sqFtPrices.length > 0 ? sqFtPrices.reduce((a: number, b: number) => a + b, 0) / sqFtPrices.length : 0,
          avgLinFt: linFtPrices.length > 0 ? linFtPrices.reduce((a: number, b: number) => a + b, 0) / linFtPrices.length : 0,
        };
      }

      const sqFtPrices = categorySheets.filter((s: any) => s.pricePerSqFtPreDelivery).map((s: any) => s.pricePerSqFtPreDelivery);
      const linFtPrices = categorySheets.filter((s: any) => s.pricePerLinFtPreDelivery).map((s: any) => s.pricePerLinFtPreDelivery);

      return {
        avgSqFt: sqFtPrices.length > 0 ? sqFtPrices.reduce((a: number, b: number) => a + b, 0) / sqFtPrices.length : 0,
        avgLinFt: linFtPrices.length > 0 ? linFtPrices.reduce((a: number, b: number) => a + b, 0) / linFtPrices.length : 0,
      };
    } catch (error) {
      console.error('Error calculating local averages:', error);
      return { avgSqFt: 0, avgLinFt: 0 };
    }
  };

  const categoryAnalytics = analytics?.byCategory.find((c) => c.category === formData.category);
  const localAvgs = getLocalAverages(formData.category);

  // Use analytics if available, otherwise fall back to local averages
  const avgSqFtPrice = categoryAnalytics?.wonAvgPricePerSqFt || localAvgs.avgSqFt;
  const avgLinFtPrice = categoryAnalytics?.wonAvgPricePerLinFt || localAvgs.avgLinFt;

  const getGuardrailColor = (currentPrice: number | null, avgPrice: number): string => {
    if (!currentPrice || avgPrice === 0) return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
    const diff = (currentPrice - avgPrice) / avgPrice;
    if (diff > 0.15) return 'bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-600';
    if (diff < -0.15) return 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-600';
    return 'bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-600';
  };

  const getGuardrailText = (currentPrice: number | null, avgPrice: number): string => {
    if (!currentPrice || avgPrice === 0) return 'No data';
    const diff = ((currentPrice - avgPrice) / avgPrice) * 100;
    if (diff > 15) return `${diff.toFixed(0)}% HIGH`;
    if (diff < -15) return `${Math.abs(diff).toFixed(0)}% LOW`;
    return 'GOOD';
  };

  // === SUBMIT ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...formData,
      width: products[0]?.width || 0,
      projection: products[0]?.projection || 0,
      height: products[0]?.height || 0,
      valance: products[0]?.valance || 0,
      canopySqFt: totalSqFt,
      awningLinFt: totalLinFt,
      miscQty,
      miscPrice,
      laborRate,
      totalMaterials,
      totalFabric,
      totalFabricationLabor,
      totalInstallationLabor,
      totalLabor,
      subtotalBeforeMarkup,
      markup,
      totalWithMarkup,
      permitCost,
      engineeringCost,
      equipmentCost,
      driveTimeTrips: driveTimeLines[0]?.trips || 0,
      driveTimeHours: driveTimeLines[0]?.hoursPerTrip || 0,
      driveTimePeople: driveTimeLines[0]?.people || 0,
      driveTimeRate: driveTimeLines[0]?.rate || DEFAULTS.DRIVE_TIME_RATE,
      driveTimeTotal: totalDriveTime,
      roundtripMiles: mileageLines[0]?.roundtripMiles || 0,
      roundtripTrips: mileageLines[0]?.trips || 0,
      mileageRate: mileageLines[0]?.rate || DEFAULTS.MILEAGE_RATE,
      mileageTotal: totalMileage,
      hotelNights: hotelLines[0]?.nights || 0,
      hotelPeople: hotelLines[0]?.people || 0,
      hotelRate: hotelLines[0]?.rate || 150,
      hotelTotal: totalHotel,
      foodCost,
      totalOtherRequirements,
      totalWithOtherReqs: grandTotal,
      grandTotal,
      finalPriceOverride,
      totalPriceToClient,
      pricePerSqFt: pricePerSqFtFinal,
      pricePerLinFt: pricePerLinFtFinal,
      pricePerSqFtPreDelivery,
      pricePerLinFtPreDelivery,
      outcome: 'Unknown',
      products: products.map((p) => ({
        name: p.name,
        width: p.width,
        projection: p.projection,
        height: p.height,
        valance: p.valance,
        sqFt: p.sqFt,
        linFt: p.linFt,
      })),
      materials: materials.filter((m) => m.qty > 0 || m.description).map((m) => ({
        description: m.description,
        qty: m.qty,
        unitPrice: m.unitPrice,
        salesTax: DEFAULTS.SALES_TAX,
        freight: m.freight,
        total: calcMaterialTotal(m),
      })),
      fabricLines: fabricLines.filter((f) => f.yards > 0 || f.name).map((f) => ({
        name: f.name,
        yards: f.yards,
        pricePerYard: f.pricePerYard,
        salesTax: DEFAULTS.SALES_TAX,
        freight: f.freight,
        total: calcFabricTotal(f),
      })),
      laborLines: [...laborLines, ...installLines].filter((l) => l.hours > 0).map((l) => ({
        type: l.type,
        hours: l.hours,
        people: l.people,
        rate: l.rate,
        total: calcLaborTotal(l),
        isFabrication: l.isFabrication,
      })),
    };

    // Save to localStorage (primary storage until database is configured)
    try {
      const existingData = localStorage.getItem('costSheets');
      let costSheets = existingData ? JSON.parse(existingData) : [];

      if (isEditing && editId) {
        // Update existing sheet
        costSheets = costSheets.map((sheet: { id: string }) =>
          sheet.id === editId ? { ...payload, id: editId } : sheet
        );
        alert('Cost sheet updated successfully!');
      } else {
        // Add new sheet
        costSheets.unshift(payload);
        alert('Cost sheet saved successfully!');
      }

      localStorage.setItem('costSheets', JSON.stringify(costSheets));
      router.push('/');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Error saving cost sheet: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Common styles - Brand Identity with Sharp Corners & Smooth Animations
  const inputClass = "w-full border border-gray-300 dark:border-transparent rounded-input px-4 py-3 text-sm bg-white dark:bg-brand-surface-grey-dark text-gray-900 dark:text-brand-text-primary placeholder-gray-400 dark:placeholder-brand-text-muted focus:outline-none focus:border-blue-500 dark:focus:border-brand-google-blue transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-brand-text-secondary mb-1";
  const cardClass = "bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-6 transition-all duration-300";
  const deleteBtn = "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors duration-200";
  const addBtn = "px-6 py-2.5 bg-blue-600 dark:bg-brand-google-blue hover:bg-blue-700 dark:hover:bg-brand-google-blue-hover text-white rounded-button text-sm font-medium transition-all duration-200 hover:shadow-lg";

  // Helper function to get error class for People field when hours > 0 but people = 0
  const getPeopleFieldClass = (hours: number, people: number): string => {
    const hasError = hours > 0 && people === 0;
    if (hasError) {
      return inputClass + " text-right !border-red-500 dark:!border-red-500 !bg-red-50 dark:!bg-red-900/20";
    }
    return inputClass + " text-right";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-deep-black py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Header */}
              <div className={cardClass}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-h1 text-gray-900 dark:text-brand-text-primary">Universal Awning & Canopy</h1>
                    <p className="text-h2 text-gray-600 dark:text-brand-text-secondary">{isEditing ? 'Edit Cost Sheet' : 'New Cost Sheet'}</p>
                  </div>
                  <button type="button" onClick={() => router.push('/')} className="px-6 py-2.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-button text-sm font-medium transition-all duration-200 hover:shadow-lg">
                    Go back to Dashboard
                  </button>
                </div>

                {/* Row 1: Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Inquiry Date</label>
                    <input type="date" value={formData.inquiryDate} onChange={(e) => setFormData({ ...formData, inquiryDate: e.target.value })} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Due Date</label>
                    <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className={inputClass} required />
                  </div>
                </div>

                {/* Row 2: Customer, Sales Rep, Estimator */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>Customer</label>
                    <input type="text" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} className={inputClass} placeholder="Customer name" />
                  </div>
                  <div>
                    <label className={labelClass}>Sales Rep</label>
                    <input type="text" value={formData.salesRep} onChange={(e) => setFormData({ ...formData, salesRep: e.target.value })} className={inputClass} placeholder="Sales rep" />
                  </div>
                  <div>
                    <label className={labelClass}>Estimator</label>
                    <input type="text" value={formData.estimator} onChange={(e) => setFormData({ ...formData, estimator: e.target.value })} className={inputClass} placeholder="Estimator name" />
                  </div>
                </div>

                {/* Row 3: Project (1/3) and Job Site Address (2/3) */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>Project</label>
                    <input type="text" value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} className={inputClass} placeholder="Project name" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Job Site Address</label>
                    <input type="text" value={formData.jobSite} onChange={(e) => setFormData({ ...formData, jobSite: e.target.value })} className={inputClass} placeholder="Full job site address" />
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className={cardClass}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary mb-2">Products & Dimensions</h2>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-brand-text-secondary">Category:</label>
                      <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputClass + " max-w-xs"}>
                        {PRODUCT_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Applies to all products</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="border border-gray-200 dark:border-brand-border-subtle rounded-input p-4 bg-gray-50 dark:bg-brand-surface-grey-dark transition-all duration-200 hover:border-brand-text-muted">
                      <div className="flex justify-between items-center mb-3">
                        <input type="text" value={product.name} onChange={(e) => updateProduct(product.id, 'name', e.target.value)} className={inputClass + " w-48 pl-4 pr-3"} placeholder="Product name" />
                        {products.length > 1 && <button type="button" onClick={() => removeProduct(product.id)} className={deleteBtn + " ml-2"}>×</button>}
                      </div>

                      <div className="grid grid-cols-6 gap-3">
                        <div>
                          <label className={labelClass}>Width</label>
                          <input type="number" step="0.01" value={product.width || ''} onChange={(e) => updateProduct(product.id, 'width', parseFloat(e.target.value) || 0)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Projection</label>
                          <input type="number" step="0.01" value={product.projection || ''} onChange={(e) => updateProduct(product.id, 'projection', parseFloat(e.target.value) || 0)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Height</label>
                          <input type="number" step="0.01" value={product.height || ''} onChange={(e) => updateProduct(product.id, 'height', parseFloat(e.target.value) || 0)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Valance</label>
                          <input type="number" step="0.01" value={product.valance || ''} onChange={(e) => updateProduct(product.id, 'valance', parseFloat(e.target.value) || 0)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Sq Ft</label>
                          <div className="px-4 py-3 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded text-sm font-medium text-gray-900 dark:text-white">{product.sqFt.toFixed(2)}</div>
                        </div>
                        <div>
                          <label className={labelClass}>Lin Ft</label>
                          <div className="px-4 py-3 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded text-sm font-medium text-gray-900 dark:text-white">{product.linFt.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <button type="button" onClick={addProduct} className={addBtn}>+ Add Product</button>
                  <div className="flex gap-8">
                    <div><span className="text-gray-600 dark:text-gray-400">Total Sq Ft: </span><span className="font-bold text-gray-900 dark:text-white">{totalSqFt.toFixed(2)}</span></div>
                    <div><span className="text-gray-600 dark:text-gray-400">Total Lin Ft: </span><span className="font-bold text-gray-900 dark:text-white">{totalLinFt.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className={cardClass}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Materials</h2>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Tax Rate:</label>
                      <input type="number" step="0.25" value={materialsTaxRate * 100} onChange={(e) => setMaterialsTaxRate((parseFloat(e.target.value) || 0) / 100)} className={inputClass + " w-20 text-right"} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </div>
                  <button type="button" onClick={addMaterial} className={addBtn}>+ Add Row</button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 py-2 text-left text-gray-700 dark:text-gray-300">Description</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Qty</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-24">Unit $</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Tax</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Freight</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-24">Total</th>
                      <th className="px-2 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-2 py-1"><input type="text" value={m.description} onChange={(e) => updateMaterial(m.id, 'description', e.target.value)} className={inputClass} placeholder="Material" /></td>
                        <td className="px-2 py-1"><input type="number" value={m.qty || ''} onChange={(e) => updateMaterial(m.id, 'qty', parseFloat(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                        <td className="px-2 py-1"><input type="number" step="0.01" value={m.unitPrice || ''} onChange={(e) => updateMaterial(m.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                        <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-400">{formatCurrency(m.qty * m.unitPrice * materialsTaxRate)}</td>
                        <td className="px-2 py-1"><input type="number" step="0.01" value={m.freight || ''} onChange={(e) => updateMaterial(m.id, 'freight', parseFloat(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                        <td className="px-2 py-1 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(calcMaterialTotal(m))}</td>
                        <td className="px-2 py-1 text-center">{materials.length > 1 && <button type="button" onClick={() => removeMaterial(m.id)} className={deleteBtn}>×</button>}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                      <td className="px-2 py-1 font-medium text-gray-900 dark:text-white">Misc</td>
                      <td className="px-2 py-1"><input type="number" value={miscQty} onChange={(e) => setMiscQty(parseInt(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                      <td className="px-2 py-1"><input type="number" step="0.01" value={miscPrice} onChange={(e) => setMiscPrice(parseFloat(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                      <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-400">{formatCurrency(miscQty * miscPrice * materialsTaxRate)}</td>
                      <td className="px-2 py-1">-</td>
                      <td className="px-2 py-1 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(miscTotal)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30">
                      <td colSpan={5} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">Total Materials:</td>
                      <td className="px-2 py-2 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalMaterials)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Fabric */}
              <div className={cardClass}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Fabric</h2>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Tax Rate:</label>
                      <input type="number" step="0.25" value={fabricTaxRate * 100} onChange={(e) => setFabricTaxRate((parseFloat(e.target.value) || 0) / 100)} className={inputClass + " w-20 text-right"} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </div>
                  <button type="button" onClick={addFabric} className={addBtn}>+ Add Row</button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 py-2 text-left text-gray-700 dark:text-gray-300">Name / Description</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Yards</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-24">$/Yard</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Tax</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Freight</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-24">Total</th>
                      <th className="px-2 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fabricLines.map((f) => (
                      <tr key={f.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-2 py-1"><input type="text" value={f.name} onChange={(e) => updateFabric(f.id, 'name', e.target.value)} className={inputClass} placeholder="Fabric name" /></td>
                        <td className="px-2 py-1"><input type="number" step="0.01" value={f.yards || ''} onChange={(e) => updateFabric(f.id, 'yards', parseFloat(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                        <td className="px-2 py-1"><input type="number" step="0.01" value={f.pricePerYard || ''} onChange={(e) => updateFabric(f.id, 'pricePerYard', parseFloat(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                        <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-400">{formatCurrency(f.yards * f.pricePerYard * fabricTaxRate)}</td>
                        <td className="px-2 py-1"><input type="number" step="0.01" value={f.freight || ''} onChange={(e) => updateFabric(f.id, 'freight', parseFloat(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                        <td className="px-2 py-1 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(calcFabricTotal(f))}</td>
                        <td className="px-2 py-1 text-center">{fabricLines.length > 1 && <button type="button" onClick={() => removeFabric(f.id)} className={deleteBtn}>×</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30">
                      <td colSpan={5} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">Total Fabric:</td>
                      <td className="px-2 py-2 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalFabric)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Labor */}
              <div className={cardClass}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Fabrication Labor</h2>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Rate:</label>
                      <select
                        value={laborRate === LABOR_RATES.AGGRESSIVE || laborRate === LABOR_RATES.REGULAR || laborRate === LABOR_RATES.PREVAILING_WAGE ? laborRate : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'custom') return;
                          setLaborRate(parseFloat(e.target.value));
                        }}
                        className={inputClass + " w-32"}
                      >
                        <option value={LABOR_RATES.AGGRESSIVE}>Aggressive (${LABOR_RATES.AGGRESSIVE}/hr)</option>
                        <option value={LABOR_RATES.REGULAR}>Regular (${LABOR_RATES.REGULAR}/hr)</option>
                        <option value={LABOR_RATES.PREVAILING_WAGE}>Prevailing (${LABOR_RATES.PREVAILING_WAGE}/hr)</option>
                        <option value="custom">Custom Rate</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          step="1"
                          value={laborRate}
                          onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                          className={inputClass + " w-20 text-right"}
                          placeholder="$/hr"
                        />
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={addLabor} className={addBtn}>+ Add Row</button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 py-2 text-left text-gray-700 dark:text-gray-300 w-40">Type</th>
                      <th className="px-2 py-2 text-left text-gray-700 dark:text-gray-300">Description / Notes</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Hours</th>
                      <th className="px-2 py-2 text-center text-gray-700 dark:text-gray-300 w-20">Days</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">People</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Rate</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-24">Total</th>
                      <th className="px-2 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {laborLines.map((l) => (
                      <tr key={l.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-2 py-1"><input type="text" value={l.type} onChange={(e) => updateLabor(l.id, 'type', e.target.value)} className={inputClass} /></td>
                        <td className="px-2 py-1"><input type="text" value={l.description} onChange={(e) => updateLabor(l.id, 'description', e.target.value)} className={inputClass} placeholder="Notes..." /></td>
                        <td className="px-2 py-1"><input type="number" step="0.5" value={l.hours || ''} onChange={(e) => updateLabor(l.id, 'hours', parseFloat(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                        <td className="px-2 py-1 text-center text-xs text-blue-600 dark:text-blue-400 font-medium">{calculateDays(l.hours)}</td>
                        <td className="px-2 py-1"><input type="number" value={l.people === 0 ? '' : l.people} onChange={(e) => updateLabor(l.id, 'people', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)} className={getPeopleFieldClass(l.hours, l.people)} placeholder="1" /></td>
                        <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-400">${laborRate}</td>
                        <td className="px-2 py-1 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(calcLaborTotal(l))}</td>
                        <td className="px-2 py-1 text-center">{laborLines.length > 1 && <button type="button" onClick={() => removeLabor(l.id)} className={deleteBtn}>×</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                      <td colSpan={6} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">Fabrication Total:</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(totalFabricationLabor)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Installation */}
              <div className={cardClass}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Installation Labor</h2>
                  <button type="button" onClick={addInstall} className={addBtn}>+ Add Install</button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-orange-100 dark:bg-orange-900/30">
                    <tr>
                      <th className="px-2 py-2 text-left text-gray-700 dark:text-gray-300 w-40">Type</th>
                      <th className="px-2 py-2 text-left text-gray-700 dark:text-gray-300">Description / Notes</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Hours</th>
                      <th className="px-2 py-2 text-center text-gray-700 dark:text-gray-300 w-20">Days</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">People</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-20">Rate</th>
                      <th className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 w-24">Total</th>
                      <th className="px-2 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {installLines.map((l) => (
                      <tr key={l.id} className="border-t border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                        <td className="px-2 py-1"><input type="text" value={l.type} onChange={(e) => updateInstall(l.id, 'type', e.target.value)} className={inputClass} /></td>
                        <td className="px-2 py-1"><input type="text" value={l.description} onChange={(e) => updateInstall(l.id, 'description', e.target.value)} className={inputClass} placeholder="Notes..." /></td>
                        <td className="px-2 py-1"><input type="number" step="0.5" value={l.hours || ''} onChange={(e) => updateInstall(l.id, 'hours', parseFloat(e.target.value) || 0)} className={inputClass + " text-right"} /></td>
                        <td className="px-2 py-1 text-center text-xs text-orange-600 dark:text-orange-400 font-medium">{calculateDays(l.hours)}</td>
                        <td className="px-2 py-1"><input type="number" value={l.people === 0 ? '' : l.people} onChange={(e) => updateInstall(l.id, 'people', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)} className={getPeopleFieldClass(l.hours, l.people)} placeholder="1" /></td>
                        <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-400">${laborRate}</td>
                        <td className="px-2 py-1 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(calcLaborTotal(l))}</td>
                        <td className="px-2 py-1 text-center">{installLines.length > 1 && <button type="button" onClick={() => removeInstall(l.id)} className={deleteBtn}>×</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-orange-300 dark:border-orange-600 bg-orange-100 dark:bg-orange-900/30">
                      <td colSpan={6} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">Installation Total:</td>
                      <td className="px-2 py-2 text-right font-bold text-orange-700 dark:text-orange-300">{formatCurrency(totalInstallationLabor)}</td>
                      <td></td>
                    </tr>
                    <tr className="bg-blue-50 dark:bg-blue-900/30">
                      <td colSpan={6} className="px-2 py-2 text-right font-bold text-gray-900 dark:text-white">Total All Labor:</td>
                      <td className="px-2 py-2 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalLabor)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Markup */}
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-brand-text-primary">Subtotal & Markup</h2>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Subtotal</label>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(subtotalBeforeMarkup)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Materials + Fabric + Labor</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                    <label className={labelClass}>Markup %</label>
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.01" value={markup} onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)} className={inputClass + " w-24"} />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">= {(markup * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded border border-yellow-300 dark:border-yellow-700">
                    <label className="text-sm text-yellow-700 dark:text-yellow-300">Markup Value</label>
                    <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{formatCurrency(markupAmount)}</div>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded border-2 border-blue-300 dark:border-blue-600">
                    <label className="text-sm text-blue-700 dark:text-blue-300">Total with Markup</label>
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalWithMarkup)}</div>
                  </div>
                </div>
              </div>

              {/* Other Requirements */}
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-brand-text-primary">Other Requirements</h2>
                <p className="text-sm text-gray-500 dark:text-brand-text-secondary mb-4">Site-specific costs (excluded from pre-delivery pricing)</p>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div><label className={labelClass}>O/S Permit</label><input type="number" step="0.01" value={permitCost || ''} onChange={(e) => setPermitCost(parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                  <div><label className={labelClass}>Engineering</label><input type="number" step="0.01" value={engineeringCost || ''} onChange={(e) => setEngineeringCost(parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                  <div><label className={labelClass}>Equipment</label><input type="number" step="0.01" value={equipmentCost || ''} onChange={(e) => setEquipmentCost(parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                  <div><label className={labelClass}>Food</label><input type="number" step="0.01" value={foodCost || ''} onChange={(e) => setFoodCost(parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                </div>

                {/* Drive Time */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Drive Time</span>
                    <button type="button" onClick={addDriveTime} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">+ Add</button>
                  </div>
                  {driveTimeLines.map((d) => (
                    <div key={d.id} className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:mb-0 last:pb-0">
                      <div className="grid grid-cols-5 gap-2 mb-2">
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Trips</label><input type="number" value={d.trips || ''} onChange={(e) => updateDriveTime(d.id, 'trips', parseInt(e.target.value) || 0)} className={inputClass} /></div>
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Hrs/Trip</label><input type="number" step="0.5" value={d.hoursPerTrip || ''} onChange={(e) => updateDriveTime(d.id, 'hoursPerTrip', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">People</label><input type="number" value={d.people || ''} onChange={(e) => updateDriveTime(d.id, 'people', parseInt(e.target.value) || 0)} className={inputClass} /></div>
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Rate</label><input type="number" step="0.01" value={d.rate} onChange={(e) => updateDriveTime(d.id, 'rate', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1"><label className="text-xs text-gray-600 dark:text-gray-400">Total</label><div className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white">{formatCurrency(calcDriveTimeTotal(d))}</div></div>
                          {driveTimeLines.length > 1 && <button type="button" onClick={() => removeDriveTime(d.id)} className={deleteBtn + " mb-2"}>×</button>}
                        </div>
                      </div>
                      <div><input type="text" value={d.description} onChange={(e) => updateDriveTime(d.id, 'description', e.target.value)} className={inputClass} placeholder="Notes (e.g., purpose of trip, location)" /></div>
                    </div>
                  ))}
                </div>

                {/* Mileage */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Mileage</span>
                    <button type="button" onClick={addMileage} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">+ Add</button>
                  </div>
                  {mileageLines.map((m) => (
                    <div key={m.id} className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:mb-0 last:pb-0">
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Roundtrip Miles</label><input type="number" step="0.1" value={m.roundtripMiles || ''} onChange={(e) => updateMileage(m.id, 'roundtripMiles', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Trips</label><input type="number" value={m.trips || ''} onChange={(e) => updateMileage(m.id, 'trips', parseInt(e.target.value) || 0)} className={inputClass} /></div>
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Rate/Mile</label><input type="number" step="0.01" value={m.rate} onChange={(e) => updateMileage(m.id, 'rate', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1"><label className="text-xs text-gray-600 dark:text-gray-400">Total</label><div className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white">{formatCurrency(calcMileageTotal(m))}</div></div>
                          {mileageLines.length > 1 && <button type="button" onClick={() => removeMileage(m.id)} className={deleteBtn + " mb-2"}>×</button>}
                        </div>
                      </div>
                      <div><input type="text" value={m.description} onChange={(e) => updateMileage(m.id, 'description', e.target.value)} className={inputClass} placeholder="Notes (e.g., destination, purpose)" /></div>
                    </div>
                  ))}
                </div>

                {/* Hotel */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Hotel</span>
                    <button type="button" onClick={addHotel} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">+ Add</button>
                  </div>
                  {hotelLines.map((h) => (
                    <div key={h.id} className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:mb-0 last:pb-0">
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Nights</label><input type="number" value={h.nights || ''} onChange={(e) => updateHotel(h.id, 'nights', parseInt(e.target.value) || 0)} className={inputClass} /></div>
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">People</label><input type="number" value={h.people || ''} onChange={(e) => updateHotel(h.id, 'people', parseInt(e.target.value) || 0)} className={inputClass} /></div>
                        <div><label className="text-xs text-gray-600 dark:text-gray-400">Rate/Night</label><input type="number" step="0.01" value={h.rate || ''} onChange={(e) => updateHotel(h.id, 'rate', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1"><label className="text-xs text-gray-600 dark:text-gray-400">Total</label><div className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white">{formatCurrency(calcHotelTotal(h))}</div></div>
                          {hotelLines.length > 1 && <button type="button" onClick={() => removeHotel(h.id)} className={deleteBtn + " mb-2"}>×</button>}
                        </div>
                      </div>
                      <div><input type="text" value={h.description} onChange={(e) => updateHotel(h.id, 'description', e.target.value)} className={inputClass} placeholder="Notes (e.g., hotel name, location)" /></div>
                    </div>
                  ))}
                </div>

                <div className="text-right bg-orange-100 dark:bg-orange-900/30 p-4 rounded border border-orange-300 dark:border-orange-600">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white mr-4">Total Other Requirements:</span>
                  <span className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(totalOtherRequirements)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => router.push('/')} className="px-6 py-2.5 border border-gray-300 dark:border-brand-border-subtle bg-white dark:bg-brand-surface-grey-light rounded-button hover:bg-gray-100 dark:hover:brightness-110 text-gray-700 dark:text-brand-text-primary font-medium transition-all duration-200 hover:shadow-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-8 py-2.5 bg-blue-600 dark:bg-brand-google-blue text-white rounded-button hover:bg-blue-700 dark:hover:bg-brand-google-blue-hover disabled:opacity-50 font-medium transition-all duration-200 hover:shadow-lg">
                  {saving ? 'Saving...' : (isEditing ? 'Update Cost Sheet' : 'Save Cost Sheet')}
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* Pre-Delivery Pricing */}
                <div className={cardClass}>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">Pre-Delivery Pricing</h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-input border-2 ${getGuardrailColor(pricePerSqFtPreDelivery, avgSqFtPrice)}`}>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Price per Sq Ft</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{pricePerSqFtPreDelivery ? formatCurrency(pricePerSqFtPreDelivery) : '-'}</div>
                      {avgSqFtPrice > 0 && <div className="text-xs text-gray-600 dark:text-gray-400">Avg: {formatCurrency(avgSqFtPrice)} | {getGuardrailText(pricePerSqFtPreDelivery, avgSqFtPrice)}</div>}
                    </div>
                    <div className={`p-3 rounded-input border-2 ${getGuardrailColor(pricePerLinFtPreDelivery, avgLinFtPrice)}`}>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Price per Lin Ft</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{pricePerLinFtPreDelivery ? formatCurrency(pricePerLinFtPreDelivery) : '-'}</div>
                      {avgLinFtPrice > 0 && <div className="text-xs text-gray-600 dark:text-gray-400">Avg: {formatCurrency(avgLinFtPrice)} | {getGuardrailText(pricePerLinFtPreDelivery, avgLinFtPrice)}</div>}
                    </div>
                  </div>
                </div>

                {/* Final Totals */}
                <div className={cardClass}>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Materials:</span><span className="text-gray-900 dark:text-white">{formatCurrency(totalMaterials)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Fabric:</span><span className="text-gray-900 dark:text-white">{formatCurrency(totalFabric)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Labor:</span><span className="text-gray-900 dark:text-white">{formatCurrency(totalLabor)}</span></div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2"><span className="text-gray-600 dark:text-gray-400">Subtotal:</span><span className="text-gray-900 dark:text-white">{formatCurrency(subtotalBeforeMarkup)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Markup ({(markup * 100).toFixed(0)}%):</span><span className="text-gray-900 dark:text-white">{formatCurrency(markupAmount)}</span></div>
                    <div className={`flex justify-between p-2 rounded-input -mx-2 border ${getGuardrailColor(pricePerSqFtPreDelivery, avgSqFtPrice).replace('border-2', 'border')}`}><span className="font-semibold text-gray-900 dark:text-white">Pre-Delivery:</span><span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalWithMarkup)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Other Reqs:</span><span className="text-gray-900 dark:text-white">{formatCurrency(totalOtherRequirements)}</span></div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2"><span className="font-semibold text-gray-900 dark:text-white">Grand Total:</span><span className="font-bold text-gray-900 dark:text-white">{formatCurrency(grandTotal)}</span></div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-xs text-gray-600 dark:text-gray-400">Adjust Final Price</label>
                    <input type="number" step="0.01" value={finalPriceOverride || ''} onChange={(e) => setFinalPriceOverride(parseFloat(e.target.value) || null)} className={inputClass + " mt-1"} placeholder="Override total price" />
                    {finalPriceOverride && finalPriceOverride > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        $/sqft: {pricePerSqFtFinal ? formatCurrency(pricePerSqFtFinal) : '-'} | $/linft: {pricePerLinFtFinal ? formatCurrency(pricePerLinFtFinal) : '-'}
                      </div>
                    )}
                  </div>

                  <div className={`mt-4 p-3 rounded-input border-2 ${getGuardrailColor(pricePerSqFtFinal, avgSqFtPrice)}`}>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Price to Client</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalPriceToClient)}</div>
                    {avgSqFtPrice > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {getGuardrailText(pricePerSqFtFinal, avgSqFtPrice)} • {pricePerSqFtFinal ? formatCurrency(pricePerSqFtFinal) : '-'}/sqft
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className={cardClass}>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">Price Legend</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 dark:bg-green-900/50 border-2 border-green-400"></div><span className="text-gray-600 dark:text-gray-400">Good - within 15%</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 dark:bg-red-900/50 border-2 border-red-400"></div><span className="text-gray-600 dark:text-gray-400">High - 15%+ above</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-400"></div><span className="text-gray-600 dark:text-gray-400">Low - 15%+ below</span></div>
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

export default function NewCostSheet() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-brand-deep-black"><div className="text-xl text-gray-900 dark:text-brand-text-primary animate-pulse">Loading...</div></div>}>
      <CostSheetForm />
    </Suspense>
  );
}

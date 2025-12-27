'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  AdminConfig,
  getAdminConfig,
  saveAdminConfig,
  resetAdminConfig,
  exportConfig,
  importConfig,
  exportCostSheets,
  importCostSheets,
  DEFAULT_CONFIG
} from '@/lib/adminConfig';

type TabType = 'categories' | 'labor' | 'defaults' | 'materials' | 'salesreps' | 'data';

export default function AdminPage() {
  const [config, setConfig] = useState<AdminConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingLaborType, setEditingLaborType] = useState<number | null>(null);
  const [editingLaborRate, setEditingLaborRate] = useState<number | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<number | null>(null);
  const [editingFabric, setEditingFabric] = useState<number | null>(null);
  const [editingSalesRep, setEditingSalesRep] = useState<number | null>(null);
  const configFileInputRef = useRef<HTMLInputElement>(null);
  const dataFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfig(getAdminConfig());
  }, []);

  const updateConfig = (newConfig: AdminConfig) => {
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveAdminConfig(config);
    setHasChanges(false);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      const defaultConfig = resetAdminConfig();
      setConfig(defaultConfig);
      setHasChanges(false);
      setSaveMessage('Settings reset to defaults.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleConfigImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = importConfig(content);
      if (imported) {
        setConfig(imported);
        setHasChanges(false);
        setSaveMessage('Configuration imported successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        alert('Failed to import configuration. Invalid file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDataImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importCostSheets(content)) {
        setSaveMessage('Cost sheets imported successfully! Refresh the dashboard to see changes.');
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        alert('Failed to import cost sheets. Invalid file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Category management
  const addCategory = () => {
    const name = prompt('Enter new category name:');
    if (name && name.trim()) {
      updateConfig({
        ...config,
        categories: [...config.categories, name.trim()]
      });
    }
  };

  const updateCategory = (index: number, newName: string) => {
    const updated = [...config.categories];
    updated[index] = newName;
    updateConfig({ ...config, categories: updated });
    setEditingCategory(null);
  };

  const deleteCategory = (index: number) => {
    if (confirm(`Delete category "${config.categories[index]}"? Existing cost sheets with this category will not be affected.`)) {
      updateConfig({
        ...config,
        categories: config.categories.filter((_, i) => i !== index)
      });
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= config.categories.length) return;
    const updated = [...config.categories];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updateConfig({ ...config, categories: updated });
  };

  // Labor type management
  const addLaborType = () => {
    const name = prompt('Enter new labor type:');
    if (name && name.trim()) {
      updateConfig({
        ...config,
        laborTypes: [...config.laborTypes, name.trim()]
      });
    }
  };

  const updateLaborType = (index: number, newName: string) => {
    const updated = [...config.laborTypes];
    updated[index] = newName;
    updateConfig({ ...config, laborTypes: updated });
    setEditingLaborType(null);
  };

  const deleteLaborType = (index: number) => {
    if (confirm(`Delete labor type "${config.laborTypes[index]}"?`)) {
      updateConfig({
        ...config,
        laborTypes: config.laborTypes.filter((_, i) => i !== index)
      });
    }
  };

  // Labor rate management
  const addLaborRate = () => {
    const name = prompt('Enter rate name (e.g., "Premium"):');
    if (name && name.trim()) {
      const rate = prompt('Enter hourly rate:');
      if (rate && !isNaN(parseFloat(rate))) {
        updateConfig({
          ...config,
          laborRates: [...config.laborRates, { name: name.trim(), rate: parseFloat(rate) }]
        });
      }
    }
  };

  const updateLaborRate = (index: number, field: 'name' | 'rate', value: string) => {
    const updated = [...config.laborRates];
    if (field === 'name') {
      updated[index] = { ...updated[index], name: value };
    } else {
      updated[index] = { ...updated[index], rate: parseFloat(value) || 0 };
    }
    updateConfig({ ...config, laborRates: updated });
  };

  const deleteLaborRate = (index: number) => {
    if (config.laborRates.length <= 1) {
      alert('You must have at least one labor rate.');
      return;
    }
    if (confirm(`Delete labor rate "${config.laborRates[index].name}"?`)) {
      updateConfig({
        ...config,
        laborRates: config.laborRates.filter((_, i) => i !== index)
      });
    }
  };

  // Material preset management
  const addMaterialPreset = () => {
    const description = prompt('Enter material description:');
    if (description && description.trim()) {
      const price = prompt('Enter unit price:');
      if (price && !isNaN(parseFloat(price))) {
        updateConfig({
          ...config,
          materialPresets: [...config.materialPresets, { description: description.trim(), unitPrice: parseFloat(price) }]
        });
      }
    }
  };

  const updateMaterialPreset = (index: number, field: 'description' | 'unitPrice', value: string) => {
    const updated = [...config.materialPresets];
    if (field === 'description') {
      updated[index] = { ...updated[index], description: value };
    } else {
      updated[index] = { ...updated[index], unitPrice: parseFloat(value) || 0 };
    }
    updateConfig({ ...config, materialPresets: updated });
  };

  const deleteMaterialPreset = (index: number) => {
    if (confirm(`Delete material preset "${config.materialPresets[index].description}"?`)) {
      updateConfig({
        ...config,
        materialPresets: config.materialPresets.filter((_, i) => i !== index)
      });
    }
  };

  // Fabric preset management
  const addFabricPreset = () => {
    const name = prompt('Enter fabric name:');
    if (name && name.trim()) {
      const price = prompt('Enter price per yard:');
      if (price && !isNaN(parseFloat(price))) {
        updateConfig({
          ...config,
          fabricPresets: [...config.fabricPresets, { name: name.trim(), pricePerYard: parseFloat(price) }]
        });
      }
    }
  };

  const updateFabricPreset = (index: number, field: 'name' | 'pricePerYard', value: string) => {
    const updated = [...config.fabricPresets];
    if (field === 'name') {
      updated[index] = { ...updated[index], name: value };
    } else {
      updated[index] = { ...updated[index], pricePerYard: parseFloat(value) || 0 };
    }
    updateConfig({ ...config, fabricPresets: updated });
  };

  const deleteFabricPreset = (index: number) => {
    if (confirm(`Delete fabric preset "${config.fabricPresets[index].name}"?`)) {
      updateConfig({
        ...config,
        fabricPresets: config.fabricPresets.filter((_, i) => i !== index)
      });
    }
  };

  // Sales rep management
  const addSalesRep = () => {
    const name = prompt('Enter sales rep / estimator name:');
    if (name && name.trim()) {
      updateConfig({
        ...config,
        salesReps: [...config.salesReps, name.trim()]
      });
    }
  };

  const updateSalesRep = (index: number, newName: string) => {
    const updated = [...config.salesReps];
    updated[index] = newName;
    updateConfig({ ...config, salesReps: updated });
    setEditingSalesRep(null);
  };

  const deleteSalesRep = (index: number) => {
    if (confirm(`Remove "${config.salesReps[index]}" from sales reps list?`)) {
      updateConfig({
        ...config,
        salesReps: config.salesReps.filter((_, i) => i !== index)
      });
    }
  };

  // Default value updates
  const updateDefault = (field: keyof AdminConfig['defaults'], value: number) => {
    updateConfig({
      ...config,
      defaults: { ...config.defaults, [field]: value }
    });
  };

  const inputClass = "w-full border border-gray-300 dark:border-transparent rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-brand-mint bg-white dark:bg-brand-surface-grey-dark text-gray-900 dark:text-brand-text-primary";
  const buttonClass = "px-4 py-2 text-sm font-medium rounded transition-all duration-200";
  const primaryButtonClass = `${buttonClass} bg-blue-600 dark:bg-brand-google-blue text-white hover:bg-blue-700 dark:hover:bg-brand-google-blue-hover`;
  const secondaryButtonClass = `${buttonClass} bg-gray-100 dark:bg-brand-surface-grey-light text-gray-700 dark:text-brand-text-primary hover:bg-gray-200 dark:hover:brightness-110`;
  const dangerButtonClass = `${buttonClass} bg-red-600 text-white hover:bg-red-700`;
  const iconButtonClass = "p-1.5 rounded hover:bg-gray-100 dark:hover:bg-brand-surface-grey-light transition-colors";

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'categories', label: 'Categories', icon: 'M4 6h16M4 12h16M4 18h16' },
    { id: 'labor', label: 'Labor', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'defaults', label: 'Defaults', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'materials', label: 'Materials & Fabric', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'salesreps', label: 'Sales Reps', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'data', label: 'Data', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-brand-surface-black border-b border-gray-200 dark:border-brand-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-h1 text-gray-900 dark:text-brand-text-primary">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-600 dark:text-brand-text-secondary mt-1">
                  Manage categories, rates, and settings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveMessage && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium animate-fade-in">
                  {saveMessage}
                </span>
              )}
              {hasChanges && (
                <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleReset}
                className={secondaryButtonClass}
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`${primaryButtonClass} ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-56 flex-shrink-0">
            <nav className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brand-surface-grey-dark border-l-4 border-transparent'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-brand-surface-black rounded-card border border-gray-200 dark:border-brand-border-subtle p-6">
              {/* Categories Tab */}
              {activeTab === 'categories' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Product Categories</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage the list of product categories available in cost sheets.</p>
                    </div>
                    <button onClick={addCategory} className={primaryButtonClass}>
                      + Add Category
                    </button>
                  </div>

                  <div className="space-y-2">
                    {config.categories.map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-brand-surface-grey-dark rounded border border-gray-200 dark:border-brand-border-subtle group"
                      >
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveCategory(index, 'up')}
                            disabled={index === 0}
                            className={`${iconButtonClass} ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveCategory(index, 'down')}
                            disabled={index === config.categories.length - 1}
                            className={`${iconButtonClass} ${index === config.categories.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-gray-400 dark:text-gray-500 text-sm w-6">{index + 1}.</span>
                        {editingCategory === index ? (
                          <input
                            type="text"
                            defaultValue={category}
                            onBlur={(e) => updateCategory(index, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateCategory(index, e.currentTarget.value);
                              if (e.key === 'Escape') setEditingCategory(null);
                            }}
                            autoFocus
                            className={`${inputClass} flex-1`}
                          />
                        ) : (
                          <span
                            className="flex-1 text-gray-900 dark:text-brand-text-primary cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setEditingCategory(index)}
                          >
                            {category}
                          </span>
                        )}
                        <button
                          onClick={() => setEditingCategory(index)}
                          className={iconButtonClass}
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteCategory(index)}
                          className={`${iconButtonClass} hover:bg-red-100 dark:hover:bg-red-900/30`}
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labor Tab */}
              {activeTab === 'labor' && (
                <div className="space-y-8">
                  {/* Labor Types */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Labor Types</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Types of labor that can be added to cost sheets.</p>
                      </div>
                      <button onClick={addLaborType} className={primaryButtonClass}>
                        + Add Labor Type
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {config.laborTypes.map((type, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-brand-surface-grey-dark rounded border border-gray-200 dark:border-brand-border-subtle"
                        >
                          {editingLaborType === index ? (
                            <input
                              type="text"
                              defaultValue={type}
                              onBlur={(e) => updateLaborType(index, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateLaborType(index, e.currentTarget.value);
                                if (e.key === 'Escape') setEditingLaborType(null);
                              }}
                              autoFocus
                              className={`${inputClass} flex-1`}
                            />
                          ) : (
                            <span
                              className="flex-1 text-gray-900 dark:text-brand-text-primary cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => setEditingLaborType(index)}
                            >
                              {type}
                            </span>
                          )}
                          <button
                            onClick={() => setEditingLaborType(index)}
                            className={iconButtonClass}
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteLaborType(index)}
                            className={`${iconButtonClass} hover:bg-red-100 dark:hover:bg-red-900/30`}
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Labor Rates */}
                  <div className="pt-6 border-t border-gray-200 dark:border-brand-border-subtle">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Labor Rates</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hourly rate options for labor calculations.</p>
                      </div>
                      <button onClick={addLaborRate} className={primaryButtonClass}>
                        + Add Rate
                      </button>
                    </div>

                    <div className="space-y-2">
                      {config.laborRates.map((rate, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-brand-surface-grey-dark rounded border border-gray-200 dark:border-brand-border-subtle"
                        >
                          {editingLaborRate === index ? (
                            <>
                              <input
                                type="text"
                                defaultValue={rate.name}
                                onBlur={(e) => updateLaborRate(index, 'name', e.target.value)}
                                className={`${inputClass} w-40`}
                                placeholder="Rate name"
                              />
                              <span className="text-gray-500">$</span>
                              <input
                                type="number"
                                defaultValue={rate.rate}
                                onBlur={(e) => {
                                  updateLaborRate(index, 'rate', e.target.value);
                                  setEditingLaborRate(null);
                                }}
                                className={`${inputClass} w-24`}
                                placeholder="Rate"
                              />
                              <span className="text-gray-500 dark:text-gray-400">/hr</span>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-gray-900 dark:text-brand-text-primary font-medium">{rate.name}</span>
                              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">${rate.rate.toFixed(2)}/hr</span>
                            </>
                          )}
                          <button
                            onClick={() => setEditingLaborRate(index)}
                            className={iconButtonClass}
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteLaborRate(index)}
                            className={`${iconButtonClass} hover:bg-red-100 dark:hover:bg-red-900/30`}
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Defaults Tab */}
              {activeTab === 'defaults' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary mb-2">Default Values</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">These values will be pre-filled when creating new cost sheets.</p>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sales Tax Rate (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={(config.defaults.salesTax * 100).toFixed(2)}
                          onChange={(e) => updateDefault('salesTax', parseFloat(e.target.value) / 100 || 0)}
                          className={inputClass}
                        />
                        <span className="text-gray-500 dark:text-gray-400">%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Current: {(config.defaults.salesTax * 100).toFixed(2)}%</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Markup Rate (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1"
                          value={(config.defaults.markup * 100).toFixed(0)}
                          onChange={(e) => updateDefault('markup', parseFloat(e.target.value) / 100 || 0)}
                          className={inputClass}
                        />
                        <span className="text-gray-500 dark:text-gray-400">%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Applied to materials + fabric + labor</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default Labor Rate ($/hr)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          step="1"
                          value={config.defaults.laborRate}
                          onChange={(e) => updateDefault('laborRate', parseFloat(e.target.value) || 0)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Drive Time Rate ($/hr)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          step="1"
                          value={config.defaults.driveTimeRate}
                          onChange={(e) => updateDefault('driveTimeRate', parseFloat(e.target.value) || 0)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mileage Rate ($/mile)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={config.defaults.mileageRate}
                          onChange={(e) => updateDefault('mileageRate', parseFloat(e.target.value) || 0)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hotel Rate ($/night)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          step="1"
                          value={config.defaults.hotelRate}
                          onChange={(e) => updateDefault('hotelRate', parseFloat(e.target.value) || 0)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Materials & Fabric Tab */}
              {activeTab === 'materials' && (
                <div className="space-y-8">
                  {/* Material Presets */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Material Presets</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick-add materials with preset prices.</p>
                      </div>
                      <button onClick={addMaterialPreset} className={primaryButtonClass}>
                        + Add Preset
                      </button>
                    </div>

                    <div className="space-y-2">
                      {config.materialPresets.map((material, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-brand-surface-grey-dark rounded border border-gray-200 dark:border-brand-border-subtle"
                        >
                          {editingMaterial === index ? (
                            <>
                              <input
                                type="text"
                                defaultValue={material.description}
                                onBlur={(e) => updateMaterialPreset(index, 'description', e.target.value)}
                                className={`${inputClass} flex-1`}
                                placeholder="Description"
                              />
                              <span className="text-gray-500">$</span>
                              <input
                                type="number"
                                defaultValue={material.unitPrice}
                                onBlur={(e) => {
                                  updateMaterialPreset(index, 'unitPrice', e.target.value);
                                  setEditingMaterial(null);
                                }}
                                className={`${inputClass} w-24`}
                                placeholder="Price"
                              />
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-gray-900 dark:text-brand-text-primary">{material.description}</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">${material.unitPrice.toFixed(2)}</span>
                            </>
                          )}
                          <button
                            onClick={() => setEditingMaterial(index)}
                            className={iconButtonClass}
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteMaterialPreset(index)}
                            className={`${iconButtonClass} hover:bg-red-100 dark:hover:bg-red-900/30`}
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fabric Presets */}
                  <div className="pt-6 border-t border-gray-200 dark:border-brand-border-subtle">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Fabric Presets</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pre-configured fabric types with pricing.</p>
                      </div>
                      <button onClick={addFabricPreset} className={primaryButtonClass}>
                        + Add Preset
                      </button>
                    </div>

                    <div className="space-y-2">
                      {config.fabricPresets.map((fabric, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-brand-surface-grey-dark rounded border border-gray-200 dark:border-brand-border-subtle"
                        >
                          {editingFabric === index ? (
                            <>
                              <input
                                type="text"
                                defaultValue={fabric.name}
                                onBlur={(e) => updateFabricPreset(index, 'name', e.target.value)}
                                className={`${inputClass} flex-1`}
                                placeholder="Fabric name"
                              />
                              <span className="text-gray-500">$</span>
                              <input
                                type="number"
                                defaultValue={fabric.pricePerYard}
                                onBlur={(e) => {
                                  updateFabricPreset(index, 'pricePerYard', e.target.value);
                                  setEditingFabric(null);
                                }}
                                className={`${inputClass} w-24`}
                                placeholder="$/yard"
                              />
                              <span className="text-gray-500 dark:text-gray-400">/yard</span>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-gray-900 dark:text-brand-text-primary">{fabric.name}</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">${fabric.pricePerYard.toFixed(2)}/yard</span>
                            </>
                          )}
                          <button
                            onClick={() => setEditingFabric(index)}
                            className={iconButtonClass}
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteFabricPreset(index)}
                            className={`${iconButtonClass} hover:bg-red-100 dark:hover:bg-red-900/30`}
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Reps Tab */}
              {activeTab === 'salesreps' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">Sales Reps / Estimators</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage the list of sales representatives and estimators.</p>
                    </div>
                    <button onClick={addSalesRep} className={primaryButtonClass}>
                      + Add Person
                    </button>
                  </div>

                  {config.salesReps.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-brand-surface-grey-dark rounded border border-dashed border-gray-300 dark:border-gray-600">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">No sales reps added yet</p>
                      <button onClick={addSalesRep} className={primaryButtonClass}>
                        Add Your First Sales Rep
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {config.salesReps.map((rep, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-brand-surface-grey-dark rounded border border-gray-200 dark:border-brand-border-subtle"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                              {rep.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {editingSalesRep === index ? (
                            <input
                              type="text"
                              defaultValue={rep}
                              onBlur={(e) => updateSalesRep(index, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateSalesRep(index, e.currentTarget.value);
                                if (e.key === 'Escape') setEditingSalesRep(null);
                              }}
                              autoFocus
                              className={`${inputClass} flex-1`}
                            />
                          ) : (
                            <span
                              className="flex-1 text-gray-900 dark:text-brand-text-primary cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => setEditingSalesRep(index)}
                            >
                              {rep}
                            </span>
                          )}
                          <button
                            onClick={() => setEditingSalesRep(index)}
                            className={iconButtonClass}
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteSalesRep(index)}
                            className={`${iconButtonClass} hover:bg-red-100 dark:hover:bg-red-900/30`}
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div className="space-y-8">
                  {/* Configuration Import/Export */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary mb-2">Configuration</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Export or import admin settings (categories, rates, defaults, etc.)</p>

                    <div className="flex gap-3">
                      <button onClick={exportConfig} className={secondaryButtonClass}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export Settings
                        </span>
                      </button>
                      <button
                        onClick={() => configFileInputRef.current?.click()}
                        className={secondaryButtonClass}
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Import Settings
                        </span>
                      </button>
                      <input
                        ref={configFileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleConfigImport}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Cost Sheet Data Import/Export */}
                  <div className="pt-6 border-t border-gray-200 dark:border-brand-border-subtle">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary mb-2">Cost Sheet Data</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Export all cost sheets for backup, or import from a previous backup.</p>

                    <div className="flex gap-3">
                      <button onClick={exportCostSheets} className={secondaryButtonClass}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export All Cost Sheets
                        </span>
                      </button>
                      <button
                        onClick={() => dataFileInputRef.current?.click()}
                        className={secondaryButtonClass}
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Import Cost Sheets
                        </span>
                      </button>
                      <input
                        ref={dataFileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleDataImport}
                        className="hidden"
                      />
                    </div>

                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Warning:</strong> Importing cost sheets will replace all existing data. Make sure to export your current data first.
                      </p>
                    </div>
                  </div>

                  {/* Reset All Data */}
                  <div className="pt-6 border-t border-gray-200 dark:border-brand-border-subtle">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Permanently delete all cost sheet data. This cannot be undone.</p>

                    <button
                      onClick={() => {
                        if (confirm('Are you absolutely sure you want to delete ALL cost sheet data? This cannot be undone.')) {
                          if (confirm('This is your last chance. All data will be permanently deleted.')) {
                            localStorage.removeItem('costSheets');
                            setSaveMessage('All cost sheet data has been deleted.');
                            setTimeout(() => setSaveMessage(null), 3000);
                          }
                        }
                      }}
                      className={dangerButtonClass}
                    >
                      Delete All Cost Sheet Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

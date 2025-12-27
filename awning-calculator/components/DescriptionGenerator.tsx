'use client';

import { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface ProductLine {
  name: string;
  width: number;
  projection: number;
  height: number;
  valance: number;
  sqFt: number;
  linFt: number;
}

interface DescriptionGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    category: string;
    customer: string;
    salesRep: string;
    project: string;
    jobSite: string;
    estimator: string;
  };
  products: ProductLine[];
  totals: {
    totalSqFt: number;
    totalLinFt: number;
    totalPriceToClient: number;
    pricePerSqFt: number | null;
    pricePerLinFt: number | null;
  };
}

type TemplateType = 'standard' | 'detailed' | 'quickbooks' | 'pandadocs';

interface Template {
  id: TemplateType;
  name: string;
  description: string;
}

const templates: Template[] = [
  { id: 'standard', name: 'Standard', description: 'Basic quote summary' },
  { id: 'detailed', name: 'Detailed', description: 'Full specifications' },
  { id: 'quickbooks', name: 'QuickBooks', description: 'Optimized for QB invoices' },
  { id: 'pandadocs', name: 'PandaDocs', description: 'Formatted for proposals' },
];

export function DescriptionGenerator({
  isOpen,
  onClose,
  formData,
  products,
  totals,
}: DescriptionGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('standard');
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [includePrice, setIncludePrice] = useState(true);
  const [includeDimensions, setIncludeDimensions] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const generateDescription = () => {
    const validProducts = products.filter(p => p.width > 0 || p.projection > 0 || p.sqFt > 0);

    let text = '';

    switch (selectedTemplate) {
      case 'standard':
        text = generateStandardTemplate(validProducts);
        break;
      case 'detailed':
        text = generateDetailedTemplate(validProducts);
        break;
      case 'quickbooks':
        text = generateQuickBooksTemplate(validProducts);
        break;
      case 'pandadocs':
        text = generatePandaDocsTemplate(validProducts);
        break;
    }

    setGeneratedText(text);
  };

  const generateStandardTemplate = (validProducts: ProductLine[]) => {
    let lines: string[] = [];

    lines.push(`${formData.category} - ${formData.project || formData.customer}`);
    lines.push('');

    if (formData.jobSite) {
      lines.push(`Location: ${formData.jobSite}`);
      lines.push('');
    }

    if (validProducts.length > 0 && includeDimensions) {
      lines.push('Specifications:');
      validProducts.forEach((p, i) => {
        const dims = [];
        if (p.width) dims.push(`${p.width}" W`);
        if (p.projection) dims.push(`${p.projection}" P`);
        if (p.height) dims.push(`${p.height}" H`);
        if (dims.length > 0) {
          lines.push(`  ${p.name || `Unit ${i + 1}`}: ${dims.join(' x ')}`);
        }
      });
      lines.push('');
    }

    if (totals.totalSqFt > 0 || totals.totalLinFt > 0) {
      if (totals.totalSqFt > 0) lines.push(`Total Sq. Ft.: ${totals.totalSqFt.toFixed(2)}`);
      if (totals.totalLinFt > 0) lines.push(`Total Lin. Ft.: ${totals.totalLinFt.toFixed(2)}`);
      lines.push('');
    }

    if (includePrice) {
      lines.push(`Quote Total: ${formatCurrency(totals.totalPriceToClient)}`);
    }

    return lines.join('\n');
  };

  const generateDetailedTemplate = (validProducts: ProductLine[]) => {
    let lines: string[] = [];

    lines.push('═══════════════════════════════════════');
    lines.push(`ESTIMATE: ${formData.category}`);
    lines.push('═══════════════════════════════════════');
    lines.push('');

    lines.push('PROJECT DETAILS');
    lines.push('───────────────');
    if (formData.customer) lines.push(`Customer: ${formData.customer}`);
    if (formData.project) lines.push(`Project: ${formData.project}`);
    if (formData.jobSite) lines.push(`Job Site: ${formData.jobSite}`);
    if (formData.salesRep) lines.push(`Sales Rep: ${formData.salesRep}`);
    if (formData.estimator) lines.push(`Estimator: ${formData.estimator}`);
    lines.push('');

    if (validProducts.length > 0 && includeDimensions) {
      lines.push('PRODUCT SPECIFICATIONS');
      lines.push('──────────────────────');
      validProducts.forEach((p, i) => {
        lines.push(`${p.name || `Product ${i + 1}`}:`);
        if (p.width) lines.push(`  Width: ${p.width}"`);
        if (p.projection) lines.push(`  Projection: ${p.projection}"`);
        if (p.height) lines.push(`  Height: ${p.height}"`);
        if (p.valance) lines.push(`  Valance: ${p.valance}"`);
        if (p.sqFt) lines.push(`  Square Feet: ${p.sqFt.toFixed(2)}`);
        if (p.linFt) lines.push(`  Linear Feet: ${p.linFt.toFixed(2)}`);
        lines.push('');
      });
    }

    lines.push('SUMMARY');
    lines.push('───────');
    if (totals.totalSqFt > 0) lines.push(`Total Square Footage: ${totals.totalSqFt.toFixed(2)} sq ft`);
    if (totals.totalLinFt > 0) lines.push(`Total Linear Footage: ${totals.totalLinFt.toFixed(2)} lin ft`);

    if (includePrice) {
      lines.push('');
      lines.push('PRICING');
      lines.push('───────');
      lines.push(`Total Quote: ${formatCurrency(totals.totalPriceToClient)}`);
      if (totals.pricePerSqFt) lines.push(`Price/Sq Ft: ${formatCurrency(totals.pricePerSqFt)}`);
      if (totals.pricePerLinFt) lines.push(`Price/Lin Ft: ${formatCurrency(totals.pricePerLinFt)}`);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════');

    return lines.join('\n');
  };

  const generateQuickBooksTemplate = (validProducts: ProductLine[]) => {
    let lines: string[] = [];

    // QuickBooks-friendly format - concise for invoice line items
    const productDesc = validProducts.length > 0 && includeDimensions
      ? validProducts.map(p => {
          const dims = [];
          if (p.width) dims.push(`${p.width}"W`);
          if (p.projection) dims.push(`${p.projection}"P`);
          return dims.length > 0 ? `${p.name || 'Unit'} (${dims.join('x')})` : p.name;
        }).join(', ')
      : '';

    lines.push(formData.category);
    if (productDesc) lines.push(productDesc);
    if (formData.project) lines.push(`Project: ${formData.project}`);
    if (formData.jobSite) lines.push(`Location: ${formData.jobSite}`);

    if (totals.totalSqFt > 0) {
      lines.push(`${totals.totalSqFt.toFixed(2)} sq ft`);
    }

    return lines.join(' | ');
  };

  const generatePandaDocsTemplate = (validProducts: ProductLine[]) => {
    let lines: string[] = [];

    // PandaDocs format - structured for proposals
    lines.push(`**${formData.category}**`);
    lines.push('');

    if (formData.customer || formData.project) {
      lines.push(`**Client:** ${formData.customer || formData.project}`);
    }

    if (formData.jobSite) {
      lines.push(`**Installation Address:** ${formData.jobSite}`);
    }
    lines.push('');

    if (validProducts.length > 0 && includeDimensions) {
      lines.push('**Scope of Work:**');
      lines.push('');
      validProducts.forEach((p, i) => {
        const dims = [];
        if (p.width) dims.push(`${p.width}" wide`);
        if (p.projection) dims.push(`${p.projection}" projection`);
        if (p.height) dims.push(`${p.height}" height`);

        lines.push(`• ${p.name || `Unit ${i + 1}`}${dims.length > 0 ? `: ${dims.join(', ')}` : ''}`);
      });
      lines.push('');
    }

    if (totals.totalSqFt > 0 || totals.totalLinFt > 0) {
      lines.push('**Total Coverage:**');
      if (totals.totalSqFt > 0) lines.push(`• ${totals.totalSqFt.toFixed(2)} square feet`);
      if (totals.totalLinFt > 0) lines.push(`• ${totals.totalLinFt.toFixed(2)} linear feet`);
      lines.push('');
    }

    if (includePrice) {
      lines.push('**Investment:**');
      lines.push(`**${formatCurrency(totals.totalPriceToClient)}**`);
    }

    return lines.join('\n');
  };

  useEffect(() => {
    if (isOpen) {
      generateDescription();
    }
  }, [isOpen, selectedTemplate, includePrice, includeDimensions]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Description" size="lg">
      <div className="space-y-4">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-2 text-left border rounded transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-white">
                  {template.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {template.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={includePrice}
              onChange={(e) => setIncludePrice(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Include pricing
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={includeDimensions}
              onChange={(e) => setIncludeDimensions(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Include dimensions
          </label>
        </div>

        {/* Generated Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Generated Description
          </label>
          <textarea
            value={generatedText}
            onChange={(e) => setGeneratedText(e.target.value)}
            rows={12}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={generateDescription}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Regenerate
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 text-sm text-white rounded transition-colors flex items-center gap-2 ${
                copied
                  ? 'bg-green-600'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-brand-google-blue dark:hover:bg-brand-google-blue-hover'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

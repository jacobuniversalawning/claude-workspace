// Admin configuration for Universal Awning Cost Sheet Calculator
// Stored in localStorage to allow admin editing without code changes

// AI Provider configuration
export interface AIProviderConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  maxTokens: number;
}

// Sales Rep with email
export interface SalesRep {
  name: string;
  email: string;
}

// HubSpot Integration configuration
export interface HubSpotConfig {
  enabled: boolean;
  accessToken: string;
  portalId: string;
}

// Google Maps configuration
export interface GoogleMapsConfig {
  enabled: boolean;
  apiKey: string;
}

export interface AdminConfig {
  // Product categories
  categories: string[];

  // Labor types for the cost sheet
  laborTypes: string[];

  // Labor rate options (name -> rate)
  laborRates: { name: string; rate: number }[];

  // Default values
  defaults: {
    salesTax: number;
    markup: number;
    laborRate: number;
    driveTimeRate: number;
    mileageRate: number;
    hotelRate: number;
  };

  // Material presets for quick add
  materialPresets: { description: string; unitPrice: number }[];

  // Sales rep / estimator list (now with name and email)
  salesReps: SalesRep[];

  // Fabric presets
  fabricPresets: { name: string; pricePerYard: number }[];

  // Home base address for distance calculations
  homeBaseAddress: string;

  // AI API configurations
  aiProviders: {
    claude: AIProviderConfig;
    openai: AIProviderConfig;
    gemini: AIProviderConfig;
    perplexity: AIProviderConfig;
  };

  // Default AI provider to use
  defaultAIProvider: 'claude' | 'openai' | 'gemini' | 'perplexity' | 'none';

  // HubSpot Integration
  hubspot: HubSpotConfig;

  // Google Maps Integration
  googleMaps: GoogleMapsConfig;
}

// Default configuration - matches the existing constants
export const DEFAULT_CONFIG: AdminConfig = {
  categories: [
    'Steel Awning',
    'Cantilevered Canopy',
    'Hip Roof Canopy',
    'Aluminum Canopy',
    'Steel Trellis',
    'Aluminum Trellis',
    'Fabric Panel',
    'Curtains',
    'Patio Awning',
    'Umbrellas',
    'Sail Shades',
    'Motorized Retractable',
    'Manual Retractable',
    'Bahama Style',
    'Carport',
    'Recover',
    'Slidewire Manual',
    'Slidewire Motorized',
    'Motorized Screen',
    '4K Trellis',
    'Green Screen',
    'Standing Seam Awning',
    'Aluminum Louvered Awning',
    '4K Wall Canopy',
    'Cabanas',
    'Other'
  ],
  laborTypes: [
    'Survey',
    'Shop Drawings',
    'Sewing',
    'Graphics',
    'Assembly',
    'Welding',
    'Paint Labor',
    'Installation 1',
    'Installation 2'
  ],
  laborRates: [
    { name: 'Aggressive', rate: 85 },
    { name: 'Regular', rate: 95 },
    { name: 'Prevailing Wage', rate: 160 }
  ],
  defaults: {
    salesTax: 0.0975,
    markup: 0.8,
    laborRate: 95,
    driveTimeRate: 75,
    mileageRate: 0.75,
    hotelRate: 150
  },
  materialPresets: [
    { description: 'Steel Tubing', unitPrice: 50 },
    { description: 'Aluminum Extrusion', unitPrice: 75 },
    { description: 'Hardware Kit', unitPrice: 150 },
    { description: 'Mounting Brackets', unitPrice: 25 },
    { description: 'Paint/Powder Coat', unitPrice: 200 },
    { description: 'Fasteners', unitPrice: 35 },
    { description: 'Sealant/Caulk', unitPrice: 15 },
    { description: 'Wiring/Electrical', unitPrice: 100 }
  ],
  salesReps: [],
  fabricPresets: [
    { name: 'Sunbrella Standard', pricePerYard: 25 },
    { name: 'Sunbrella Premium', pricePerYard: 35 },
    { name: 'Ferrari Soltis', pricePerYard: 45 },
    { name: 'Stamoid', pricePerYard: 40 },
    { name: 'Vinyl', pricePerYard: 15 }
  ],
  homeBaseAddress: '',
  aiProviders: {
    claude: {
      enabled: false,
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096
    },
    openai: {
      enabled: false,
      apiKey: '',
      model: 'gpt-4o',
      maxTokens: 4096
    },
    gemini: {
      enabled: false,
      apiKey: '',
      model: 'gemini-1.5-pro',
      maxTokens: 4096
    },
    perplexity: {
      enabled: false,
      apiKey: '',
      model: 'llama-3.1-sonar-large-128k-online',
      maxTokens: 4096
    }
  },
  defaultAIProvider: 'none',
  hubspot: {
    enabled: false,
    accessToken: '',
    portalId: ''
  },
  googleMaps: {
    enabled: false,
    apiKey: ''
  }
};

const ADMIN_CONFIG_KEY = 'adminConfig';

// Migrate old string[] salesReps to new SalesRep[] format
function migrateSalesReps(salesReps: (string | SalesRep)[]): SalesRep[] {
  if (!salesReps || !Array.isArray(salesReps)) return [];
  return salesReps.map(rep => {
    if (typeof rep === 'string') {
      return { name: rep, email: '' };
    }
    return rep;
  });
}

// Get admin configuration from localStorage
export function getAdminConfig(): AdminConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        defaults: { ...DEFAULT_CONFIG.defaults, ...parsed.defaults },
        aiProviders: {
          claude: { ...DEFAULT_CONFIG.aiProviders.claude, ...parsed.aiProviders?.claude },
          openai: { ...DEFAULT_CONFIG.aiProviders.openai, ...parsed.aiProviders?.openai },
          gemini: { ...DEFAULT_CONFIG.aiProviders.gemini, ...parsed.aiProviders?.gemini },
          perplexity: { ...DEFAULT_CONFIG.aiProviders.perplexity, ...parsed.aiProviders?.perplexity },
        },
        defaultAIProvider: parsed.defaultAIProvider || DEFAULT_CONFIG.defaultAIProvider,
        hubspot: { ...DEFAULT_CONFIG.hubspot, ...parsed.hubspot },
        googleMaps: { ...DEFAULT_CONFIG.googleMaps, ...parsed.googleMaps },
        salesReps: migrateSalesReps(parsed.salesReps || []),
      };
    }
  } catch (error) {
    console.error('Error loading admin config:', error);
  }

  return DEFAULT_CONFIG;
}

// Save admin configuration to localStorage
export function saveAdminConfig(config: AdminConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving admin config:', error);
  }
}

// Reset to default configuration
export function resetAdminConfig(): AdminConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
  return DEFAULT_CONFIG;
}

// Export config as JSON file
export function exportConfig(): void {
  const config = getAdminConfig();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `awning-calculator-config-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import config from JSON file
export function importConfig(jsonString: string): AdminConfig | null {
  try {
    const config = JSON.parse(jsonString) as AdminConfig;
    // Validate required fields
    if (!config.categories || !Array.isArray(config.categories)) {
      throw new Error('Invalid config: missing categories');
    }
    saveAdminConfig(config);
    return config;
  } catch (error) {
    console.error('Error importing config:', error);
    return null;
  }
}

// Export all cost sheet data
export function exportCostSheets(): void {
  try {
    const data = localStorage.getItem('costSheets');
    if (!data) {
      alert('No cost sheets to export');
      return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `awning-cost-sheets-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting cost sheets:', error);
  }
}

// Import cost sheet data
export function importCostSheets(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    localStorage.setItem('costSheets', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error importing cost sheets:', error);
    return false;
  }
}

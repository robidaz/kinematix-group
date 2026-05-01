export type VendorType = 'Software' | 'Hardware' | 'Services' | 'Hybrid';
export type ContractStatus = 'Active' | 'Prospect' | 'Under Review';

export interface Vendor {
  id: string;
  name: string;
  logo: string;
  type: VendorType;
  costScale: number; // 1–4
  reputation: number; // 0–5
  specializations: string[];
  founded: number;
  headquarters: string;
  employees: string;
  website: string;
  description: string;
  contractStatus: ContractStatus;
  annualSpend: number;
  renewalDate: string; // ISO date
  tags: string[];
}

export interface VendorFilter {
  type?: string;
  costScale?: { min?: number; max?: number };
  reputation?: { min?: number };
  specializations?: string[];
  contractStatus?: string;
  tags?: string[];
}

export interface AiFilterResult {
  filter: VendorFilter;
  summary: string;
  raw?: string;
}

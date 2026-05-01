export type VendorType = 'Software' | 'Hardware' | 'Services' | 'Hybrid';
export type ContractStatus = 'Active' | 'Under Review' | 'Inactive';
export type EmployeeRole = 'Sales' | 'Technical';

export interface Employee {
  name: string;
  role: EmployeeRole;
}

export interface Testimonial {
  feedback: string;
  employeeName: string;
  employeeRole: EmployeeRole;
}

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
  spendYTD: number | null;
  spendAllTime: number | null;
  dealsClosedYTD: number | null;
  dealsClosedAllTime: number | null;
  marginPct: number;
  grossProfitAllTime: number | null;
  renewalDate: string | null;
  tags: string[];
  testimonials: Testimonial[];
}

export interface VendorFilter {
  type?: string;
  costScale?: { min?: number; max?: number };
  reputation?: { min?: number };
  specializations?: string[];
  contractStatus?: string;
  tags?: string[];
  marginPct?: { min?: number };
}

export interface AiFilterResult {
  filter: VendorFilter;
  summary: string;
  raw?: string;
}

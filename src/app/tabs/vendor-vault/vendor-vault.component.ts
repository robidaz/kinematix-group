import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  GridModule,
  GridComponent,
  PageService,
  SortService,
  ToolbarService,
  ResizeService,
} from '@syncfusion/ej2-angular-grids';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { ProgressBarModule } from '@syncfusion/ej2-angular-progressbar';
import { ToastModule, ToastComponent } from '@syncfusion/ej2-angular-notifications';

import { Vendor, Employee } from '../../models/vendor';
import { VendorService } from '../../services/vendor.service';
import { AiAnalysisService } from '../../services/ai-analysis.service';

@Component({
  selector: 'app-vendor-vault',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    CommonModule,
    FormsModule,
    GridModule,
    ButtonModule,
    DialogModule,
    ProgressBarModule,
    ToastModule,
  ],
  providers: [PageService, SortService, ToolbarService, ResizeService],
  templateUrl: './vendor-vault.component.html',
  styleUrl: './vendor-vault.component.scss',
})
export class VendorVaultComponent implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly aiService = inject(AiAnalysisService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('grid', { static: false }) grid?: GridComponent;
  @ViewChild('toast', { static: false }) toast?: ToastComponent;

  allVendors: Vendor[] = [];
  visibleVendors: Vendor[] = [];
  employees: Employee[] = [];

  private readonly avatarBg = '521d80';

  promptValue = '';
  loading = false;
  aiSummary = '';

  filteredSuggestions: string[] = [];
  showSuggestions = false;

  selectedVendor: Vendor | null = null;
  detailVisible = false;

  // Testimonial form state
  showTestimonialForm = false;
  newTestimonialEmployee = '';
  newTestimonialRole = '';
  newTestimonialFeedback = '';

  readonly pageSettings = {
    pageSize: 15,
    pageSizes: [10, 15, 25, 50],
  };

  readonly toolbar = ['Search'];

  readonly toggleableColumns = [
    'Vendor', 'Testimonials', 'Type', 'Cost', 'Reputation',
    'Specializations', 'Contract', 'Renewal', 'Avg. Margin %',
    'Spend (YTD)', 'Spend (All-time)',
    'Deals (YTD)', 'Deals (All-time)',
    'Gross Profit (All-time)',
  ];

  readonly suggestions: string[] = [
    "Looking for a mid-range cybersecurity vendor with strong compliance support",
    "Need a cloud storage provider with low cost and high reputation",
    "Seeking identity management vendors suitable for a mid-sized enterprise",
    "Find hardware vendors with enterprise-grade support and active contracts",
    "Show me AI or ML platform vendors with a reputation above 4",
    "Which vendors specialize in zero trust network access?",
    "Low cost software vendors focused on endpoint protection",
    "Active contracts up for renewal in the next 6 months",
    "Hybrid vendors with specializations in both storage and security",
    "High reputation vendors with annual spend under $100,000",
    "Vendors founded after 2010 with a strong cloud focus",
    "Services vendors with expertise in compliance and risk management",
  ];

  readonly typePillClass: Record<string, string> = {
    Software: 'km-pill km-pill--blue',
    Hardware: 'km-pill km-pill--gray',
    Services: 'km-pill km-pill--teal',
    Hybrid: 'km-pill km-pill--purple',
  };

  readonly statusPillClass: Record<string, string> = {
    Active: 'km-pill km-pill--green',
    'Under Review': 'km-pill km-pill--blue',
    Inactive: 'km-pill km-pill--gray',
  };

  ngOnInit(): void {
    this.vendorService.load().subscribe({
      next: (vendors) => {
        this.allVendors = vendors;
        this.visibleVendors = [...vendors];
        this.cdr.markForCheck();
      },
      error: () => {
        this.showToast('Failed to load vendor catalog', 'error');
      },
    });

    this.http.get<Employee[]>('assets/data/employees.json').subscribe({
      next: (employees) => { this.employees = employees; },
    });
  }

  async runAnalysis(): Promise<void> {
    const query = this.promptValue.trim();
    if (!query) {
      this.showToast('Enter a description first.', 'warning');
      return;
    }
    this.loading = true;
    this.aiSummary = '';
    try {
      const result = await this.aiService.analyze(query, this.allVendors);
      this.visibleVendors = this.vendorService.applyFilter(this.allVendors, result.filter);
      this.aiSummary = result.summary;
      if (this.visibleVendors.length === 0) {
        this.showToast('No vendors matched the AI filter — try a different prompt.', 'warning');
      }
    } catch (err) {
      console.error(err);
      this.showToast('AI analysis failed. Falling back to local heuristic.', 'error');
      const fallback = this.aiService.localHeuristicFilter(query);
      this.visibleVendors = this.vendorService.applyFilter(this.allVendors, fallback.filter);
      this.aiSummary = fallback.summary;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onPromptInput(): void {
    const q = this.promptValue.trim().toLowerCase();
    this.filteredSuggestions = q.length === 0
      ? this.suggestions.slice(0, 6)
      : this.suggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 6);
    this.showSuggestions = this.filteredSuggestions.length > 0;
  }

  onPromptFocus(): void {
    this.filteredSuggestions = this.promptValue.trim()
      ? this.suggestions.filter(s => s.toLowerCase().includes(this.promptValue.trim().toLowerCase())).slice(0, 6)
      : this.suggestions.slice(0, 6);
    this.showSuggestions = this.filteredSuggestions.length > 0;
  }

  onPromptBlur(): void {
    setTimeout(() => { this.showSuggestions = false; }, 150);
  }

  selectSuggestion(s: string): void {
    this.promptValue = s;
    this.showSuggestions = false;
  }

  resetFilter(): void {
    this.promptValue = '';
    this.aiSummary = '';
    this.visibleVendors = [...this.allVendors];
  }

  onRowClick(args: { data?: Vendor }): void {
    if (!args?.data) return;
    this.openDetail(args.data);
  }

  openDetail(vendor: Vendor): void {
    this.selectedVendor = vendor;
    this.detailVisible = true;
    this.showTestimonialForm = false;
    this.resetTestimonialForm();
  }

  closeDetail(): void {
    this.detailVisible = false;
    this.selectedVendor = null;
    this.showTestimonialForm = false;
    this.resetTestimonialForm();
  }

  onEmployeeSelect(): void {
    const emp = this.employees.find(e => e.name === this.newTestimonialEmployee);
    this.newTestimonialRole = emp?.role ?? '';
  }

  submitTestimonial(): void {
    const feedback = this.newTestimonialFeedback.trim();
    if (!this.newTestimonialEmployee || !feedback) {
      this.showToast('Please select an employee and enter feedback.', 'warning');
      return;
    }
    if (!this.selectedVendor) return;

    this.selectedVendor.testimonials.push({
      feedback,
      employeeName: this.newTestimonialEmployee,
      employeeRole: this.newTestimonialRole as 'Sales' | 'Technical',
    });

    this.showTestimonialForm = false;
    this.resetTestimonialForm();
    this.cdr.markForCheck();
    this.showToast('Testimonial submitted. Thank you!', 'success');
  }

  resetTestimonialForm(): void {
    this.newTestimonialEmployee = '';
    this.newTestimonialRole = '';
    this.newTestimonialFeedback = '';
  }

  starString(rep: number): string {
    const full = Math.floor(rep);
    const half = rep - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  }

  costString(scale: number): string {
    const n = Math.max(1, Math.min(4, scale | 0));
    return '$'.repeat(n);
  }

  formatCurrency(value: number | null): string {
    if (value == null) return '—';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  formatNumber(value: number | null): string {
    if (value == null) return '—';
    return value.toLocaleString('en-US');
  }

  formatRenewalDate(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value; // returns 'TBD' as-is
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  onLogoError(event: Event, vendor: Vendor): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallback']) return;
    img.dataset['fallback'] = '1';
    const ua = encodeURIComponent(vendor.name);
    img.src = `https://ui-avatars.com/api/?name=${ua}&background=${this.avatarBg}&color=fff&bold=true&size=128`;
  }

  private showToast(content: string, level: 'success' | 'error' | 'warning' = 'success'): void {
    if (!this.toast) return;
    const cssClass = level === 'error' ? 'e-toast-danger' : level === 'warning' ? 'e-toast-warning' : 'e-toast-success';
    this.toast.show({ content, cssClass, timeOut: 4000 });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChartModule,
  AccumulationChartModule,
  ColumnSeriesService,
  BubbleSeriesService,
  LegendService,
  TooltipService,
  DataLabelService,
  CategoryService,
  AccumulationLegendService,
  AccumulationTooltipService,
  AccumulationDataLabelService,
} from '@syncfusion/ej2-angular-charts';
import { VendorService } from '../../services/vendor.service';

interface BubblePoint { x: number; y: number; size: number; }

@Component({
  selector: 'app-vendor-analytics',
  standalone: true,
  imports: [CommonModule, ChartModule, AccumulationChartModule],
  providers: [
    ColumnSeriesService,
    BubbleSeriesService,
    LegendService,
    TooltipService,
    DataLabelService,
    CategoryService,
    AccumulationLegendService,
    AccumulationTooltipService,
    AccumulationDataLabelService,
  ],
  templateUrl: './vendor-analytics.component.html',
  styleUrl: './vendor-analytics.component.scss',
})
export class VendorAnalyticsComponent implements OnInit {
  private readonly vendorService = inject(VendorService);

  ready = false;

  totalVendors = 0;
  totalSpendLabel = '';
  avgReputation = 0;
  activeCount = 0;

  statusData: { x: string; y: number; fill: string }[] = [];
  readonly statusLegend = { visible: true, position: 'Bottom' };
  readonly statusTooltip = { enable: true };
  readonly statusDataLabel = { visible: true, name: 'x', position: 'Outside', font: { size: '12px' } };

  typeSpendData: { x: string; y: number }[] = [];
  readonly spendXAxis = { valueType: 'Category', labelStyle: { size: '12px' } };
  readonly spendYAxis = { labelFormat: '${value}M', title: 'Spend (USD M)', titleStyle: { size: '12px' } };
  readonly spendTooltip = { enable: true, format: '${point.x}: $${point.y}M' };
  readonly spendCornerRadius = { topLeft: 4, topRight: 4 };

  softwareData: BubblePoint[] = [];
  hybridData: BubblePoint[] = [];
  hardwareData: BubblePoint[] = [];
  servicesData: BubblePoint[] = [];

  readonly repXAxis = { minimum: 2.9, maximum: 5.1, title: 'Reputation Score', titleStyle: { size: '12px' }, interval: 0.5 };
  readonly repYAxis = { labelFormat: '${value}K', title: 'Spend YTD (USD K)', titleStyle: { size: '12px' } };
  readonly bubbleLegend = { visible: true, position: 'Bottom' };
  readonly bubbleTooltip = { enable: true, format: '${series.name}<br/>Rep: ${point.x}<br/>Spend: $${point.y}K' };

  ngOnInit(): void {
    this.vendorService.load().subscribe(vendors => {
      this.totalVendors = vendors.length;
      const total = vendors.reduce((s, v) => s + (v.spendYTD ?? 0), 0);
      this.totalSpendLabel = '$' + (total / 1_000_000).toFixed(1) + 'M';
      this.avgReputation = +(vendors.reduce((s, v) => s + v.reputation, 0) / vendors.length).toFixed(1);
      this.activeCount = vendors.filter(v => v.contractStatus === 'Active').length;

      const sm: Record<string, number> = { Active: 0, 'Under Review': 0, Inactive: 0 };
      vendors.forEach(v => { sm[v.contractStatus] = (sm[v.contractStatus] ?? 0) + 1; });
      this.statusData = [
        { x: 'Active', y: sm['Active'], fill: '#4caf50' },
        { x: 'Under Review', y: sm['Under Review'], fill: '#3b82f6' },
        { x: 'Inactive', y: sm['Inactive'], fill: '#9e9e9e' },
      ];

      const tm: Record<string, number> = {};
      vendors.forEach(v => { tm[v.type] = (tm[v.type] ?? 0) + (v.spendYTD ?? 0); });
      this.typeSpendData = (['Services', 'Hardware', 'Hybrid', 'Software'] as const).map(t => ({
        x: t,
        y: +(tm[t] / 1_000_000).toFixed(1),
      }));

      vendors.forEach(v => {
        if (v.spendYTD == null) return;
        const pt: BubblePoint = { x: v.reputation, y: +(v.spendYTD / 1000).toFixed(1), size: v.costScale };
        if (v.type === 'Software') this.softwareData.push(pt);
        else if (v.type === 'Hybrid') this.hybridData.push(pt);
        else if (v.type === 'Hardware') this.hardwareData.push(pt);
        else this.servicesData.push(pt);
      });

      this.ready = true;
    });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Vendor, VendorFilter } from '../models/vendor';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly http = inject(HttpClient);
  private vendors$: Observable<Vendor[]> | null = null;

  load(): Observable<Vendor[]> {
    if (!this.vendors$) {
      this.vendors$ = this.http
        .get<Vendor[]>('assets/data/vendors.json')
        .pipe(shareReplay(1));
    }
    return this.vendors$;
  }

  /** Apply an AI-derived filter to a vendor list, in memory. */
  applyFilter(vendors: Vendor[], filter: VendorFilter | null | undefined): Vendor[] {
    if (!filter) return vendors;

    return vendors.filter((v) => {
      if (filter.type && v.type !== filter.type) return false;

      if (filter.contractStatus && v.contractStatus !== filter.contractStatus) {
        return false;
      }

      if (filter.costScale) {
        if (filter.costScale.min != null && v.costScale < filter.costScale.min) return false;
        if (filter.costScale.max != null && v.costScale > filter.costScale.max) return false;
      }

      if (filter.reputation?.min != null && v.reputation < filter.reputation.min) {
        return false;
      }

      if (filter.specializations?.length) {
        const wanted = filter.specializations.map((s) => s.toLowerCase());
        const have = v.specializations.map((s) => s.toLowerCase());
        const hit = wanted.some((w) => have.some((h) => h.includes(w) || w.includes(h)));
        if (!hit) return false;
      }

      if (filter.tags?.length) {
        const wanted = filter.tags.map((t) => t.toLowerCase());
        const have = v.tags.map((t) => t.toLowerCase());
        const hit = wanted.some((w) => have.includes(w));
        if (!hit) return false;
      }

      return true;
    });
  }
}
